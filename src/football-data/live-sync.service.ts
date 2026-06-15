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
  /** Último marcador observado por partido EN ESTE PROCESO (para detectar goles en vivo). */
  private lastScores = new Map<number, { l: number; v: number }>();

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

        // Efecto de gol SOLO si: partido EN VIVO + ya teníamos una observación
        // previa EN ESTE PROCESO (prime) + el marcador subió. Esto evita:
        //  - overlays de partidos ya finalizados,
        //  - ráfagas al reiniciar el backend (re-prime, no re-emite).
        const seen = this.lastScores.get(partido.id);
        if (estado === 'en_vivo' && seen) {
          if (newL > seen.l) emitirGoles('local', newL - seen.l, newL, newV);
          if (newV > seen.v) emitirGoles('visitante', newV - seen.v, newL, newV);
        }
        this.lastScores.set(partido.id, { l: newL, v: newV });

        // Persistir marcador/estado (recalcula puntos/grupos + match:updated) si cambió.
        const scoreChanged =
          newL !== partido.golesLocal || newV !== partido.golesVisitante;
        const estadoChanged = estado !== partido.estado;
        if (scoreChanged || estadoChanged) {
          await this.admin.actualizarPartido(partido.id, {
            golesLocal: newL,
            golesVisitante: newV,
            estado,
          });
          partidosActualizados++;
        }
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

  /** Estadísticas agregadas del Mundial calculadas desde los marcadores reales. */
  async obtenerResumenFifa() {
    const matches = await this.fd.getWcMatches();
    const jugados = matches.filter(
      (m) =>
        m.score.fullTime.home != null &&
        m.score.fullTime.away != null &&
        (m.status === 'FINISHED' || m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'AWARDED'),
    );

    type Sel = { pais: string; escudo: string | null; pj: number; gf: number; gc: number };
    const sel = new Map<number, Sel>();
    const add = (team: { id: number; name: string; crest: string }, gf: number, gc: number) => {
      const pais = FD_TEAM_TO_PAIS[team.id] ?? team.name;
      const cur = sel.get(team.id) ?? { pais, escudo: team.crest ?? null, pj: 0, gf: 0, gc: 0 };
      cur.pj += 1; cur.gf += gf; cur.gc += gc;
      sel.set(team.id, cur);
    };

    let totalGoles = 0;
    let partidosConGoles = 0;
    let mayor: { local: string; visitante: string; golesLocal: number; golesVisitante: number; total: number } | null = null;
    const partidosScored = jugados.map((m) => {
      const gl = m.score.fullTime.home!;
      const gv = m.score.fullTime.away!;
      add(m.homeTeam, gl, gv);
      add(m.awayTeam, gv, gl);
      totalGoles += gl + gv;
      if (gl + gv > 0) partidosConGoles += 1;
      const row = {
        local: FD_TEAM_TO_PAIS[m.homeTeam.id] ?? m.homeTeam.name,
        localEscudo: m.homeTeam.crest ?? null,
        visitante: FD_TEAM_TO_PAIS[m.awayTeam.id] ?? m.awayTeam.name,
        visitanteEscudo: m.awayTeam.crest ?? null,
        golesLocal: gl,
        golesVisitante: gv,
        total: gl + gv,
      };
      if (!mayor || Math.abs(gl - gv) > Math.abs(mayor.golesLocal - mayor.golesVisitante)) {
        mayor = { local: row.local, visitante: row.visitante, golesLocal: gl, golesVisitante: gv, total: gl + gv };
      }
      return row;
    });

    const selecciones = [...sel.values()]
      .map((s) => ({ ...s, dg: s.gf - s.gc }))
      .sort((a, b) => b.gf - a.gf || b.dg - a.dg);

    const topPartidos = partidosScored.sort((a, b) => b.total - a.total).slice(0, 6);

    return {
      resumen: {
        partidosJugados: jugados.length,
        totalGoles,
        promedioGoles: jugados.length ? +(totalGoles / jugados.length).toFixed(2) : 0,
        partidosConGoles,
        mayorGoleada: mayor,
      },
      selecciones,
      topPartidos,
    };
  }
}
