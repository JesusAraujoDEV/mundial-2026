import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipoGrupo } from './interfaces/equipo-grupo.interface';

@Injectable()
export class GruposService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerGrupos() {
    const gruposData = await this.prisma.grupo.findMany({
      include: {
        pais: { select: { id: true, nombre: true, banderaUrl: true } },
      },
      orderBy: [{ nombre: 'asc' }],
    });

    const gruposMap = new Map<string, EquipoGrupo[]>();

    for (const g of gruposData) {
      const equipo: EquipoGrupo = {
        paisId: g.pais.id,
        nombre: g.pais.nombre,
        banderaUrl: g.pais.banderaUrl,
        grupo: g.nombre,
        puntos: g.puntos,
        partidosJugados: g.partidosJugados,
        ganados: g.ganados,
        empatados: g.empatados,
        perdidos: g.perdidos,
        golesAFavor: g.golesAFavor,
        golesEnContra: g.golesEnContra,
        diferenciaGoles: g.diferenciaGoles,
        tarjetasAmarillas: g.tarjetasAmarillas,
        tarjetasRojas: g.tarjetasRojas,
        fairPlayPuntos: g.fairPlayPuntos,
      };

      if (!gruposMap.has(g.nombre)) {
        gruposMap.set(g.nombre, []);
      }
      gruposMap.get(g.nombre)!.push(equipo);
    }

    const grupos = Array.from(gruposMap.entries()).map(([nombre, equipos]) => ({
      grupo: nombre,
      equipos: this.ordenarEquipos(equipos),
    }));

