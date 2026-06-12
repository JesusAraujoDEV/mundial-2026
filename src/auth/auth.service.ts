import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
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
      email: usuario.email,
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
        email: usuario.email,
        rol: usuario.rol,
        puntosTotales: usuario.puntosTotales,
      },
    };
  }

  async crearUsuario(dto: CrearUsuarioDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existente) {
      throw new ConflictException(`Ya existe un usuario con el email "${dto.email}".`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        passwordHash,
        rol: dto.rol ?? 'user',
      },
    });

    return {
      message: `Usuario "${usuario.nombre}" creado exitosamente.`,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
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
        email: true,
        rol: true,
        puntosTotales: true,
        createdAt: true,
      },
    });

    return { usuario };
  }
}
