import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from './notificaciones.service';

/**
 * Poller que detecta partidos por comenzar y dispara el recordatorio
 * X minutos antes (por defecto 5). Mismo patrón stateless de LiveSyncService:
 * setInterval + Set en memoria para no repetir el aviso del mismo partido.
 *
 * Env:
 *   RECORDATORIOS_ENABLED         (default true)
 *   RECORDATORIO_ANTICIPACION_MIN (default 5)
 *   RECORDATORIO_CHECK_MS         (default 60000)
 */
@Injectable()
export class RecordatoriosService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecordatoriosService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly notificados = new Set<number>();
  private readonly anticipacionMin = Number(
    process.env.RECORDATORIO_ANTICIPACION_MIN ?? 5,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly notif: NotificacionesService,
  ) {}

  onModuleInit() {
    const enabled =
      (process.env.RECORDATORIOS_ENABLED ?? 'true') !== 'false';
    if (!enabled) {
      this.logger.log('RECORDATORIOS_ENABLED=false: recordatorios desactivados.');
      return;
    }
    const intervalMs = Number(process.env.RECORDATORIO_CHECK_MS ?? 60000);
    this.logger.log(
      `Recordatorios cada ${intervalMs}ms (${this.anticipacionMin} min antes del partido).`,
    );
    this.timer = setInterval(() => {
      this.revisar().catch((e) =>
        this.logger.warn(`Revisión de recordatorios falló: ${e.message}`),
      );
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Busca partidos programados que arrancan dentro de la ventana de anticipación. */
  async revisar() {
    const ahora = new Date();
    const limite = new Date(ahora.getTime() + this.anticipacionMin * 60_000);

    const proximos = await this.prisma.partido.findMany({
      where: {
        estado: 'programado',
        fecha: { gt: ahora, lte: limite },
      },
      select: { id: true },
    });

    for (const p of proximos) {
      if (this.notificados.has(p.id)) continue;
      this.notificados.add(p.id);
      await this.notif.notificarProximoPartido(p.id);
      this.logger.log(`Recordatorio enviado para partido ${p.id}.`);
    }
  }
}
