import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CargarPaisDto } from './dto/cargar-pais.dto';
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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

    const partidoActualizado = await this.prisma.partido.update({
      where: { id },
      data: {
        ...(dto.golesLocal !== undefined && { golesLocal: dto.golesLocal }),
        ...(dto.golesVisitante !== undefined && {
          golesVisitante: dto.golesVisitante,
        }),
        ...(dto.bloqueado !== undefined && { bloqueado: dto.bloqueado }),
        ...(actualizarMarcador && { actualizadoPorAdmin: true }),
      },
    });

    if (actualizarMarcador) {
      await this.recalcularPuntos(id, dto.golesLocal!, dto.golesVisitante!);
    }

    return {
      message: actualizarMarcador
        ? `Partido ${id} actualizado. Puntos recalculados para todos los pronósticos.`
        : `Partido ${id} actualizado.`,
      partido: partidoActualizado,
    };
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
      });
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
