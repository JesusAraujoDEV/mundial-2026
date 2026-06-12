import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

@ApiTags('auth')
@Controller('mundial/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y retorna un JWT válido por 7 días.',
  })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna token JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('crear-usuario')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear usuario (Solo Admin)',
    description:
      'El administrador crea una cuenta para un amigo con nombre, email y contraseña.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  crearUsuario(@Body() dto: CrearUsuarioDto, @Request() req: any) {
    if (req.user.rol !== 'admin') {
      throw new Error('Solo el administrador puede crear usuarios.');
    }
    return this.authService.crearUsuario(dto);
  }

  @Get('perfil')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil del usuario logueado',
    description: 'Retorna la información del usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Perfil obtenido.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  obtenerPerfil(@Request() req: any) {
    return this.authService.obtenerPerfil(req.user.sub);
  }
}
