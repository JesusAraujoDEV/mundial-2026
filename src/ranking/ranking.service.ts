import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerRanking() {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { puntosTotales: 'desc' },
      select: {
        id: true,
        nombre: true,
        puntosTotales: true,
      },
    });

    return {
      ranking: usuarios.map((u, index) => ({
        posicion: index + 1,
        id: u.id,
        nombre: u.nombre,
        puntosTotales: u.puntosTotales,
      })),
    };
  }

  async obtenerMatrizPronosticos() {
    const partidos = await this.prisma.partido.findMany({
      orderBy: { fecha: 'asc' },
      include: {
        local: { select: { id: true, nombre: true, banderaUrl: true } },
        visitante: { select: { id: true, nombre: true, banderaUrl: true } },
        pronosticos: {
          include: {
            usuario: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    const matriz = partidos.map((partido) => ({
      partidoId: partido.id,
      fase: partido.fase,
      fecha: partido.fecha,
      bloqueado: partido.bloqueado,
      estado: partido.estado,
      definido: partido.definido,
      ganadorPenalesId: partido.ganadorPenalesId,
      local: partido.local,
      visitante: partido.visitante,
      resultadoReal:
        partido.golesLocal !== null && partido.golesVisitante !== null
          ? { golesLocal: partido.golesLocal, golesVisitante: partido.golesVisitante }
          : null,
      pronosticos: partido.pronosticos.map((p) => ({
        usuarioId: p.usuario.id,
        nombreUsuario: p.usuario.nombre,
        prediccionLocal: p.prediccionLocal,
        prediccionVisitante: p.prediccionVisitante,
        ganadorPenalesId: p.ganadorPenalesId,
        puntosGanados: p.puntosGanados,
      })),
    }));

    return { partidos: matriz };
  }
}
