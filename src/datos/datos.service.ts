import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPaises() {
    const paises = await this.prisma.pais.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        banderaUrl: true,
      },
    });

    return { paises, total: paises.length };
  }

  async obtenerJugadores(paisId?: number) {
    const jugadores = await this.prisma.jugador.findMany({
      where: paisId ? { paisId } : undefined,
      include: {
        pais: { select: { id: true, nombre: true, banderaUrl: true } },
      },
      orderBy: [{ pais: { nombre: 'asc' } }, { dorsal: 'asc' }],
    });

    return { jugadores, total: jugadores.length };
  }

  async obtenerPartidos(fase?: string) {
    const partidos = await this.prisma.partido.findMany({
      where: fase ? { fase } : undefined,
      include: {
        local: { select: { id: true, nombre: true, banderaUrl: true } },
        visitante: { select: { id: true, nombre: true, banderaUrl: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    return { partidos, total: partidos.length };
  }
}
