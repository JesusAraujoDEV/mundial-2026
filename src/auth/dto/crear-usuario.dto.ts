import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'Carlos Pérez', description: 'Nombre completo del usuario' })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty({ example: 'carlos@gmail.com', description: 'Email único del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña que usará el usuario' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({
    example: 'user',
    description: 'Rol del usuario (user o admin)',
    required: false,
    default: 'user',
  })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  rol?: string;
}
