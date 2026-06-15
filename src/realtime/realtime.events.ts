/**
 * Contrato de eventos WebSocket (server -> client) del namespace /realtime.
 * Esta es la fuente de verdad; el frontend debe espejar estos nombres y formas.
 */

export const REALTIME_NAMESPACE = '/realtime';

export const RealtimeEvent = {
  Connected: 'connected',
  MatchGoal: 'match:goal',
  MatchUpdated: 'match:updated',
  GroupsUpdated: 'groups:updated',
  RankingUpdated: 'ranking:updated',
} as const;

export type EstadoPartido = 'programado' | 'en_vivo' | 'finalizado';

/** Disparado al registrar un gol. Lleva todo lo necesario para animar SIN refetch. */
export interface MatchGoalPayload {
  partidoId: number;
  equipo: 'local' | 'visitante';
  paisId: number;
  paisNombre: string;
  paisEscudo: string | null;
  jugador: string | null;
  jugadorId: number | null;
  minuto: number | null;
  tipo: string; // normal | penal | autogol
  golesLocal: number;
  golesVisitante: number;
  localNombre: string;
  visitanteNombre: string;
}

/** Disparado al cambiar marcador/estado/cierre de un partido. */
export interface MatchUpdatedPayload {
  partidoId: number;
  golesLocal: number | null;
  golesVisitante: number | null;
  estado: EstadoPartido;
  bloqueado: boolean;
}

/** Señales de invalidación (el cliente refetchea la tabla autoritativa). */
export interface SignalPayload {
  updatedAt: string; // ISO
}

export interface ConnectedPayload {
  ts: string; // ISO
}
