import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { MatchGoalPayload } from '../realtime/realtime.events';

/**
 * Construye y envía los mensajes "épicos" al grupo de WhatsApp:
 *  - Recordatorio X minutos antes de cada partido (con faltantes por predecir).
 *  - Aviso por cada gol, indicando a quién beneficia (exactos vs. por tendencia).
 *
 * El sistema de puntos del proyecto (ver AdminService.calcularPuntos):
 *   5 pts -> marcador EXACTO     |    3 pts -> acierta el RESULTADO (tendencia)
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly tz = process.env.TZ_LOCAL ?? 'America/Caracas';

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {}

  private formatHora(fecha: Date): string {
    try {
      return new Intl.DateTimeFormat('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: this.tz,
      }).format(fecha);
    } catch {
      return fecha.toISOString();
    }
  }

  /**
   * Recordatorio del próximo partido: hora + lista de quienes faltan por predecir.
   */
  async notificarProximoPartido(partidoId: number): Promise<void> {
    if (!this.whatsapp.habilitado) return;

    const partido = await this.prisma.partido.findUnique({
      where: { id: partidoId },
      include: { local: true, visitante: true },
    });
    if (!partido) return;

    const [usuarios, pronosticos] = await Promise.all([
      this.prisma.usuario.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.pronosticoPartido.findMany({
        where: { partidoId },
        select: { usuarioId: true },
      }),
    ]);

    const conPrediccion = new Set(pronosticos.map((p) => p.usuarioId));
    const faltantes = usuarios.filter((u) => !conPrediccion.has(u.id));
    const hora = this.formatHora(partido.fecha);

    const l: string[] = [];
    l.push('🏆⚽ *¡RECORDATORIOOO MUNDIALERO!* ⚽🏆');
    l.push('━━━━━━━━━━━━━━━━━━');
    l.push(`⏰ El próximo partido es a las *${hora}*`);
    l.push(`🔥 *${partido.local.nombre}* 🆚 *${partido.visitante.nombre}* 🔥`);
    l.push('');

    if (faltantes.length === 0) {
      l.push('🎉 ¡INCREÍBLE! TODOS ya hicieron su predicción.');
      l.push('🍿 A disfrutar el partidazo. ¡Que ruede el balón! ⚽');
    } else {
      l.push('⚠️ ¡CORRAN QUE SE CIERRA EL TELÓN! ⏳');
      l.push('Estos cracks aún NO han hecho su predicción:');
      l.push('');
      for (const f of faltantes) l.push(`   ❌ ${f.nombre}`);
      l.push('');
      l.push('🎯 ¡No dejen su quiniela en visto! 👀💥');
    }

    await this.whatsapp.enviarAlGrupo(l.join('\n'));
  }

  /**
   * Clasifica a los usuarios según el sistema de puntos contra un marcador dado:
   *   exactos (5 pts) | tendencia (3 pts) | sinPuntos (0 pts).
   */
  private async calcularBeneficiados(
    partidoId: number,
    realLocal: number,
    realVisitante: number,
  ): Promise<{ exactos: string[]; tendencia: string[]; sinPuntos: string[] }> {
    const pronosticos = await this.prisma.pronosticoPartido.findMany({
      where: { partidoId },
      include: { usuario: { select: { nombre: true, username: true } } },
    });

    const signReal = Math.sign(realLocal - realVisitante);
    const exactos: string[] = [];
    const tendencia: string[] = [];
    const sinPuntos: string[] = [];
    for (const p of pronosticos) {
      if (
        p.prediccionLocal === realLocal &&
        p.prediccionVisitante === realVisitante
      ) {
        exactos.push(p.usuario.nombre);
      } else if (
        Math.sign(p.prediccionLocal - p.prediccionVisitante) === signReal
      ) {
        tendencia.push(p.usuario.nombre);
      } else {
        sinPuntos.push(p.usuario.nombre);
      }
    }
    return { exactos, tendencia, sinPuntos };
  }

  /** Tabla de un grupo ordenada con criterio FIFA (pts > dg > gf > fair play). */
  private async tablaGrupo(letra: string) {
    const filas = await this.prisma.grupo.findMany({
      where: { nombre: letra },
      include: { pais: { select: { nombre: true } } },
    });
    return filas
      .map((f) => ({
        nombre: f.pais.nombre,
        puntos: f.puntos,
        pj: f.partidosJugados,
        dg: f.diferenciaGoles,
        gf: f.golesAFavor,
        fairPlay: f.tarjetasAmarillas + f.tarjetasRojas * 3,
      }))
      .sort(
        (a, b) =>
          b.puntos - a.puntos ||
          b.dg - a.dg ||
          b.gf - a.gf ||
          a.fairPlay - b.fairPlay,
      );
  }

  /**
   * Aviso de gol: narra el gol y dice a quién beneficia.
   * Beneficiados se calculan contra el marcador ACTUAL que trae el payload.
   */
  async notificarGol(payload: MatchGoalPayload): Promise<void> {
    if (!this.whatsapp.habilitado) return;

    const realLocal = payload.golesLocal;
    const realVisitante = payload.golesVisitante;
    const { exactos, tendencia } = await this.calcularBeneficiados(
      payload.partidoId,
      realLocal,
      realVisitante,
    );

    const minutoTxt = payload.minuto != null ? `⏱️ ${payload.minuto}' ` : '';
    const tipoTxt =
      payload.tipo === 'penal'
        ? ' (de penal 🎯)'
        : payload.tipo === 'autogol'
          ? ' (¡EN PROPIA PUERTA! 🙈)'
          : '';

    const l: string[] = [];
    l.push('⚽🔥 *¡GOOOOOOOOOL!* 🔥⚽');
    l.push('━━━━━━━━━━━━━━━━━━');
    // Si hay goleador, lo nombramos; si no (API sin detalle), solo el país.
    if (payload.jugador) {
      l.push(`${minutoTxt}¡Anota *${payload.jugador}*${tipoTxt} para *${payload.paisNombre}*!`);
    } else {
      l.push(`${minutoTxt}¡Gol de *${payload.paisNombre}*${tipoTxt}!`);
    }
    l.push(
      `📋 *${payload.localNombre} ${realLocal} - ${realVisitante} ${payload.visitanteNombre}*`,
    );
    l.push('');

    if (exactos.length === 0 && tendencia.length === 0) {
      l.push('😱 ¡NADIE tenía este marcador! La quiniela está que arde 🌶️🔥');
    } else {
      l.push('📊 *¿A quién le conviene este gol?*');
      if (exactos.length > 0) {
        l.push(`🎯 *CLAVADOS* (marcador exacto, +5 pts): ${exactos.join(', ')}`);
      }
      if (tendencia.length > 0) {
        l.push(`📈 *Por tendencia* (+3 pts): ${tendencia.join(', ')}`);
      }
      l.push('');
      l.push('👀 ¡Pero ojo, que el partido NO ha terminado! ⏳');
    }

    await this.whatsapp.enviarAlGrupo(l.join('\n'));
  }

  private fmtMarcadorEstado(estado: string): string {
    if (estado === 'en_vivo') return '🔴 EN VIVO';
    if (estado === 'finalizado') return '🏁 FINALIZADO';
    return '🕒 PROGRAMADO';
  }

  private renderTablaGrupo(
    letra: string,
    tabla: Awaited<ReturnType<NotificacionesService['tablaGrupo']>>,
    resaltar: string[] = [],
  ): string[] {
    const l: string[] = [];
    l.push(`🏆 *Así va el Grupo ${letra}:*`);
    tabla.forEach((e, i) => {
      const flecha = resaltar.includes(e.nombre) ? ' 👈' : '';
      l.push(
        `${i + 1}. ${e.nombre} — ${e.puntos} pts (PJ ${e.pj}, DG ${e.dg >= 0 ? '+' : ''}${e.dg})${flecha}`,
      );
    });
    return l;
  }

  /**
   * Construye los datos de evaluación de un partido según su marcador ACTUAL:
   * a quién beneficia el resultado en curso y cómo va la tabla del grupo.
   */
  async evaluarPartido(partidoId: number) {
    const partido = await this.prisma.partido.findUnique({
      where: { id: partidoId },
      include: { local: true, visitante: true },
    });
    if (!partido) return null;

    const realLocal = partido.golesLocal ?? 0;
    const realVisitante = partido.golesVisitante ?? 0;
    const beneficiados = await this.calcularBeneficiados(
      partidoId,
      realLocal,
      realVisitante,
    );
    const tabla = partido.grupo ? await this.tablaGrupo(partido.grupo) : [];

    return {
      partidoId,
      estado: partido.estado,
      grupo: partido.grupo,
      local: partido.local.nombre,
      visitante: partido.visitante.nombre,
      golesLocal: realLocal,
      golesVisitante: realVisitante,
      beneficiados,
      tablaGrupo: tabla,
    };
  }

  /**
   * Envía al grupo una evaluación del partido EN CURSO: a quién beneficia el
   * marcador actual (si terminara así) y cómo va la tabla del grupo.
   */
  async notificarEvaluacionPartido(partidoId: number) {
    const data = await this.evaluarPartido(partidoId);
    if (!data) return null;
    if (!this.whatsapp.habilitado) return data;

    const { exactos, tendencia, sinPuntos } = data.beneficiados;
    const l: string[] = [];
    l.push('📊⚡ *¿CÓMO VA LA QUINIELA?* ⚡📊');
    l.push('━━━━━━━━━━━━━━━━━━');
    l.push(
      `${this.fmtMarcadorEstado(data.estado)} | *${data.local} ${data.golesLocal} - ${data.golesVisitante} ${data.visitante}*`,
    );
    l.push('');
    l.push('🤔 *Si el partido terminara así:*');
    l.push(
      `🎯 Clavados (+5 pts): ${exactos.length ? exactos.join(', ') : '—'}`,
    );
    l.push(
      `📈 Por tendencia (+3 pts): ${tendencia.length ? tendencia.join(', ') : '—'}`,
    );
    l.push(
      `😬 Se quedan sin puntos: ${sinPuntos.length ? sinPuntos.join(', ') : '—'}`,
    );

    if (data.grupo && data.tablaGrupo.length) {
      l.push('');
      l.push(
        ...this.renderTablaGrupo(data.grupo, data.tablaGrupo, [
          data.local,
          data.visitante,
        ]),
      );
    }
    l.push('');
    l.push('🔥 ¡Todo puede cambiar! 🙏⚽');

    await this.whatsapp.enviarAlGrupo(l.join('\n'));
    return data;
  }

  /**
   * Aviso de FIN de partido: resultado final, quién sumó puntos, impacto en la
   * tabla del grupo y top del ranking general.
   */
  async notificarFinPartido(partidoId: number) {
    const data = await this.evaluarPartido(partidoId);
    if (!data) return null;
    if (!this.whatsapp.habilitado) return data;

    const { exactos, tendencia, sinPuntos } = data.beneficiados;
    const topRanking = await this.prisma.usuario.findMany({
      orderBy: { puntosTotales: 'desc' },
      take: 3,
      select: { nombre: true, puntosTotales: true },
    });

    const l: string[] = [];
    l.push('🏁⚽ *¡FINAL DEL PARTIDO!* ⚽🏁');
    l.push('━━━━━━━━━━━━━━━━━━');
    l.push(
      `*${data.local} ${data.golesLocal} - ${data.golesVisitante} ${data.visitante}*`,
    );
    l.push('');
    l.push('🏅 *Resultados de la quiniela:*');
    l.push(
      `🎯 Marcador EXACTO (+5 pts): ${exactos.length ? exactos.join(', ') : '— nadie 😱'}`,
    );
    l.push(
      `📈 Acertaron resultado (+3 pts): ${tendencia.length ? tendencia.join(', ') : '—'}`,
    );
    l.push(
      `❌ Sin puntos esta vez: ${sinPuntos.length ? sinPuntos.join(', ') : '—'}`,
    );

    if (data.grupo && data.tablaGrupo.length) {
      l.push('');
      l.push(
        ...this.renderTablaGrupo(data.grupo, data.tablaGrupo, [
          data.local,
          data.visitante,
        ]),
      );
    }

    if (topRanking.length) {
      l.push('');
      l.push('👑 *Top del ranking general:*');
      const medallas = ['🥇', '🥈', '🥉'];
      topRanking.forEach((u, i) => {
        l.push(`${medallas[i] ?? '  '} ${u.nombre} — ${u.puntosTotales} pts`);
      });
    }
    l.push('');
    l.push('📲 ¡Revisen la tabla completa en la app! 🚀');

    await this.whatsapp.enviarAlGrupo(l.join('\n'));
    return data;
  }
}
