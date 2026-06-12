import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jesus@mundial.com', description: 'Email del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'miPassword123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(4)
  password: string;
}
