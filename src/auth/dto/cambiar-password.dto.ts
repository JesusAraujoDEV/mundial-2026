import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsInt } from 'class-validator';

export class CambiarPasswordDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  usuarioId: number;

  @ApiProperty({ example: 'nuevaClave123', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(4)
  passwordNueva: string;
}
