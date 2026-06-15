import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';

@ApiTags('notificaciones')
@Controller('mundial/notificaciones')
export class NotificacionesController {
  constructor(private readonly notif: NotificacionesService) {}

  @Post('partido/:id/recordatorio')
  @ApiOperation({
    summary: 'Enviar recordatorio del partido',
    description:
      'Envía al grupo de WhatsApp el recordatorio del partido con la hora y la lista de usuarios que aún no han hecho su predicción.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 201, description: 'Recordatorio enviado.' })
  async recordatorio(@Param('id', ParseIntPipe) id: number) {
    await this.notif.notificarProximoPartido(id);
    return { message: `Recordatorio del partido ${id} enviado.` };
  }

  @Get('partido/:id/evaluacion')
  @ApiOperation({
    summary: 'Evaluar partido (sin enviar)',
    description:
      'Devuelve la evaluación del marcador ACTUAL: a quién beneficia (exactos/tendencia/sin puntos) y la tabla del grupo. No envía nada a WhatsApp.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 200, description: 'Evaluación calculada.' })
  evaluar(@Param('id', ParseIntPipe) id: number) {
    return this.notif.evaluarPartido(id);
  }

  @Post('partido/:id/evaluacion')
  @ApiOperation({
    summary: 'Enviar evaluación del partido en curso',
    description:
      'Envía al grupo un mensaje con el estado actual: a quién beneficia el marcador si terminara así y cómo va la tabla del grupo.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 201, description: 'Evaluación enviada.' })
  async enviarEvaluacion(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notif.notificarEvaluacionPartido(id);
    return { message: `Evaluación del partido ${id} enviada.`, data };
  }

  @Post('partido/:id/final')
  @ApiOperation({
    summary: 'Enviar aviso de fin de partido',
    description:
      'Envía al grupo el resultado final: quién sumó puntos (exacto/tendencia), tabla del grupo actualizada y top del ranking general.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 201, description: 'Aviso de fin enviado.' })
  async enviarFinal(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notif.notificarFinPartido(id);
    return { message: `Aviso de fin del partido ${id} enviado.`, data };
  }
}
