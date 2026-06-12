import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EstadisticasService } from './estadisticas.service';

@ApiTags('estadisticas')
@Controller('mundial/estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('goleadores')
  @ApiOperation({
    summary: 'Top goleadores y selecciones goleadoras',
    description:
      'Retorna el ranking de jugadores con más goles en el torneo y las selecciones con más goles anotados.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad máxima de resultados (default: 20)',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de goleadores obtenidas.' })
  obtenerGoleadores(@Query('limit') limit?: number) {
    return this.estadisticasService.obtenerGoleadores(limit ?? 20);
  }
}
