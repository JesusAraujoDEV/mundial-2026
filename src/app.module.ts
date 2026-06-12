import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PronosticosModule } from './pronosticos/pronosticos.module';
import { RankingModule } from './ranking/ranking.module';
import { GruposModule } from './grupos/grupos.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { DatosModule } from './datos/datos.module';

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
  ],
})
export class AppModule {}
