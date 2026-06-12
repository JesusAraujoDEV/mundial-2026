import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RankingService } from './ranking.service';

@ApiTags('ranking')
@Controller('mundial')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('ranking')
  @ApiOperation({
    summary: 'Tabla de posiciones',
    description:
      'Retorna el ranking general de todos los usuarios ordenado de mayor a menor puntuación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking obtenido exitosamente.',
  })
  obtenerRanking() {
    return this.rankingService.obtenerRanking();
  }

  @Get('matriz-pronosticos')
  @ApiOperation({
    summary: 'Matriz de pronósticos',
    description:
      'Retorna todos los partidos con las predicciones de cada usuario, permitiendo visualizar una matriz completa de pronósticos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Matriz de pronósticos obtenida exitosamente.',
  })
  obtenerMatriz() {
    return this.rankingService.obtenerMatrizPronosticos();
  }
}
