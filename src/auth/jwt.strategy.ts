import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'mundial2026-secret-key',
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      username: payload.username,
      nombre: payload.nombre,
      rol: payload.rol,
    };
  }
}
