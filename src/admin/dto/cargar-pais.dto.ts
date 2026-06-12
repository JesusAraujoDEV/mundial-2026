import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class JugadorDto {
  @ApiProperty({ example: 9, description: 'Número de dorsal del jugador' })
  @IsInt()
  @Min(1)
  @Max(99)
  dorsal: number;

  @ApiProperty({ example: 'Kai Havertz', description: 'Nombre completo del jugador' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    example: 'Delantero',
    description: 'Posición del jugador',
    enum: ['Portero', 'Defensa', 'Mediocentro', 'Delantero'],
  })
  @IsString()
  @IsIn(['Portero', 'Defensa', 'Mediocentro', 'Delantero'])
  posicion: string;

  @ApiProperty({ example: 27, description: 'Edad del jugador', required: false })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(50)
  edad?: number;
}

export class CargarPaisDto {
  @ApiProperty({ example: 'Alemania', description: 'Nombre del país/selección' })
  @IsString()
  @IsNotEmpty()
  pais: string;

  @ApiProperty({
    example: 'https://flagcdn.com/de.svg',
    description: 'URL de la bandera del país',
    required: false,
  })
  @IsOptional()
  @IsString()
  banderaUrl?: string;

  @ApiProperty({
    type: [JugadorDto],
    description: 'Lista de jugadores de la selección',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JugadorDto)
  jugadores: JugadorDto[];
}
