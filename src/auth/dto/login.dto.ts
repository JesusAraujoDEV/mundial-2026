import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jesus', description: 'Nombre de usuario' })
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty({ example: 'miPassword123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(4)
  password: string;
}
