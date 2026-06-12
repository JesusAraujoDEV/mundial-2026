import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PronosticosModule } from './pronosticos/pronosticos.module';
import { RankingModule } from './ranking/ranking.module';
import { GruposModule } from './grupos/grupos.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    PronosticosModule,
    RankingModule,
    GruposModule,
    EstadisticasModule,
  ],
})
export class AppModule {}
