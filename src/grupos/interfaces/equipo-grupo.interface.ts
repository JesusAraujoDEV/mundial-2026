export interface EquipoGrupo {
  paisId: number;
  nombre: string;
  banderaUrl: string | null;
  grupo: string;
  puntos: number;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesAFavor: number;
  golesEnContra: number;
  diferenciaGoles: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  fairPlayPuntos: number;
}