    return { grupos };
  }

  async obtenerMejoresTerceros() {
    const { grupos } = await this.obtenerGrupos();

    const terceros: (EquipoGrupo & { posicionGrupo: number })[] = [];

    for (const grupo of grupos) {
      if (grupo.equipos.length >= 3) {
        terceros.push({
          ...grupo.equipos[2],
          posicionGrupo: 3,
        });
      }
    }

    const tercerosOrdenados = this.ordenarEquipos(terceros);

    const resultado = tercerosOrdenados.map((equipo, index) => ({
      posicion: index + 1,
      clasifica: index < 8,
      ...equipo,
    }));

    return {
      mejoresTerceros: resultado,
      clasificados: resultado.filter((t) => t.clasifica).length,
      eliminados: resultado.filter((t) => !t.clasifica).length,
    };
  }

  async obtenerLlavesPlayoffs() {
    const { grupos } = await this.obtenerGrupos();
    const { mejoresTerceros } = await this.obtenerMejoresTerceros();

    const posiciones = new Map<string, string | null>();

    for (const grupo of grupos) {
      const letra = grupo.grupo;
      posiciones.set(`1${letra}`, grupo.equipos[0]?.nombre ?? null);
      posiciones.set(`2${letra}`, grupo.equipos[1]?.nombre ?? null);
    }

    const tercerosClasificados = mejoresTerceros
      .filter((t) => t.clasifica)
      .map((t) => t.grupo);

    const tercerosMap = new Map<string, string | null>();
    for (const t of mejoresTerceros.filter((t) => t.clasifica)) {
      tercerosMap.set(`3${t.grupo}`, t.nombre);
    }

    const crucesAsignados = this.asignarTercerosACruces(tercerosClasificados);

    const dieciseisavos = this.generarDieciseisavos(
      posiciones,
      tercerosMap,
      crucesAsignados,
    );

    const partidos = await this.prisma.partido.findMany({
      where: {
        fase: { in: ['16avos', 'octavos', 'cuartos', 'semifinal', 'tercer_lugar', 'final'] },
      },
      include: {
        local: { select: { id: true, nombre: true, banderaUrl: true } },
        visitante: { select: { id: true, nombre: true, banderaUrl: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    const octavos = partidos.filter((p) => p.fase === '16avos' || p.fase === 'octavos');
    const cuartos = partidos.filter((p) => p.fase === 'cuartos');
    const semifinales = partidos.filter((p) => p.fase === 'semifinal');
    const tercerLugar = partidos.find((p) => p.fase === 'tercer_lugar') ?? null;
    const final = partidos.find((p) => p.fase === 'final') ?? null;

    return {
      estructura: {
        dieciseisavos: dieciseisavos,
        octavosReales: octavos.map((p) => this.formatearPartidoPlayoff(p)),
        cuartos: cuartos.map((p) => this.formatearPartidoPlayoff(p)),
        semifinales: semifinales.map((p) => this.formatearPartidoPlayoff(p)),
        tercerLugar: tercerLugar ? this.formatearPartidoPlayoff(tercerLugar) : null,
        final: final ? this.formatearPartidoPlayoff(final) : null,
      },
      tercerosClasificados: crucesAsignados,
    };
  }

  /**
   * Cruces preestablecidos FIFA 2026 para 16avos de final (48 equipos, 12 grupos).
   * Mapa de cruces: 1° y 2° de cada grupo + 8 mejores terceros.
   */
  private generarDieciseisavos(
    posiciones: Map<string, string | null>,
    tercerosMap: Map<string, string | null>,
    crucesAsignados: Record<string, string | null>,
  ) {
    const cruces = [
      { id: 1, descripcion: '1A vs 3C/D/E', local: posiciones.get('1A'), visitante: crucesAsignados['cruce1'] },
      { id: 2, descripcion: '2A vs 2B', local: posiciones.get('2A'), visitante: posiciones.get('2B') },
      { id: 3, descripcion: '1B vs 3A/D/E', local: posiciones.get('1B'), visitante: crucesAsignados['cruce2'] },
      { id: 4, descripcion: '2C vs 2D', local: posiciones.get('2C'), visitante: posiciones.get('2D') },
      { id: 5, descripcion: '1C vs 3B/F/G', local: posiciones.get('1C'), visitante: crucesAsignados['cruce3'] },
      { id: 6, descripcion: '2E vs 2F', local: posiciones.get('2E'), visitante: posiciones.get('2F') },
      { id: 7, descripcion: '1D vs 3A/B/C', local: posiciones.get('1D'), visitante: crucesAsignados['cruce4'] },
      { id: 8, descripcion: '2G vs 2H', local: posiciones.get('2G'), visitante: posiciones.get('2H') },
      { id: 9, descripcion: '1E vs 3F/G/H', local: posiciones.get('1E'), visitante: crucesAsignados['cruce5'] },
      { id: 10, descripcion: '2I vs 2J', local: posiciones.get('2I'), visitante: posiciones.get('2J') },
      { id: 11, descripcion: '1F vs 3I/J/K', local: posiciones.get('1F'), visitante: crucesAsignados['cruce6'] },
      { id: 12, descripcion: '2K vs 2L', local: posiciones.get('2K'), visitante: posiciones.get('2L') },
      { id: 13, descripcion: '1G vs 3H/I/J', local: posiciones.get('1G'), visitante: crucesAsignados['cruce7'] },
      { id: 14, descripcion: '1H vs 3K/L/A', local: posiciones.get('1H'), visitante: crucesAsignados['cruce8'] },
      { id: 15, descripcion: '1I vs 2° mejor 3ro disponible', local: posiciones.get('1I'), visitante: null },
      { id: 16, descripcion: '1J vs 1K o 1L (según bracket)', local: posiciones.get('1J'), visitante: null },
    ];

    return cruces.map((c) => ({
      ...c,
      local: c.local ?? 'Por definir',
      visitante: c.visitante ?? 'Por definir',
    }));
  }

  /**
   * Asigna los 8 mejores terceros a los cruces específicos según combinación FIFA.
   * La asignación depende de qué grupos provienen los terceros clasificados.
   */
  private asignarTercerosACruces(
    gruposClasificados: string[],
  ): Record<string, string | null> {
    const resultado: Record<string, string | null> = {
      cruce1: null,
      cruce2: null,
      cruce3: null,
      cruce4: null,
      cruce5: null,
      cruce6: null,
      cruce7: null,
      cruce8: null,
    };

    const sorted = [...gruposClasificados].sort();

    if (sorted.length >= 8) {
      resultado['cruce1'] = `3°${sorted[0]}`;
      resultado['cruce2'] = `3°${sorted[1]}`;
      resultado['cruce3'] = `3°${sorted[2]}`;
      resultado['cruce4'] = `3°${sorted[3]}`;
      resultado['cruce5'] = `3°${sorted[4]}`;
      resultado['cruce6'] = `3°${sorted[5]}`;
      resultado['cruce7'] = `3°${sorted[6]}`;
      resultado['cruce8'] = `3°${sorted[7]}`;
    }

    return resultado;
  }

  private formatearPartidoPlayoff(partido: any) {
    return {
      partidoId: partido.id,
      fase: partido.fase,
      fecha: partido.fecha,
      local: partido.local,
      visitante: partido.visitante,
      resultado:
        partido.golesLocal !== null && partido.golesVisitante !== null
          ? { golesLocal: partido.golesLocal, golesVisitante: partido.golesVisitante }
          : null,
    };
  }

  /**
   * Ordenamiento FIFA: Puntos > Diferencia de Goles > Goles a Favor > Fair Play (menos = mejor)
   */
  private ordenarEquipos<T extends EquipoGrupo>(equipos: T[]): T[] {
    return equipos.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferenciaGoles !== a.diferenciaGoles)
        return b.diferenciaGoles - a.diferenciaGoles;
      if (b.golesAFavor !== a.golesAFavor) return b.golesAFavor - a.golesAFavor;
      // Fair Play: menor puntuación de tarjetas es mejor (amarilla=1, roja=3)
      const fairPlayA = a.tarjetasAmarillas + a.tarjetasRojas * 3;
      const fairPlayB = b.tarjetasAmarillas + b.tarjetasRojas * 3;
      return fairPlayA - fairPlayB;
    });
  }
}
