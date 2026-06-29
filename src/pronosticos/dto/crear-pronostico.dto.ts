import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CrearPronosticoDto {
  @ApiProperty({
    example: 2,
    description: 'Goles que predice el usuario para el equipo local',
  })
  @IsInt()
  @Min(0)
  prediccionLocal: number;

  @ApiProperty({
    example: 1,
    description: 'Goles que predice el usuario para el equipo visitante',
  })
  @IsInt()
  @Min(0)
  prediccionVisitante: number;

  @ApiProperty({
    example: 7,
    description:
      'Solo knockout con empate: ID del país que el usuario cree que clasifica por penales.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  ganadorPenalesId?: number | null;
}
