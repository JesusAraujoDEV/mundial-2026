import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PrediccionesEspecialesService } from './predicciones-especiales.service';
import { GuardarPrediccionEspecialDto } from './dto/guardar-prediccion-especial.dto';

@ApiTags('predicciones-especiales')
@Controller('mundial')
export class PrediccionesEspecialesController {
  constructor(private readonly service: PrediccionesEspecialesService) {}

  @Get('predicciones-especiales/:usuarioId')
  @ApiOperation({
    summary: 'Obtener predicciones especiales de un usuario',
    description: 'Retorna las predicciones fijas (campeón, sorpresa, balón de oro, bota de oro, guante de oro) de un usuario.',
  })
  @ApiParam({ name: 'usuarioId', type: Number, description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Predicciones del usuario.' })
  obtener(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.service.obtener(usuarioId);
  }

  @Post('predicciones-especiales/:usuarioId')
  @ApiOperation({
    summary: 'Guardar o actualizar predicciones especiales',
    description: 'Permite al usuario guardar sus predicciones fijas. Si ya existen, las actualiza. Si están bloqueadas, rechaza la operación.',
  })
  @ApiParam({ name: 'usuarioId', type: Number, description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Predicciones guardadas.' })
  @ApiResponse({ status: 400, description: 'Predicciones bloqueadas.' })
  guardar(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() dto: GuardarPrediccionEspecialDto,
  ) {
    return this.service.guardar(usuarioId, dto);
  }
}
