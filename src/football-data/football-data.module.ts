import { Module } from '@nestjs/common';
import { FootballDataService } from './football-data.service';
import { LiveSyncService } from './live-sync.service';
import { FootballDataController } from './football-data.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [RealtimeModule, AdminModule],
  controllers: [FootballDataController],
  providers: [FootballDataService, LiveSyncService],
  exports: [FootballDataService, LiveSyncService],
})
export class FootballDataModule {}
