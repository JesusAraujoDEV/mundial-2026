import { Module } from '@nestjs/common';
import { PrediccionesEspecialesController } from './predicciones-especiales.controller';
import { PrediccionesEspecialesService } from './predicciones-especiales.service';

@Module({
  controllers: [PrediccionesEspecialesController],
  providers: [PrediccionesEspecialesService],
})
export class PrediccionesEspecialesModule {}
