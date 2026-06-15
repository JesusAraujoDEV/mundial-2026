import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AdminService } from '../admin/admin.service';
import { FootballDataService } from './football-data.service';
import { FD_TEAM_TO_PAIS, mapEstado } from './football-data.constants';

/**
 * Sincroniza marcadores en vivo desde football-data.org y los actualiza solos:
 * detecta incrementos de marcador -> emite el efecto de gol + recalcula vía
 * AdminService. Stateless: compara siempre contra la DB (sobrevive reinicios).
 */
@Injectable()
export class LiveSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LiveSyncService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fd: FootballDataService,
    private readonly realtime: RealtimeService,
    private readonly admin: AdminService,
  ) {}

  onModuleInit() {
    const enabled = (process.env.LIVE_SYNC_ENABLED ?? 'true') !== 'false';
    if (!process.env.FOOTBALL_DATA_TOKEN) {
      this.logger.warn('FOOTBALL_DATA_TOKEN no configurado: live-sync desactivado.');
      return;
    }
    // Escudos una vez al arrancar (best-effort).
    this.sincronizarEscudos().catch((e) =>
      this.logger.warn(`Sync de escudos inicial falló: ${e.message}`),
    );
    if (!enabled) {
      this.logger.log('LIVE_SYNC_ENABLED=false: poller no iniciado.');
      return;
    }
    const intervalMs = Number(process.env.LIVE_SYNC_INTERVAL_MS ?? 30000);
    this.logger.log(`Poller de marcadores en vivo cada ${intervalMs}ms.`);
    this.timer = setInterval(() => {
      this.sincronizarEnVivo().catch((e) =>
        this.logger.warn(`Tick de live-sync falló: ${e.message}`),
      );
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Construye nombre(pais) -> {id, banderaUrl}. */
  private async mapaPaises() {
    const paises = await this.prisma.pais.findMany();
    const m = new Map<string, { id: number; banderaUrl: string | null }>();
    for (const p of paises) m.set(p.nombre, { id: p.id, banderaUrl: p.banderaUrl });
    return m;
  }

  /** Un ciclo de sincronización de marcadores en vivo. */
  async sincronizarEnVivo() {
    if (this.running) return { skipped: true };
    this.running = true;
    try {
      const matches = await this.fd.getWcMatches();
      const paises = await this.mapaPaises();
      let golesEmitidos = 0;
      let partidosActualizados = 0;
      let fechasActualizadas = 0;

      for (const m of matches) {
        if (m.stage !== 'GROUP_STAGE') continue; // knockout = placeholders en DB
        const localNombre = FD_TEAM_TO_PAIS[m.homeTeam?.id];
        const visitanteNombre = FD_TEAM_TO_PAIS[m.awayTeam?.id];
        if (!localNombre || !visitanteNombre) continue;
        const localP = paises.get(localNombre);
        const visitanteP = paises.get(visitanteNombre);
        if (!localP || !visitanteP) continue;

        const partido = await this.prisma.partido.findFirst({
          where: { localId: localP.id, visitanteId: visitanteP.id, fase: 'grupos' },
        });
        if (!partido) continue;

        // Sincronizar la fecha real (kickoff) para countdown/minuto/día exactos.
        if (m.utcDate) {
          const apiFecha = new Date(m.utcDate);
          if (partido.fecha.getTime() !== apiFecha.getTime()) {
            await this.prisma.partido.update({
              where: { id: partido.id },
              data: { fecha: apiFecha },
            });
            fechasActualizadas++;
          }
        }

        const estado = mapEstado(m.status);
        // Sin datos de marcador todavía -> no tocar.
        if (
          estado === 'programado' &&
          m.score.fullTime.home == null &&
          m.score.fullTime.away == null
        ) {
          continue;
        }
        const newL = m.score.fullTime.home ?? 0;
        const newV = m.score.fullTime.away ?? 0;
        const curL = partido.golesLocal;
        const curV = partido.golesVisitante;

        const scoreChanged = newL !== curL || newV !== curV;
        const estadoChanged = estado !== partido.estado;
        if (!scoreChanged && !estadoChanged) continue;

        // Efecto de gol SOLO cuando ya teníamos un marcador previo conocido
        // (evita una avalancha de overlays al backfillear partidos ya jugados).
        const emitirGoles = (
          equipo: 'local' | 'visitante',
          delta: number,
          marcadorL: number,
          marcadorV: number,
        ) => {
          const p = equipo === 'local' ? localP : visitanteP;
          const nombre = equipo === 'local' ? localNombre : visitanteNombre;
          for (let i = 0; i < delta; i++) {
            this.realtime.emitGoal({
              partidoId: partido.id,
              equipo,
              paisId: p.id,
              paisNombre: nombre,
              paisEscudo: p.banderaUrl ?? null,
              jugador: null, // free tier no da goleador por partido
              jugadorId: null,
              minuto: null,
              tipo: 'normal',
              golesLocal: marcadorL,
              golesVisitante: marcadorV,
              localNombre,
              visitanteNombre,
            });
            golesEmitidos++;
          }
        };
        if (curL != null && newL > curL) emitirGoles('local', newL - curL, newL, newV);
        if (curV != null && newV > curV) emitirGoles('visitante', newV - curV, newL, newV);

        // Aplica marcador/estado + recalcula puntos/grupos + emite match:updated/ranking/grupos.
        await this.admin.actualizarPartido(partido.id, {
          golesLocal: newL,
          golesVisitante: newV,
          estado,
        });
        partidosActualizados++;
      }

      if (partidosActualizados > 0 || golesEmitidos > 0 || fechasActualizadas > 0) {
        this.logger.log(
          `Live-sync: ${partidosActualizados} partidos, ${golesEmitidos} goles, ${fechasActualizadas} fechas.`,
        );
      }
      return { partidosActualizados, golesEmitidos, fechasActualizadas };
    } finally {
      this.running = false;
    }
  }

  /** Sincroniza escudos (crest) desde football-data a paises.bandera_url. */
  async sincronizarEscudos() {
    const teams = await this.fd.getWcTeams();
    const paises = await this.prisma.pais.findMany();
    const porNombre = new Map(paises.map((p) => [p.nombre, p]));
    let actualizados = 0;
    const noEncontrados: string[] = [];
    for (const t of teams) {
      const nombre = FD_TEAM_TO_PAIS[t.id];
      if (!nombre) {
        noEncontrados.push(`${t.name} (${t.id})`);
        continue;
      }
      const pais = porNombre.get(nombre);
      if (!pais || !t.crest) continue;
      const crest = t.crest.slice(0, 500);
      if (pais.banderaUrl === crest) continue;
      await this.prisma.pais.update({
        where: { id: pais.id },
        data: { banderaUrl: crest },
      });
      actualizados++;
    }
    this.logger.log(`Escudos sincronizados: ${actualizados} actualizados.`);
    return { actualizados, noEncontrados, total: teams.length };
  }

  /** Goleadores del Mundial mapeados a nuestros nombres de país. */
  async obtenerGoleadores(limit = 20) {
    const scorers = await this.fd.getWcScorers(limit);
    return scorers.map((s) => ({
      jugador: s.player.name,
      nacionalidad: s.player.nationality,
      pais: FD_TEAM_TO_PAIS[s.team?.id] ?? s.team?.name,
      paisEscudo: s.team?.crest ?? null,
      goles: s.goals ?? 0,
      partidos: s.playedMatches ?? 0,
      asistencias: s.assists ?? 0,
    }));
  }
}
