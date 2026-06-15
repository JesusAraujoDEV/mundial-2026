import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PronosticosModule } from './pronosticos/pronosticos.module';
import { RankingModule } from './ranking/ranking.module';
import { GruposModule } from './grupos/grupos.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { DatosModule } from './datos/datos.module';
import { RealtimeModule } from './realtime/realtime.module';
import { FootballDataModule } from './football-data/football-data.module';
import { PrediccionesEspecialesModule } from './predicciones/predicciones-especiales.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    PronosticosModule,
    RankingModule,
    GruposModule,
    EstadisticasModule,
    DatosModule,
    RealtimeModule,
    FootballDataModule,
    PrediccionesEspecialesModule,
  ],
})
export class AppModule {}
