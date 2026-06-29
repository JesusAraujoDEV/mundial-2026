import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsBoolean, Min, IsIn, IsString } from 'class-validator';

export class ActualizarPartidoDto {
  @ApiProperty({
    example: 2,
    description: 'Goles marcados por el equipo local',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  golesLocal?: number;

  @ApiProperty({
    example: 1,
    description: 'Goles marcados por el equipo visitante',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  golesVisitante?: number;

  @ApiProperty({
    example: true,
    description: 'Si el partido está bloqueado para pronósticos',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  bloqueado?: boolean;

  @ApiProperty({
    example: 'en_vivo',
    description: 'Estado del partido: programado | en_vivo | descanso | finalizado',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['programado', 'en_vivo', 'descanso', 'finalizado'])
  estado?: string;

  @ApiProperty({
    example: 7,
    description:
      'ID del país que clasificó por penales (knockout con empate). null si no hubo penales.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  ganadorPenalesId?: number | null;
}
