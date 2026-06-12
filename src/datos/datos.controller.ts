import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DatosService } from './datos.service';

@ApiTags('datos')
@Controller('mundial')
export class DatosController {
  constructor(private readonly datosService: DatosService) {}

  @Get('paises')
  @ApiOperation({
    summary: 'Listar todos los países',
    description: 'Retorna la lista de todos los países registrados en el mundial.',
  })
  @ApiResponse({ status: 200, description: 'Lista de países.' })
  obtenerPaises() {
    return this.datosService.obtenerPaises();
  }

  @Get('jugadores')
  @ApiOperation({
    summary: 'Listar jugadores',
    description: 'Retorna todos los jugadores. Se puede filtrar por país usando el query param paisId.',
  })
  @ApiQuery({ name: 'paisId', required: false, type: Number, description: 'Filtrar por ID de país' })
  @ApiResponse({ status: 200, description: 'Lista de jugadores.' })
  obtenerJugadores(@Query('paisId') paisId?: string) {
    return this.datosService.obtenerJugadores(paisId ? parseInt(paisId, 10) : undefined);
  }

  @Get('partidos')
  @ApiOperation({
    summary: 'Listar partidos',
    description: 'Retorna todos los partidos del mundial. Se puede filtrar por fase (grupos, 16avos, octavos, cuartos, semifinal, final).',
  })
  @ApiQuery({ name: 'fase', required: false, type: String, description: 'Filtrar por fase del torneo' })
  @ApiResponse({ status: 200, description: 'Lista de partidos.' })
  obtenerPartidos(@Query('fase') fase?: string) {
    return this.datosService.obtenerPartidos(fase);
  }
}
