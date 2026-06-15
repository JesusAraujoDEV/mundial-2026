import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CargarPaisDto } from './dto/cargar-pais.dto';
import { ActualizarPartidoDto } from './dto/actualizar-partido.dto';
import { CargarGolesDto } from './dto/cargar-goles.dto';
import { AgregarGolDto } from './dto/agregar-gol.dto';

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

  @Post('recalcular-grupos')
  @ApiOperation({
    summary: 'Recalcular estadísticas de todos los grupos',
    description:
      'Resetea y recalcula las estadísticas de todos los grupos (puntos, PJ, GF, GC, etc.) basándose en los resultados actuales de los partidos de fase de grupos.',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de grupos recalculadas.' })
  recalcularGrupos() {
    return this.adminService.recalcularGrupos();
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

  @Post('partido/:id/gol')
  @ApiOperation({
    summary: 'Registrar UN gol en vivo (dispara el efecto)',
    description:
      'Añade un gol individual a un partido. El marcador se actualiza solo a partir de los goles, se recalculan puntos y grupos, y se emite el efecto de gol en tiempo real a todos los clientes.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 201, description: 'Gol registrado y efecto emitido.' })
  @ApiResponse({ status: 404, description: 'Partido o jugador no encontrado.' })
  agregarGol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarGolDto,
  ) {
    return this.adminService.agregarGol(id, dto);
  }

  @Delete('gol/:golId')
  @ApiOperation({
    summary: 'Eliminar un gol (editar marcador en vivo)',
    description:
      'Elimina un gol; el marcador se recalcula automáticamente y se emiten las actualizaciones en tiempo real.',
  })
  @ApiParam({ name: 'golId', type: Number, description: 'ID del gol' })
  @ApiResponse({ status: 200, description: 'Gol eliminado y marcador recalculado.' })
  @ApiResponse({ status: 404, description: 'Gol no encontrado.' })
  eliminarGol(@Param('golId', ParseIntPipe) golId: number) {
    return this.adminService.eliminarGol(golId);
  }
}
