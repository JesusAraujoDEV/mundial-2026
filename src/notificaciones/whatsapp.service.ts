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
  /** Cola para enviar UN mensaje a la vez (evita que Evolution mezcle/falle envíos simultáneos). */
  private cola: Promise<void> = Promise.resolve();

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
    // Encolar: cada mensaje espera a que termine el anterior (orden + sin choques).
    this.cola = this.cola
      .catch(() => undefined)
      .then(() => this.enviar(number, texto));
    return this.cola;
  }

  private async enviar(number: string, texto: string): Promise<void> {
    const url = `${this.baseUrl}/message/sendText/${this.instance}`;
    // Payload plano compatible con Evolution API v1 y v2.
    const payload = { number, text: texto, delay: 800, linkPreview: false };
    for (let intento = 1; intento <= 2; intento++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
          body: JSON.stringify(payload),
        });
        if (res.ok) return;
        const body = await res.text().catch(() => '');
        this.logger.warn(
          `Evolution API respondió ${res.status} (intento ${intento}): ${body.slice(0, 200)}`,
        );
      } catch (e) {
        this.logger.warn(
          `Error enviando WhatsApp (intento ${intento}): ${(e as Error).message}`,
        );
      }
      if (intento < 2) await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
