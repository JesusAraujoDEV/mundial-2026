import { Injectable, Logger } from '@nestjs/common';

/**
 * Cliente mínimo de la Evolution API (envío de texto a un grupo / número).
 * Toda la config viene de variables de entorno:
 *   EVOLUTION_API_BASE_URL, EVOLUTION_INSTANCE, EVOLUTION_API_KEY, EVOLUTION_GROUP_ID
 * Si falta config, los envíos se omiten silenciosamente (no rompe el flujo).
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private get baseUrl(): string {
    return (process.env.EVOLUTION_API_BASE_URL ?? '').replace(/\/+$/, '');
  }
  private get instance(): string {
    return process.env.EVOLUTION_INSTANCE ?? '';
  }
  private get apiKey(): string {
    return process.env.EVOLUTION_API_KEY ?? '';
  }
  private get groupId(): string {
    return process.env.EVOLUTION_GROUP_ID ?? '';
  }

  /** ¿Hay config suficiente para enviar? */
  get habilitado(): boolean {
    return !!(this.baseUrl && this.instance && this.apiKey && this.groupId);
  }

  /**
   * Envía un texto al grupo configurado (o a `destino` si se pasa).
   * Nunca lanza: errores de red/API se registran como warning.
   */
  async enviarAlGrupo(texto: string, destino?: string): Promise<void> {
    const number = destino ?? this.groupId;
    if (!this.baseUrl || !this.instance || !this.apiKey || !number) {
      this.logger.warn('Evolution API sin configurar: mensaje omitido.');
      return;
    }

    const url = `${this.baseUrl}/message/sendText/${this.instance}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number,
          text: texto,
          options: { delay: 1200, presence: 'composing', linkPreview: false },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`Evolution API respondió ${res.status}: ${body}`);
      }
    } catch (e) {
      this.logger.warn(
        `Error enviando mensaje WhatsApp: ${(e as Error).message}`,
      );
    }
  }
}
