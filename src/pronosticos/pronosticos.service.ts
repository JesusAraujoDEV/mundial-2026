import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearPronosticoDto } from './dto/crear-pronostico.dto';

@Injectable()
export class PronosticosService {
  constructor(private readonly prisma: PrismaService) {}

  async crearOActualizarPronostico(
    usuarioId: number,
    partidoId: number,
    dto: CrearPronosticoDto,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    const partido = await this.prisma.partido.findUnique({
      where: { id: partidoId },
    });
    if (!partido) {
      throw new NotFoundException(`Partido con ID ${partidoId} no encontrado.`);
    }

    if (partido.bloqueado) {
      throw new BadRequestException(
        `El partido ${partidoId} está bloqueado. No se pueden crear ni modificar pronósticos.`,
      );
    }

    const pronostico = await this.prisma.pronosticoPartido.upsert({
      where: {
        usuarioId_partidoId: {
          usuarioId,
          partidoId,
        },
      },
      update: {
        prediccionLocal: dto.prediccionLocal,
        prediccionVisitante: dto.prediccionVisitante,
      },
      create: {
        usuarioId,
        partidoId,
        prediccionLocal: dto.prediccionLocal,
        prediccionVisitante: dto.prediccionVisitante,
      },
    });

    return {
      message: 'Pronóstico guardado correctamente.',
      pronostico,
    };
  }
}
