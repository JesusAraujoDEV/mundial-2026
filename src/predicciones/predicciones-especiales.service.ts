import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuardarPrediccionEspecialDto } from './dto/guardar-prediccion-especial.dto';

@Injectable()
export class PrediccionesEspecialesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(usuarioId: number) {
    const prediccion = await this.prisma.prediccionEspecial.findFirst({
      where: { usuarioId },
      include: {
        campeon: { select: { id: true, nombre: true, banderaUrl: true } },
        sorpresa: { select: { id: true, nombre: true, banderaUrl: true } },
        balonOro: { select: { id: true, nombre: true, dorsal: true, posicion: true, pais: { select: { id: true, nombre: true, banderaUrl: true } } } },
        botaOro: { select: { id: true, nombre: true, dorsal: true, posicion: true, pais: { select: { id: true, nombre: true, banderaUrl: true } } } },
        guanteOro: { select: { id: true, nombre: true, dorsal: true, posicion: true, pais: { select: { id: true, nombre: true, banderaUrl: true } } } },
      },
    });

    return { prediccion };
  }

  async guardar(usuarioId: number, dto: GuardarPrediccionEspecialDto) {
    const existente = await this.prisma.prediccionEspecial.findFirst({
      where: { usuarioId },
    });

    if (existente?.bloqueado) {
      throw new BadRequestException('Las predicciones especiales están bloqueadas y no se pueden modificar.');
    }

    // Solo permitir guardar campos que aún no tienen valor
    const data: any = {};

    if (dto.campeonId !== undefined) {
      if (existente?.campeonId) {
        throw new BadRequestException('El campeón ya fue elegido y no se puede cambiar.');
      }
      data.campeonId = dto.campeonId;
    }

    if (dto.sorpresaId !== undefined) {
      if (existente?.sorpresaId) {
        throw new BadRequestException('La sorpresa ya fue elegida y no se puede cambiar.');
      }
      data.sorpresaId = dto.sorpresaId;
    }

    if (dto.balonOroId !== undefined) {
      if (existente?.balonOroId) {
        throw new BadRequestException('El balón de oro ya fue elegido y no se puede cambiar.');
      }
      data.balonOroId = dto.balonOroId;
    }

    if (dto.botaOroId !== undefined) {
      if (existente?.botaOroId) {
        throw new BadRequestException('La bota de oro ya fue elegida y no se puede cambiar.');
      }
      data.botaOroId = dto.botaOroId;
    }

    if (dto.guanteOroId !== undefined) {
      if (existente?.guanteOroId) {
        throw new BadRequestException('El guante de oro ya fue elegido y no se puede cambiar.');
      }
      data.guanteOroId = dto.guanteOroId;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay predicciones nuevas para guardar.');
    }

    if (existente) {
      const prediccion = await this.prisma.prediccionEspecial.update({
        where: { id: existente.id },
        data,
      });

      // Bloquear si ya están las 5 completas
      const completas = prediccion.campeonId && prediccion.sorpresaId && prediccion.balonOroId && prediccion.botaOroId && prediccion.guanteOroId;
      if (completas) {
        await this.prisma.prediccionEspecial.update({
          where: { id: prediccion.id },
          data: { bloqueado: true },
        });
      }

      return {
        message: completas
          ? 'Predicciones completas. Bloqueadas.'
          : 'Predicción guardada.',
        prediccion: { ...prediccion, bloqueado: !!completas },
      };
    }

    const prediccion = await this.prisma.prediccionEspecial.create({
      data: {
        usuarioId,
        ...data,
      },
    });

    return { message: 'Predicción guardada.', prediccion };
  }
}
