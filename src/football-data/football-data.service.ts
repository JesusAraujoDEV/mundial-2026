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

  private async get<T>(path: string): Promise<T> {
    if (!this.token) {
      throw new ServiceUnavailableException('FOOTBALL_DATA_TOKEN no configurado.');
    }
    const res = await fetch(`${FD_BASE}${path}`, {
      headers: { 'X-Auth-Token': this.token },
    });
    if (res.status === 429) {
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
    return (await res.json()) as T;
  }

  async getWcMatches(): Promise<FdMatch[]> {
    const data = await this.get<{ matches: FdMatch[] }>(
      `/competitions/${WC_COMPETITION}/matches`,
    );
    return data.matches ?? [];
  }

  async getWcTeams(): Promise<FdTeam[]> {
    const data = await this.get<{ teams: FdTeam[] }>(
      `/competitions/${WC_COMPETITION}/teams`,
    );
    return data.teams ?? [];
  }

  async getWcScorers(limit = 20): Promise<FdScorer[]> {
    const data = await this.get<{ scorers: FdScorer[] }>(
      `/competitions/${WC_COMPETITION}/scorers?limit=${limit}`,
    );
    return data.scorers ?? [];
  }
}
