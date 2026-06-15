import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LiveSyncService } from './live-sync.service';

@ApiTags('football-data')
@Controller('mundial')
export class FootballDataController {
  constructor(private readonly liveSync: LiveSyncService) {}

  @Post('admin/sync-vivo')
  @ApiOperation({
    summary: 'Forzar sincronización de marcadores en vivo',
    description:
      'Consulta football-data.org, actualiza marcadores/estado de los partidos de grupos, emite el efecto de gol por cada incremento y recalcula puntos/grupos.',
  })
  @ApiResponse({ status: 201, description: 'Sincronización ejecutada.' })
  syncVivo() {
    return this.liveSync.sincronizarEnVivo();
  }

  @Post('admin/sync-escudos')
  @ApiOperation({
    summary: 'Sincronizar escudos desde football-data',
    description: 'Actualiza paises.bandera_url con los crest oficiales de football-data.org.',
  })
  @ApiResponse({ status: 201, description: 'Escudos sincronizados.' })
  syncEscudos() {
    return this.liveSync.sincronizarEscudos();
  }

  @Get('estadisticas/goleadores-fifa')
  @ApiOperation({
    summary: 'Goleadores del Mundial (football-data)',
    description: 'Tabla de goleadores oficial de la FIFA World Cup desde football-data.org.',
  })
  @ApiResponse({ status: 200, description: 'Lista de goleadores.' })
  goleadores(@Query('limit') limit?: string) {
    return this.liveSync.obtenerGoleadores(limit ? Number(limit) : 20);
  }
}
