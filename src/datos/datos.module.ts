import { Module } from '@nestjs/common';
import { DatosController } from './datos.controller';
import { DatosService } from './datos.service';

@Module({
  controllers: [DatosController],
  providers: [DatosService],
})
export class DatosModule {}
