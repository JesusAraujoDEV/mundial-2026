import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstadisticasService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerGoleadores(limit: number) {
    const golesAgrupados = await this.prisma.golPartido.groupBy({
      by: ['jugadorId'],
      where: { tipo: { not: 'autogol' } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const jugadorIds = golesAgrupados.map((g) => g.jugadorId);

    const jugadores = await this.prisma.jugador.findMany({
      where: { id: { in: jugadorIds } },
      include: {
        pais: { select: { id: true, nombre: true, banderaUrl: true } },
      },
    });

    const jugadoresMap = new Map(jugadores.map((j) => [j.id, j]));

    const topGoleadores = golesAgrupados.map((g, index) => {
      const jugador = jugadoresMap.get(g.jugadorId);
      return {
        posicion: index + 1,
        jugadorId: g.jugadorId,
        nombre: jugador?.nombre ?? 'Desconocido',
        dorsal: jugador?.dorsal ?? null,
        posicionCampo: jugador?.posicion ?? null,
        pais: jugador?.pais ?? null,
        goles: g._count.id,
      };
    });

    const golesPorPais = await this.prisma.golPartido.findMany({
      where: { tipo: { not: 'autogol' } },
      include: {
        jugador: {
          select: { paisId: true },
        },
      },
    });

    const paisGoles = new Map<number, number>();
    for (const gol of golesPorPais) {
      const paisId = gol.jugador.paisId;
      paisGoles.set(paisId, (paisGoles.get(paisId) ?? 0) + 1);
    }

    const paisIds = Array.from(paisGoles.keys());
    const paises = await this.prisma.pais.findMany({
      where: { id: { in: paisIds } },
      select: { id: true, nombre: true, banderaUrl: true },
    });

    const paisesMap = new Map(paises.map((p) => [p.id, p]));

    const seleccionesGoleadoras = Array.from(paisGoles.entries())
      .map(([paisId, goles]) => ({
        paisId,
        nombre: paisesMap.get(paisId)?.nombre ?? 'Desconocido',
        banderaUrl: paisesMap.get(paisId)?.banderaUrl ?? null,
        golesTotal: goles,
      }))
      .sort((a, b) => b.golesTotal - a.golesTotal)
      .slice(0, limit)
      .map((s, index) => ({ posicion: index + 1, ...s }));

    const detalleGoles = await this.prisma.golPartido.groupBy({
      by: ['tipo'],
      _count: { id: true },
    });

    const resumenGoles = {
      totalGoles: detalleGoles.reduce((sum, d) => sum + d._count.id, 0),
      porTipo: detalleGoles.map((d) => ({ tipo: d.tipo, cantidad: d._count.id })),
    };

    return {
      topGoleadores,
      seleccionesGoleadoras,
      resumenGoles,
    };
  }
}
