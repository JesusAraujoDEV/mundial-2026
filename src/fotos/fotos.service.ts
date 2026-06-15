import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BASE = `https://www.thesportsdb.com/api/v1/json/${process.env.THESPORTSDB_KEY || '3'}`;

/**
 * Fotos de jugadores desde TheSportsDB (gratis). Devuelve el "cutout" (recorte
 * de cara) o el thumb. Cachea en memoria por nombre y persiste en jugadores.foto_url.
 */
@Injectable()
export class FotosService {
  private readonly logger = new Logger(FotosService.name);
  private cache = new Map<string, string | null>();

  constructor(private readonly prisma: PrismaService) {}

  private norm(n: string): string {
    return (n || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  /** Foto ya cacheada (no dispara request). undefined = aún no consultada. */
  getCached(nombre: string): string | null | undefined {
    return this.cache.get(this.norm(nombre));
  }

  private async lookup(nombre: string): Promise<string | null> {
    try {
      const res = await fetch(
        `${BASE}/searchplayers.php?p=${encodeURIComponent(nombre)}`,
      );
      if (!res.ok) return null;
      const j: any = await res.json();
      const lista: any[] = j.player || [];
      const p = lista.find((x) => x.strSport === 'Soccer') || lista[0];
      return p ? p.strCutout || p.strThumb || null : null;
    } catch {
      return null;
    }
  }

  /** Foto por nombre: caché -> DB jugador -> TheSportsDB. Cachea el resultado. */
  async fotoPorNombre(nombre: string): Promise<string | null> {
    const k = this.norm(nombre);
    if (this.cache.has(k)) return this.cache.get(k) ?? null;

    const jug = await this.prisma.jugador.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' }, fotoUrl: { not: null } },
      select: { fotoUrl: true },
    });
    if (jug?.fotoUrl) {
      this.cache.set(k, jug.fotoUrl);
      return jug.fotoUrl;
    }

    const url = await this.lookup(nombre);
    this.cache.set(k, url);
    return url;
  }

  /** Rellena la caché (throttled) en segundo plano; no satura la API. */
  async prefetch(nombres: string[]): Promise<void> {
    for (const n of nombres) {
      if (this.cache.has(this.norm(n))) continue;
      await this.fotoPorNombre(n);
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  /**
   * Descarga fotos a jugadores.foto_url. Prioriza los jugadores elegidos en
   * predicciones (balón/bota/guante), luego el resto hasta `limit`.
   */
  async sincronizarFotos(limit = 30) {
    const refs = await this.prisma.prediccionEspecial.findMany({
      select: { balonOroId: true, botaOroId: true, guanteOroId: true },
    });
    const ids = [
      ...new Set(
        refs
          .flatMap((r) => [r.balonOroId, r.botaOroId, r.guanteOroId])
          .filter((x): x is number => x != null),
      ),
    ];

    const referenciados = await this.prisma.jugador.findMany({
      where: { id: { in: ids }, fotoUrl: null },
    });
    const resto = await this.prisma.jugador.findMany({
      where: { fotoUrl: null, id: { notIn: ids } },
      take: Math.max(0, limit - referenciados.length),
    });
    const objetivo = [...referenciados, ...resto];

    let actualizados = 0;
    for (const j of objetivo) {
      const url = await this.fotoPorNombre(j.nombre);
      if (url) {
        await this.prisma.jugador.update({
          where: { id: j.id },
          data: { fotoUrl: url },
        });
        actualizados++;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    const restantes = await this.prisma.jugador.count({ where: { fotoUrl: null } });
    this.logger.log(`Fotos: ${actualizados}/${objetivo.length} actualizadas, ${restantes} sin foto.`);
    return { procesados: objetivo.length, actualizados, restantes };
  }
}
