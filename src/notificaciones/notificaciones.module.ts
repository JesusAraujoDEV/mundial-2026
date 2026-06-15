import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { NotificacionesService } from './notificaciones.service';
import { RecordatoriosService } from './recordatorios.service';
import { NotificacionesController } from './notificaciones.controller';

@Module({
  controllers: [NotificacionesController],
  providers: [WhatsappService, NotificacionesService, RecordatoriosService],
  exports: [NotificacionesService, WhatsappService],
})
export class NotificacionesModule {}
