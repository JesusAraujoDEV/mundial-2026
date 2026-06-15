import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { REALTIME_NAMESPACE, RealtimeEvent } from './realtime.events';

/**
 * Gateway Socket.IO. Broadcast puro (server -> client). La auth JWT es OPCIONAL:
 * los datos del juego son públicos, así que una conexión sin token se acepta
 * como read-only. Si llega token válido en el handshake, se adjunta el usuario.
 */
@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    // Auth opcional: token por handshake.auth.token o Authorization header.
    const raw =
      (client.handshake.auth && (client.handshake.auth as any).token) ||
      this.extractBearer(client.handshake.headers['authorization']);

    if (raw) {
      try {
        const payload = this.jwt.verify(raw, {
          secret: process.env.JWT_SECRET || 'mundial2026-secret-key',
        });
        (client.data as any).user = payload;
      } catch {
        // token inválido/expirado -> seguimos como anónimo read-only
        (client.data as any).user = null;
      }
    }

    client.emit(RealtimeEvent.Connected, { ts: new Date().toISOString() });
  }

  /** Broadcast a todos los clientes conectados al namespace. */
  broadcast(event: string, payload: unknown) {
    if (!this.server) {
      this.logger.warn(`Server no inicializado al emitir ${event}`);
      return;
    }
    this.server.emit(event, payload);
  }

  private extractBearer(header?: string): string | null {
    if (!header) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
