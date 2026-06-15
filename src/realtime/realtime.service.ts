import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import {
  MatchGoalPayload,
  MatchUpdatedPayload,
  RealtimeEvent,
} from './realtime.events';

/**
 * Fachada de emisión real-time. Los módulos de dominio (admin) inyectan ESTE
 * servicio y nunca el gateway, manteniendo el transporte desacoplado del dominio.
 * Todas las emisiones deben dispararse DESPUÉS de commitear en DB.
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitGoal(payload: MatchGoalPayload) {
    this.gateway.broadcast(RealtimeEvent.MatchGoal, payload);
  }

  emitMatchUpdate(payload: MatchUpdatedPayload) {
    this.gateway.broadcast(RealtimeEvent.MatchUpdated, payload);
  }

  emitGroupsUpdated() {
    this.gateway.broadcast(RealtimeEvent.GroupsUpdated, {
      updatedAt: new Date().toISOString(),
    });
  }

  emitRankingUpdated() {
    this.gateway.broadcast(RealtimeEvent.RankingUpdated, {
      updatedAt: new Date().toISOString(),
    });
  }
}
