import { Controller, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FotosService } from './fotos.service';

@ApiTags('admin')
@Controller('mundial/admin')
export class FotosController {
  constructor(private readonly fotos: FotosService) {}

  @Post('sync-fotos')
  @ApiOperation({
    summary: 'Descargar fotos de jugadores (TheSportsDB)',
    description:
      'Rellena jugadores.foto_url con el recorte de cara de TheSportsDB. Prioriza los jugadores elegidos en predicciones. Usar varias veces para cubrir más jugadores.',
  })
  @ApiResponse({ status: 201, description: 'Fotos sincronizadas.' })
  syncFotos(@Query('limit') limit?: string) {
    return this.fotos.sincronizarFotos(limit ? Number(limit) : 30);
  }
}
