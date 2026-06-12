import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'Carlos Pérez', description: 'Nombre completo del usuario' })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty({ example: 'carlos', description: 'Nombre de usuario único para login' })
  @IsString()
  @MinLength(2)
  username: string;

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
