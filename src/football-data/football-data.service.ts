import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FD_BASE, WC_COMPETITION } from './football-data.constants';

export interface FdTeam {
  id: number;
  name: string;
  tla: string;
  crest: string;
}
export interface FdMatch {
  id: number;
  status: string;
  stage: string;
  group: string | null;
  utcDate: string;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}
export interface FdScorer {
  player: { id: number; name: string; nationality: string | null };
  team: FdTeam;
  goals: number | null;
  assists: number | null;
  playedMatches: number | null;
}

/**
 * Cliente de football-data.org (v4). Solo lectura. Requiere FOOTBALL_DATA_TOKEN.
 * Plan gratis: 10 req/min, sin detalle de gol por partido (solo marcador).
 */
@Injectable()
export class FootballDataService {
  private readonly logger = new Logger(FootballDataService.name);
  private get token() {
    return process.env.FOOTBALL_DATA_TOKEN || '';
  }

  // Caché por ruta (protege el límite de 10 req/min y permite pollear rápido).
  private cache = new Map<string, { exp: number; data: unknown }>();

  private async get<T>(path: string, ttlMs = 0): Promise<T> {
    if (!this.token) {
      throw new ServiceUnavailableException('FOOTBALL_DATA_TOKEN no configurado.');
    }
    const hit = this.cache.get(path);
    const nowMs = Number(process.hrtime.bigint() / 1000000n);
    if (hit && hit.exp > nowMs) return hit.data as T;

    const res = await fetch(`${FD_BASE}${path}`, {
      headers: { 'X-Auth-Token': this.token },
    });
    if (res.status === 429) {
      if (hit) return hit.data as T; // si hay caché previa, úsala ante rate-limit
      throw new ServiceUnavailableException(
        'Límite de peticiones de football-data alcanzado (10/min).',
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ServiceUnavailableException(
        `football-data respondió ${res.status}: ${body.slice(0, 120)}`,
      );
    }
    const data = (await res.json()) as T;
    if (ttlMs > 0) this.cache.set(path, { exp: nowMs + ttlMs, data });
    return data;
  }

  async getWcMatches(): Promise<FdMatch[]> {
    const data = await this.get<{ matches: FdMatch[] }>(
      `/competitions/${WC_COMPETITION}/matches`,
      8000, // 8s: suficiente para reusar entre poller y endpoints
    );
    return data.matches ?? [];
  }

  async getWcTeams(): Promise<FdTeam[]> {
    const data = await this.get<{ teams: FdTeam[] }>(
      `/competitions/${WC_COMPETITION}/teams`,
      3600000, // 1h
    );
    return data.teams ?? [];
  }

  async getWcScorers(limit = 20): Promise<FdScorer[]> {
    const data = await this.get<{ scorers: FdScorer[] }>(
      `/competitions/${WC_COMPETITION}/scorers?limit=${limit}`,
      30000, // 30s
    );
    return data.scorers ?? [];
  }

  async getWcStandings(): Promise<FdStandingGroup[]> {
    const data = await this.get<{ standings: FdStandingGroup[] }>(
      `/competitions/${WC_COMPETITION}/standings`,
      30000,
    );
    return data.standings ?? [];
  }
}

export interface FdStandingRow {
  position: number;
  team: FdTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
export interface FdStandingGroup {
  type: string;
  group: string | null;
  table: FdStandingRow[];
}
