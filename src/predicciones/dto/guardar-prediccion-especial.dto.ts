import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';

export class GuardarPrediccionEspecialDto {
  @ApiProperty({ example: 4, description: 'ID del país campeón', required: false })
  @IsOptional()
  @IsInt()
  campeonId?: number;

  @ApiProperty({ example: 16, description: 'ID del país sorpresa', required: false })
  @IsOptional()
  @IsInt()
  sorpresaId?: number;

  @ApiProperty({ example: 128, description: 'ID del jugador balón de oro', required: false })
  @IsOptional()
  @IsInt()
  balonOroId?: number;

  @ApiProperty({ example: 128, description: 'ID del jugador bota de oro', required: false })
  @IsOptional()
  @IsInt()
  botaOroId?: number;

  @ApiProperty({ example: 105, description: 'ID del jugador guante de oro (portero)', required: false })
  @IsOptional()
  @IsInt()
  guanteOroId?: number;
}
