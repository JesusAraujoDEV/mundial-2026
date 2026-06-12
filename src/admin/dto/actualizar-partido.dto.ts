import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

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
}
