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
        balonOro: { select: { id: true, nombre: true, dorsal: true, posicion: true, pais: { select: { id: true, nombre: true } } } },
        botaOro: { select: { id: true, nombre: true, dorsal: true, posicion: true, pais: { select: { id: true, nombre: true } } } },
        guanteOro: { select: { id: true, nombre: true, dorsal: true, posicion: true, pais: { select: { id: true, nombre: true } } } },
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

    const data = {
      campeonId: dto.campeonId ?? null,
      sorpresaId: dto.sorpresaId ?? null,
      balonOroId: dto.balonOroId ?? null,
      botaOroId: dto.botaOroId ?? null,
      guanteOroId: dto.guanteOroId ?? null,
    };

    if (existente) {
      const prediccion = await this.prisma.prediccionEspecial.update({
        where: { id: existente.id },
        data,
      });
      return { message: 'Predicciones especiales actualizadas.', prediccion };
    }

    const prediccion = await this.prisma.prediccionEspecial.create({
      data: {
        usuarioId,
        ...data,
      },
    });

    return { message: 'Predicciones especiales guardadas.', prediccion };
  }
}
