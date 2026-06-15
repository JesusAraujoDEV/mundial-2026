import { Module } from '@nestjs/common';
import { FootballDataService } from './football-data.service';
import { LiveSyncService } from './live-sync.service';
import { FootballDataController } from './football-data.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminModule } from '../admin/admin.module';
import { FotosModule } from '../fotos/fotos.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [RealtimeModule, AdminModule, FotosModule, NotificacionesModule],
  controllers: [FootballDataController],
  providers: [FootballDataService, LiveSyncService],
  exports: [FootballDataService, LiveSyncService],
})
export class FootballDataModule {}
