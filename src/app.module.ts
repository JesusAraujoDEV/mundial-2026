import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { PronosticosModule } from './pronosticos/pronosticos.module';
import { RankingModule } from './ranking/ranking.module';

@Module({
  imports: [PrismaModule, AdminModule, PronosticosModule, RankingModule],
})
export class AppModule {}
