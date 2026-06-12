import { Controller, Post, Put, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CargarPaisDto } from './dto/cargar-pais.dto';
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';
import { CargarGolesDto } from './dto/cargar-goles.dto';

@ApiTags('admin')
@Controller('mundial/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('cargar-pais')
  @ApiOperation({
    summary: 'Cargar país con plantilla completa',
    description:
      'Registra o actualiza un país y reemplaza su plantilla de jugadores completa.',
  })
  @ApiResponse({ status: 201, description: 'País y jugadores cargados exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  cargarPais(@Body() dto: CargarPaisDto) {
    return this.adminService.cargarPais(dto);
  }

  @Put('partido/:id')
  @ApiOperation({
    summary: 'Actualizar partido (marcador o bloqueo)',
    description:
      'Permite al admin actualizar goles reales de un partido y/o cambiar el estado de bloqueo. Si se actualizan goles, se recalculan automáticamente los puntos de todos los pronósticos.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 200, description: 'Partido actualizado y puntos recalculados.' })
  @ApiResponse({ status: 404, description: 'Partido no encontrado.' })
  actualizarPartido(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPartidoDto,
  ) {
    return this.adminService.actualizarPartido(id, dto);
  }

  @Post('recalcular-puntos')
  @ApiOperation({
    summary: 'Recalcular todos los puntos',
    description:
      'Recalcula los puntos de TODOS los pronósticos basándose en los resultados actuales de los partidos. Útil cuando se insertan pronósticos manualmente o si hay desincronización.',
  })
  @ApiResponse({ status: 200, description: 'Puntos recalculados para todos los usuarios.' })
  recalcularTodosLosPuntos() {
    return this.adminService.recalcularTodosLosPuntos();
  }

  @Post('partido/:id/goles')
  @ApiOperation({
    summary: 'Cargar goles de un partido',
    description:
      'Reemplaza todos los goles registrados de un partido con la nueva lista. Permite agregar goles con jugador, minuto y tipo (normal/penal/autogol).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 201, description: 'Goles cargados exitosamente.' })
  @ApiResponse({ status: 404, description: 'Partido no encontrado.' })
  cargarGoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CargarGolesDto,
  ) {
    return this.adminService.cargarGoles(id, dto);
  }
}
