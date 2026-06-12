import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, IsIn, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class GolDto {
  @ApiProperty({ example: 5, description: 'ID del jugador que anotó' })
  @IsInt()
  jugadorId: number;

  @ApiProperty({ example: 23, description: 'Minuto del gol', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  minuto?: number;

  @ApiProperty({ example: 'normal', description: 'Tipo de gol: normal, penal o autogol', default: 'normal' })
  @IsOptional()
  @IsString()
  @IsIn(['normal', 'penal', 'autogol'])
  tipo?: string;
}

export class CargarGolesDto {
  @ApiProperty({ type: [GolDto], description: 'Lista de goles del partido' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GolDto)
  goles: GolDto[];
}
