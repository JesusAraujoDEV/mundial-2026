import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { username: dto.username },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const payload = {
      sub: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login exitoso.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol,
        puntosTotales: usuario.puntosTotales,
      },
    };
  }

  async crearUsuario(dto: CrearUsuarioDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { username: dto.username },
    });

    if (existente) {
      throw new ConflictException(`Ya existe un usuario con el username "${dto.username}".`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        username: dto.username,
        passwordHash,
        rol: dto.rol ?? 'user',
      },
    });

    return {
      message: `Usuario "${usuario.nombre}" creado exitosamente.`,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol,
      },
    };
  }

  async obtenerPerfil(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        puntosTotales: true,
        createdAt: true,
      },
    });

    return { usuario };
  }

  async cambiarPassword(dto: CambiarPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(dto.passwordNueva, salt);

    await this.prisma.usuario.update({
      where: { id: dto.usuarioId },
      data: { passwordHash: nuevoHash },
    });

    return { message: `Contraseña de "${usuario.nombre}" actualizada exitosamente.` };
  }
}
