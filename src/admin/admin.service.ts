import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CargarPaisDto } from './dto/cargar-pais.dto';
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';
import { CargarGolesDto } from './dto/cargar-goles.dto';
import { AgregarGolDto } from './dto/agregar-gol.dto';
import { RealtimeService } from '../realtime/realtime.service';
import { EstadoPartido } from '../realtime/realtime.events';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async cargarPais(dto: CargarPaisDto) {
    const pais = await this.prisma.pais.upsert({
      where: { nombre: dto.pais },
      update: { banderaUrl: dto.banderaUrl ?? undefined },
      create: { nombre: dto.pais, banderaUrl: dto.banderaUrl ?? null },
    });

    await this.prisma.jugador.deleteMany({
      where: { paisId: pais.id },
    });

    const jugadoresData = dto.jugadores.map((j) => ({
      paisId: pais.id,
      nombre: j.nombre,
      posicion: j.posicion,
      dorsal: j.dorsal,
      edad: j.edad ?? null,
    }));

    await this.prisma.jugador.createMany({
      data: jugadoresData,
    });

    const jugadoresCreados = await this.prisma.jugador.findMany({
      where: { paisId: pais.id },
      orderBy: { dorsal: 'asc' },
    });

    return {
      message: `País "${dto.pais}" cargado con ${jugadoresCreados.length} jugadores.`,
      pais,
      jugadores: jugadoresCreados,
    };
  }

  async actualizarPartido(id: number, dto: ActualizarPartidoDto) {
    const partido = await this.prisma.partido.findUnique({ where: { id } });

    if (!partido) {
      throw new NotFoundException(`Partido con ID ${id} no encontrado.`);
    }

    const actualizarMarcador =
      dto.golesLocal !== undefined && dto.golesVisitante !== undefined;

    // Estado: explícito por DTO; si no, un marcador nuevo sobre un partido
    // 'programado' implica que arrancó -> 'en_vivo'.
    const estado: EstadoPartido | undefined =
      (dto.estado as EstadoPartido | undefined) ??
      (actualizarMarcador && partido.estado === 'programado'
        ? 'en_vivo'
        : undefined);

    const partidoActualizado = await this.prisma.partido.update({
      where: { id },
      data: {
        ...(dto.golesLocal !== undefined && { golesLocal: dto.golesLocal }),
        ...(dto.golesVisitante !== undefined && {
          golesVisitante: dto.golesVisitante,
        }),
        ...(dto.bloqueado !== undefined && { bloqueado: dto.bloqueado }),
        ...(estado !== undefined && { estado }),
        ...(actualizarMarcador && { actualizadoPorAdmin: true }),
      },
    });

    if (actualizarMarcador) {
      await this.recalcularPuntos(id, dto.golesLocal!, dto.golesVisitante!);

      // Si es partido de fase de grupos, actualizar estadísticas del grupo
      if (partidoActualizado.grupo) {
        await this.actualizarEstadisticasGrupo(
          partidoActualizado,
          partido, // estado anterior
          dto.golesLocal!,
          dto.golesVisitante!,
        );
      }
    }

    // ── Emisiones real-time (post-commit) ──
    this.realtime.emitMatchUpdate({
      partidoId: partidoActualizado.id,
      golesLocal: partidoActualizado.golesLocal,
      golesVisitante: partidoActualizado.golesVisitante,
      estado: partidoActualizado.estado as EstadoPartido,
      bloqueado: partidoActualizado.bloqueado,
    });
    if (actualizarMarcador) {
      this.realtime.emitRankingUpdated();
      if (partidoActualizado.grupo) {
        this.realtime.emitGroupsUpdated();
      }
    }

    return {
      message: actualizarMarcador
        ? `Partido ${id} actualizado. Puntos recalculados para todos los pronósticos.`
        : `Partido ${id} actualizado.`,
      partido: partidoActualizado,
    };
  }

  /**
   * Actualiza la tabla de posiciones del grupo cuando se registra un resultado.
   * Si el partido ya tenía marcador anterior, revierte esas estadísticas primero.
   */
  private async actualizarEstadisticasGrupo(
    partido: any,
    partidoAnterior: any,
    golesLocal: number,
    golesVisitante: number,
  ) {
    const grupo = partido.grupo;
    if (!grupo) return;

    // Si ya tenía resultado anterior, revertirlo
    if (partidoAnterior.golesLocal !== null && partidoAnterior.golesVisitante !== null) {
      await this.revertirStatsGrupo(
        grupo,
        partidoAnterior.localId,
        partidoAnterior.visitanteId,
        partidoAnterior.golesLocal,
        partidoAnterior.golesVisitante,
      );
    }

    // Aplicar nuevo resultado
    const resLocal = golesLocal > golesVisitante ? 'G' : golesLocal === golesVisitante ? 'E' : 'P';
    const resVisitante = resLocal === 'G' ? 'P' : resLocal === 'P' ? 'G' : 'E';

    await this.aplicarStatsGrupo(grupo, partido.localId, golesLocal, golesVisitante, resLocal);
    await this.aplicarStatsGrupo(grupo, partido.visitanteId, golesVisitante, golesLocal, resVisitante);
  }

  private async aplicarStatsGrupo(
    grupo: string,
    paisId: number,
    gf: number,
    gc: number,
    resultado: string,
  ) {
    const puntos = resultado === 'G' ? 3 : resultado === 'E' ? 1 : 0;

    await this.prisma.grupo.updateMany({
      where: { nombre: grupo, paisId },
      data: {
        partidosJugados: { increment: 1 },
        ganados: { increment: resultado === 'G' ? 1 : 0 },
        empatados: { increment: resultado === 'E' ? 1 : 0 },
        perdidos: { increment: resultado === 'P' ? 1 : 0 },
        golesAFavor: { increment: gf },
        golesEnContra: { increment: gc },
        diferenciaGoles: { increment: gf - gc },
        puntos: { increment: puntos },
      },
    });
  }

  private async revertirStatsGrupo(
    grupo: string,
    localId: number,
    visitanteId: number,
    golesLocal: number,
    golesVisitante: number,
  ) {
    const resLocal = golesLocal > golesVisitante ? 'G' : golesLocal === golesVisitante ? 'E' : 'P';
    const resVisitante = resLocal === 'G' ? 'P' : resLocal === 'P' ? 'G' : 'E';

    const puntosLocal = resLocal === 'G' ? 3 : resLocal === 'E' ? 1 : 0;
    const puntosVisitante = resVisitante === 'G' ? 3 : resVisitante === 'E' ? 1 : 0;

    await this.prisma.grupo.updateMany({
      where: { nombre: grupo, paisId: localId },
      data: {
        partidosJugados: { decrement: 1 },
        ganados: { decrement: resLocal === 'G' ? 1 : 0 },
        empatados: { decrement: resLocal === 'E' ? 1 : 0 },
        perdidos: { decrement: resLocal === 'P' ? 1 : 0 },
        golesAFavor: { decrement: golesLocal },
        golesEnContra: { decrement: golesVisitante },
        diferenciaGoles: { decrement: golesLocal - golesVisitante },
        puntos: { decrement: puntosLocal },
      },
    });

    await this.prisma.grupo.updateMany({
      where: { nombre: grupo, paisId: visitanteId },
      data: {
        partidosJugados: { decrement: 1 },
        ganados: { decrement: resVisitante === 'G' ? 1 : 0 },
        empatados: { decrement: resVisitante === 'E' ? 1 : 0 },
        perdidos: { decrement: resVisitante === 'P' ? 1 : 0 },
        golesAFavor: { decrement: golesVisitante },
        golesEnContra: { decrement: golesLocal },
        diferenciaGoles: { decrement: golesVisitante - golesLocal },
        puntos: { decrement: puntosVisitante },
      },
    });
  }

  /**
   * Recalcula las estadísticas de todos los grupos desde cero
   * basándose en los resultados actuales de los partidos de fase de grupos.
   */
  async recalcularGrupos() {
    // Resetear todos los grupos a 0
    await this.prisma.grupo.updateMany({
      data: {
        puntos: 0,
        partidosJugados: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        golesAFavor: 0,
        golesEnContra: 0,
        diferenciaGoles: 0,
        tarjetasAmarillas: 0,
        tarjetasRojas: 0,
        fairPlayPuntos: 0,
      },
    });

    // Buscar todos los partidos de grupos con resultado
    const partidos = await this.prisma.partido.findMany({
      where: {
        fase: 'grupos',
        golesLocal: { not: null },
        golesVisitante: { not: null },
        grupo: { not: null },
      },
    });

    for (const partido of partidos) {
      const gl = partido.golesLocal!;
      const gv = partido.golesVisitante!;
      const grupo = partido.grupo!;

      const resLocal = gl > gv ? 'G' : gl === gv ? 'E' : 'P';
      const resVisitante = resLocal === 'G' ? 'P' : resLocal === 'P' ? 'G' : 'E';

      await this.aplicarStatsGrupo(grupo, partido.localId, gl, gv, resLocal);
      await this.aplicarStatsGrupo(grupo, partido.visitanteId, gv, gl, resVisitante);
    }

    this.realtime.emitGroupsUpdated();

    return {
      message: `Grupos recalculados. ${partidos.length} partidos procesados.`,
      partidosProcesados: partidos.length,
    };
  }

  /**
   * Recalcula los puntos de TODOS los pronósticos basándose en resultados actuales.
   */
  async recalcularTodosLosPuntos() {
    const partidosConResultado = await this.prisma.partido.findMany({
      where: {
        golesLocal: { not: null },
        golesVisitante: { not: null },
        actualizadoPorAdmin: true,
      },
    });

    let pronosticosActualizados = 0;

    for (const partido of partidosConResultado) {
      const pronosticos = await this.prisma.pronosticoPartido.findMany({
        where: { partidoId: partido.id },
      });

      for (const pronostico of pronosticos) {
        const puntos = this.calcularPuntos(
          pronostico.prediccionLocal,
          pronostico.prediccionVisitante,
          partido.golesLocal!,
          partido.golesVisitante!,
        );

        if (puntos !== pronostico.puntosGanados) {
          await this.prisma.pronosticoPartido.update({
            where: { id: pronostico.id },
            data: { puntosGanados: puntos },
          });
          pronosticosActualizados++;
        }
      }
    }

    // Recalcular puntos totales de cada usuario
    const usuarios = await this.prisma.usuario.findMany({ select: { id: true } });

    for (const usuario of usuarios) {
      const totalPuntos = await this.prisma.pronosticoPartido.aggregate({
        where: { usuarioId: usuario.id },
        _sum: { puntosGanados: true },
      });

      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { puntosTotales: totalPuntos._sum.puntosGanados ?? 0 },
      });
    }

    this.realtime.emitRankingUpdated();

    return {
      message: `Recálculo completado. ${pronosticosActualizados} pronósticos actualizados.`,
      partidosEvaluados: partidosConResultado.length,
      pronosticosActualizados,
    };
  }

  /**
   * Carga los goles de un partido. Reemplaza los goles existentes con la nueva lista.
   */
  async cargarGoles(partidoId: number, dto: CargarGolesDto) {
    const partido = await this.prisma.partido.findUnique({
      where: { id: partidoId },
      include: { local: true, visitante: true },
    });

    if (!partido) {
      throw new NotFoundException(`Partido con ID ${partidoId} no encontrado.`);
    }

    // Snapshot de goles previos para detectar los NUEVOS (multiset por firma).
    const golesPrevios = await this.prisma.golPartido.findMany({
      where: { partidoId },
    });
    const firma = (g: { jugadorId: number; minuto: number | null; tipo: string }) =>
      `${g.jugadorId}|${g.minuto ?? ''}|${g.tipo}`;
    const conteoPrevio = new Map<string, number>();
    for (const g of golesPrevios) {
      const k = firma(g);
      conteoPrevio.set(k, (conteoPrevio.get(k) ?? 0) + 1);
    }

    // Reemplazar goles
    await this.prisma.golPartido.deleteMany({ where: { partidoId } });
    if (dto.goles.length > 0) {
      await this.prisma.golPartido.createMany({
        data: dto.goles.map((g) => ({
          partidoId,
          jugadorId: g.jugadorId,
          minuto: g.minuto ?? null,
          tipo: g.tipo ?? 'normal',
        })),
      });
    }

    const golesCreados = await this.prisma.golPartido.findMany({
      where: { partidoId },
      include: {
        jugador: { select: { id: true, nombre: true, dorsal: true, paisId: true } },
      },
      orderBy: [{ minuto: 'asc' }, { id: 'asc' }],
    });

    // Marcador derivado de la lista (respeta autogol -> suma al rival).
    const equipoDeGol = (g: (typeof golesCreados)[number]): 'local' | 'visitante' | null => {
      const paisJugador = g.jugador.paisId;
      const beneficiado =
        g.tipo === 'autogol'
          ? paisJugador === partido.localId
            ? partido.visitanteId
            : partido.localId
          : paisJugador;
      if (beneficiado === partido.localId) return 'local';
      if (beneficiado === partido.visitanteId) return 'visitante';
      return null; // dato inconsistente: jugador no pertenece a ningún equipo del partido
    };
    let derivLocal = 0;
    let derivVisitante = 0;
    for (const g of golesCreados) {
      const eq = equipoDeGol(g);
      if (eq === 'local') derivLocal++;
      else if (eq === 'visitante') derivVisitante++;
    }
    const marcadorLocal = partido.golesLocal ?? derivLocal;
    const marcadorVisitante = partido.golesVisitante ?? derivVisitante;

    // Un gol registrado implica que el partido arrancó.
    let estado = partido.estado as EstadoPartido;
    if (estado === 'programado' && golesCreados.length > 0) {
      estado = 'en_vivo';
      await this.prisma.partido.update({
        where: { id: partidoId },
        data: { estado },
      });
    }

    // ── Emitir animación por cada gol NUEVO ──
    const conteoRestante = new Map(conteoPrevio);
    for (const g of golesCreados) {
      const k = firma(g);
      const restante = conteoRestante.get(k) ?? 0;
      if (restante > 0) {
        conteoRestante.set(k, restante - 1); // ya existía, no es nuevo
        continue;
      }
      const eq = equipoDeGol(g);
      if (!eq) continue; // no se puede atribuir -> no animar (pero queda guardado)
      const paisDelGol = eq === 'local' ? partido.local : partido.visitante;
      this.realtime.emitGoal({
        partidoId,
        equipo: eq,
        paisId: paisDelGol.id,
        paisNombre: paisDelGol.nombre,
        paisEscudo: paisDelGol.banderaUrl ?? null,
        jugador: g.jugador.nombre,
        jugadorId: g.jugador.id,
        minuto: g.minuto,
        tipo: g.tipo,
        golesLocal: marcadorLocal,
        golesVisitante: marcadorVisitante,
        localNombre: partido.local.nombre,
        visitanteNombre: partido.visitante.nombre,
      });
    }

    // Señal de cambio del partido (estado / goleadores).
    this.realtime.emitMatchUpdate({
      partidoId,
      golesLocal: partido.golesLocal,
      golesVisitante: partido.golesVisitante,
      estado,
      bloqueado: partido.bloqueado,
    });

    return {
      message: `${golesCreados.length} gol(es) cargados para ${partido.local.nombre} vs ${partido.visitante.nombre}.`,
      partidoId,
      goles: golesCreados,
    };
  }

  /** Equipo al que cuenta un gol (autogol cuenta al rival). null si no aplica. */
  private equipoDeGolPartido(
    partido: { localId: number; visitanteId: number },
    gol: { tipo: string; jugador: { paisId: number } },
  ): 'local' | 'visitante' | null {
    const paisJugador = gol.jugador.paisId;
    const beneficiado =
      gol.tipo === 'autogol'
        ? paisJugador === partido.localId
          ? partido.visitanteId
          : partido.localId
        : paisJugador;
    if (beneficiado === partido.localId) return 'local';
    if (beneficiado === partido.visitanteId) return 'visitante';
    return null;
  }

  /**
   * Registra UN goleador (jugador + minuto) y dispara el efecto de gol.
   * NO toca el marcador: lo controla football-data (live-sync).
   */
  async agregarGol(partidoId: number, dto: AgregarGolDto) {
    const partido = await this.prisma.partido.findUnique({
      where: { id: partidoId },
      include: { local: true, visitante: true },
    });
    if (!partido) {
      throw new NotFoundException(`Partido con ID ${partidoId} no encontrado.`);
    }

    const jugador = await this.prisma.jugador.findUnique({
      where: { id: dto.jugadorId },
    });
    if (!jugador) {
      throw new NotFoundException(`Jugador con ID ${dto.jugadorId} no encontrado.`);
    }
    if (jugador.paisId !== partido.localId && jugador.paisId !== partido.visitanteId) {
      throw new BadRequestException(
        'El jugador no pertenece a ninguno de los dos equipos del partido.',
      );
    }

    const golCreado = await this.prisma.golPartido.create({
      data: {
        partidoId,
        jugadorId: dto.jugadorId,
        minuto: dto.minuto ?? null,
        tipo: dto.tipo ?? 'normal',
      },
      include: {
        jugador: { select: { id: true, nombre: true, dorsal: true, paisId: true } },
      },
    });

    // El MARCADOR lo controla football-data (live-sync); aquí solo registramos
    // el goleador y disparamos el efecto con el marcador actual de la DB.
    const marcadorLocal = partido.golesLocal ?? 0;
    const marcadorVisitante = partido.golesVisitante ?? 0;

    const eq = this.equipoDeGolPartido(partido, golCreado);
    if (eq) {
      const paisDelGol = eq === 'local' ? partido.local : partido.visitante;
      this.realtime.emitGoal({
        partidoId,
        equipo: eq,
        paisId: paisDelGol.id,
        paisNombre: paisDelGol.nombre,
        paisEscudo: paisDelGol.banderaUrl ?? null,
        jugador: golCreado.jugador.nombre,
        jugadorId: golCreado.jugador.id,
        minuto: golCreado.minuto,
        tipo: golCreado.tipo,
        golesLocal: marcadorLocal,
        golesVisitante: marcadorVisitante,
        localNombre: partido.local.nombre,
        visitanteNombre: partido.visitante.nombre,
      });
    }
    // Refresca listas de goleadores en los clientes (sin tocar marcador/puntos).
    this.realtime.emitMatchUpdate({
      partidoId,
      golesLocal: partido.golesLocal,
      golesVisitante: partido.golesVisitante,
      estado: partido.estado as EstadoPartido,
      bloqueado: partido.bloqueado,
    });

    return {
      message: `Goleador registrado para ${partido.local.nombre} vs ${partido.visitante.nombre}.`,
      gol: golCreado,
    };
  }

  /**
   * Elimina (edita) un gol. Recalcula el marcador derivado, puntos y grupos,
   * y emite la actualización (sin efecto de gol).
   */
  async eliminarGol(golId: number) {
    const gol = await this.prisma.golPartido.findUnique({ where: { id: golId } });
    if (!gol) {
      throw new NotFoundException(`Gol con ID ${golId} no encontrado.`);
    }
    const partido = await this.prisma.partido.findUnique({
      where: { id: gol.partidoId },
      include: { local: true, visitante: true },
    });
    if (!partido) {
      throw new NotFoundException(`Partido del gol no encontrado.`);
    }

    await this.prisma.golPartido.delete({ where: { id: golId } });

    // El marcador lo controla football-data; solo refrescamos las listas.
    this.realtime.emitMatchUpdate({
      partidoId: partido.id,
      golesLocal: partido.golesLocal,
      golesVisitante: partido.golesVisitante,
      estado: partido.estado as EstadoPartido,
      bloqueado: partido.bloqueado,
    });

    return { message: `Gol ${golId} eliminado.` };
  }

  private async recalcularPuntos(
    partidoId: number,
    golesLocalReal: number,
    golesVisitanteReal: number,
  ) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const pronosticos = await tx.pronosticoPartido.findMany({
          where: { partidoId },
        });

        for (const pronostico of pronosticos) {
          const puntos = this.calcularPuntos(
            pronostico.prediccionLocal,
            pronostico.prediccionVisitante,
            golesLocalReal,
            golesVisitanteReal,
          );

          await tx.pronosticoPartido.update({
            where: { id: pronostico.id },
            data: { puntosGanados: puntos },
          });
        }

        const usuarios = await tx.pronosticoPartido.groupBy({
          by: ['usuarioId'],
          where: { partidoId },
        });

        for (const { usuarioId } of usuarios) {
          const totalPuntos = await tx.pronosticoPartido.aggregate({
            where: { usuarioId },
            _sum: { puntosGanados: true },
          });

          await tx.usuario.update({
            where: { id: usuarioId },
            data: { puntosTotales: totalPuntos._sum.puntosGanados ?? 0 },
          });
        }
      }, { timeout: 30000 });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al recalcular puntos. Transacción revertida.',
      );
    }
  }

  private calcularPuntos(
    predLocal: number,
    predVisitante: number,
    realLocal: number,
    realVisitante: number,
  ): number {
    if (predLocal === realLocal && predVisitante === realVisitante) {
      return 5;
    }

    const resultadoPred = Math.sign(predLocal - predVisitante);
    const resultadoReal = Math.sign(realLocal - realVisitante);

    if (resultadoPred === resultadoReal) {
      return 3;
    }

    return 0;
  }
}
