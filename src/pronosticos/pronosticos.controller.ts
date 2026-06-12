import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PronosticosService } from './pronosticos.service';
import { CrearPronosticoDto } from './dto/crear-pronostico.dto';

@ApiTags('pronosticos')
@Controller('mundial/usuario')
export class PronosticosController {
  constructor(private readonly pronosticosService: PronosticosService) {}

  @Post(':usuarioId/partido/:partidoId/pronostico')
  @ApiOperation({
    summary: 'Crear o modificar pronóstico',
    description:
      'Permite a un usuario guardar o actualizar su predicción para un partido. Si el partido está bloqueado, la operación es rechazada.',
  })
  @ApiParam({ name: 'usuarioId', type: Number, description: 'ID del usuario' })
  @ApiParam({ name: 'partidoId', type: Number, description: 'ID del partido' })
  @ApiResponse({ status: 201, description: 'Pronóstico guardado correctamente.' })
  @ApiResponse({ status: 400, description: 'Partido bloqueado o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Usuario o partido no encontrado.' })
  crearPronostico(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('partidoId', ParseIntPipe) partidoId: number,
    @Body() dto: CrearPronosticoDto,
  ) {
    return this.pronosticosService.crearOActualizarPronostico(
      usuarioId,
      partidoId,
      dto,
    );
  }
}
