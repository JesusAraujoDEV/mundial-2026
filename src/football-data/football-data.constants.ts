/**
 * Mapeo de equipos de football-data.org (FIFA World Cup, competition WC/2000)
 * a los nombres de país en nuestra DB (paises.nombre).
 * Clave = team.id de football-data; valor = nombre exacto en nuestra DB.
 */
export const FD_TEAM_TO_PAIS: Record<number, string> = {
  758: 'Uruguay',
  759: 'Alemania',
  760: 'España',
  761: 'Paraguay',
  762: 'Argentina',
  763: 'Ghana',
  764: 'Brasil',
  765: 'Portugal',
  766: 'Japón',
  769: 'México',
  770: 'Inglaterra',
  771: 'Estados Unidos',
  772: 'Corea del Sur',
  773: 'Francia',
  774: 'Sudáfrica',
  778: 'Argelia',
  779: 'Australia',
  783: 'Nueva Zelanda',
  788: 'Suiza',
  791: 'Ecuador',
  792: 'Suecia',
  798: 'Chequia',
  799: 'Croacia',
  801: 'Arabia Saudita',
  802: 'Túnez',
  803: 'Turquía',
  804: 'Senegal',
  805: 'Bélgica',
  815: 'Marruecos',
  816: 'Austria',
  818: 'Colombia',
  825: 'Egipto',
  828: 'Canadá',
  836: 'Haití',
  840: 'Irán',
  1060: 'Bosnia-Herzegovina',
  1836: 'Panamá',
  1930: 'Cabo Verde',
  1934: 'República Democrática del Congo',
  1935: 'Costa de Marfil',
  8030: 'Catar',
  8049: 'Jordania',
  8062: 'Irak',
  8070: 'Uzbekistán',
  8601: 'Países Bajos',
  8872: 'Noruega',
  8873: 'Escocia',
  9460: 'Curazao',
};

export const FD_BASE = 'https://api.football-data.org/v4';
export const WC_COMPETITION = 'WC';

/** Mapea el status de football-data a nuestro estado de partido. */
export function mapEstado(
  status: string,
): 'programado' | 'en_vivo' | 'descanso' | 'finalizado' {
  switch (status) {
    case 'IN_PLAY':
      return 'en_vivo';
    case 'PAUSED':
      return 'descanso'; // medio tiempo / cooling break
    case 'FINISHED':
    case 'AWARDED':
      return 'finalizado';
    default:
      return 'programado'; // SCHEDULED, TIMED, POSTPONED, SUSPENDED, CANCELLED
  }
}
