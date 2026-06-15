import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
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
    summary: 'Listar y buscar jugadores',
    description: 'Retorna jugadores. Filtrable por paisId y/o búsqueda parcial por nombre con q.',
  })
  @ApiQuery({ name: 'paisId', required: false, type: Number, description: 'Filtrar por ID de país' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Buscar por nombre parcial del jugador' })
  @ApiResponse({ status: 200, description: 'Lista de jugadores.' })
  obtenerJugadores(@Query('paisId') paisId?: string, @Query('q') q?: string) {
    return this.datosService.obtenerJugadores(
      paisId ? parseInt(paisId, 10) : undefined,
      q,
    );
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

  @Get('partido/:id/goles')
  @ApiOperation({
    summary: 'Obtener goles de un partido',
    description: 'Retorna la lista de goles registrados para un partido específico.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 200, description: 'Lista de goles del partido.' })
  obtenerGolesPartido(@Param('id', ParseIntPipe) id: number) {
    return this.datosService.obtenerGolesPartido(id);
  }
}
