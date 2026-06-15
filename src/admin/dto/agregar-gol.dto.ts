import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsIn, Min } from 'class-validator';

/** Un único gol a añadir en vivo (endpoint incremental que dispara el efecto). */
export class AgregarGolDto {
  @ApiProperty({ example: 9, description: 'ID del jugador que anotó' })
  @IsInt()
  jugadorId: number;

  @ApiProperty({ example: 23, description: 'Minuto del gol', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  minuto?: number;

  @ApiProperty({
    example: 'normal',
    description: 'Tipo de gol: normal, penal o autogol',
    default: 'normal',
  })
  @IsOptional()
  @IsString()
  @IsIn(['normal', 'penal', 'autogol'])
  tipo?: string;
}
