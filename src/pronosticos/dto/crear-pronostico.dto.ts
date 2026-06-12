import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

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
}
