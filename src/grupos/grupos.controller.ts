import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GruposService } from './grupos.service';

@ApiTags('grupos')
@Controller('mundial')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get('grupos')
  @ApiOperation({
    summary: 'Tabla de posiciones por grupo',
    description:
      'Retorna los 12 grupos (A-L) con sus 4 selecciones ordenadas por puntos, diferencia de goles, goles a favor y Fair Play.',
  })
  @ApiResponse({ status: 200, description: 'Grupos obtenidos exitosamente.' })
  obtenerGrupos() {
    return this.gruposService.obtenerGrupos();
  }

  @Get('mejores-terceros')
  @ApiOperation({
    summary: 'Tabla de mejores terceros',
    description:
      'Consolida los 12 equipos en 3° lugar de cada grupo, ordenados por reglas FIFA. Marca los 8 que clasifican a 16avos.',
  })
  @ApiResponse({ status: 200, description: 'Mejores terceros obtenidos exitosamente.' })
  obtenerMejoresTerceros() {
    return this.gruposService.obtenerMejoresTerceros();
  }

  @Get('playoffs/llaves')
  @ApiOperation({
    summary: 'Cuadro de eliminación directa',
    description:
      'Retorna el árbol de playoffs desde 16avos hasta la Final con los cruces FIFA preestablecidos y los equipos reales asignados.',
  })
  @ApiResponse({ status: 200, description: 'Llaves de playoffs obtenidas exitosamente.' })
  obtenerLlaves() {
    return this.gruposService.obtenerLlavesPlayoffs();
  }
}
