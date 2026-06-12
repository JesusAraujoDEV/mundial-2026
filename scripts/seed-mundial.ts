/**
 * SEED - Mundial 2026
 * Pobla la base de datos con los 12 grupos, 48 selecciones y los 104 partidos del fixture.
 *
 * USO:
 *   npx ts-node scripts/seed-mundial.ts
 *
 * REQUISITOS:
 *   - La BD debe estar sincronizada (npx prisma db push --schema=prisma/schema.prisma)
 *   - Las variables de entorno (.env) deben estar configuradas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// DATOS: 12 GRUPOS CON SUS 4 SELECCIONES
// ═══════════════════════════════════════════════════════════════

const GRUPOS: Record<string, string[]> = {
  A: ['México', 'Sudáfrica', 'República de Corea', 'República Checa'],
  B: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'RI de Irán', 'Nueva Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudí', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

// ═══════════════════════════════════════════════════════════════
// DATOS: FIXTURE COMPLETO (104 PARTIDOS)
// Horarios en Eastern Time (ET), año 2026
// ═══════════════════════════════════════════════════════════════

interface PartidoSeed {
  local: string;
  visitante: string;
  fase: string;
  grupo: string | null;
  fecha: string; // ISO string
  golesLocal: number | null;
  golesVisitante: number | null;
}

const PARTIDOS: PartidoSeed[] = [
  // ─── JORNADA 1 ─────────────────────────────────────────────
  // Jueves 11 junio
  { local: 'México', visitante: 'Sudáfrica', fase: 'grupos', grupo: 'A', fecha: '2026-06-11T15:00:00-04:00', golesLocal: 2, golesVisitante: 0 },
  { local: 'República de Corea', visitante: 'República Checa', fase: 'grupos', grupo: 'A', fecha: '2026-06-11T22:00:00-04:00', golesLocal: 2, golesVisitante: 1 },
  // Viernes 12 junio
  { local: 'Canadá', visitante: 'Bosnia y Herzegovina', fase: 'grupos', grupo: 'B', fecha: '2026-06-12T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Estados Unidos', visitante: 'Paraguay', fase: 'grupos', grupo: 'D', fecha: '2026-06-12T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Sábado 13 junio
  { local: 'Catar', visitante: 'Suiza', fase: 'grupos', grupo: 'B', fecha: '2026-06-13T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Brasil', visitante: 'Marruecos', fase: 'grupos', grupo: 'C', fecha: '2026-06-13T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Haití', visitante: 'Escocia', fase: 'grupos', grupo: 'C', fecha: '2026-06-13T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Australia', visitante: 'Turquía', fase: 'grupos', grupo: 'D', fecha: '2026-06-14T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Domingo 14 junio
  { local: 'Alemania', visitante: 'Curazao', fase: 'grupos', grupo: 'E', fecha: '2026-06-14T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Países Bajos', visitante: 'Japón', fase: 'grupos', grupo: 'F', fecha: '2026-06-14T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Costa de Marfil', visitante: 'Ecuador', fase: 'grupos', grupo: 'E', fecha: '2026-06-14T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Suecia', visitante: 'Túnez', fase: 'grupos', grupo: 'F', fecha: '2026-06-14T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Lunes 15 junio
  { local: 'España', visitante: 'Cabo Verde', fase: 'grupos', grupo: 'H', fecha: '2026-06-15T12:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Bélgica', visitante: 'Egipto', fase: 'grupos', grupo: 'G', fecha: '2026-06-15T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Arabia Saudí', visitante: 'Uruguay', fase: 'grupos', grupo: 'H', fecha: '2026-06-15T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'RI de Irán', visitante: 'Nueva Zelanda', fase: 'grupos', grupo: 'G', fecha: '2026-06-15T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Martes 16 junio
  { local: 'Francia', visitante: 'Senegal', fase: 'grupos', grupo: 'I', fecha: '2026-06-16T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Irak', visitante: 'Noruega', fase: 'grupos', grupo: 'I', fecha: '2026-06-16T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Argentina', visitante: 'Argelia', fase: 'grupos', grupo: 'J', fecha: '2026-06-16T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Austria', visitante: 'Jordania', fase: 'grupos', grupo: 'J', fecha: '2026-06-17T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Miércoles 17 junio
  { local: 'Portugal', visitante: 'RD Congo', fase: 'grupos', grupo: 'K', fecha: '2026-06-17T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Inglaterra', visitante: 'Croacia', fase: 'grupos', grupo: 'L', fecha: '2026-06-17T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Ghana', visitante: 'Panamá', fase: 'grupos', grupo: 'L', fecha: '2026-06-17T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Uzbekistán', visitante: 'Colombia', fase: 'grupos', grupo: 'K', fecha: '2026-06-17T22:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── JORNADA 2 ─────────────────────────────────────────────
  // Jueves 18 junio
  { local: 'República Checa', visitante: 'Sudáfrica', fase: 'grupos', grupo: 'A', fecha: '2026-06-18T12:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Suiza', visitante: 'Bosnia y Herzegovina', fase: 'grupos', grupo: 'B', fecha: '2026-06-18T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Canadá', visitante: 'Catar', fase: 'grupos', grupo: 'B', fecha: '2026-06-18T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'México', visitante: 'República de Corea', fase: 'grupos', grupo: 'A', fecha: '2026-06-18T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Viernes 19 junio
  { local: 'Estados Unidos', visitante: 'Australia', fase: 'grupos', grupo: 'D', fecha: '2026-06-19T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Escocia', visitante: 'Marruecos', fase: 'grupos', grupo: 'C', fecha: '2026-06-19T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Brasil', visitante: 'Haití', fase: 'grupos', grupo: 'C', fecha: '2026-06-19T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Turquía', visitante: 'Paraguay', fase: 'grupos', grupo: 'D', fecha: '2026-06-20T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Sábado 20 junio
  { local: 'Países Bajos', visitante: 'Suecia', fase: 'grupos', grupo: 'F', fecha: '2026-06-20T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Alemania', visitante: 'Costa de Marfil', fase: 'grupos', grupo: 'E', fecha: '2026-06-20T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Ecuador', visitante: 'Curazao', fase: 'grupos', grupo: 'E', fecha: '2026-06-20T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Túnez', visitante: 'Japón', fase: 'grupos', grupo: 'F', fecha: '2026-06-21T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Domingo 21 junio
  { local: 'España', visitante: 'Arabia Saudí', fase: 'grupos', grupo: 'H', fecha: '2026-06-21T12:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Bélgica', visitante: 'RI de Irán', fase: 'grupos', grupo: 'G', fecha: '2026-06-21T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Uruguay', visitante: 'Cabo Verde', fase: 'grupos', grupo: 'H', fecha: '2026-06-21T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Nueva Zelanda', visitante: 'Egipto', fase: 'grupos', grupo: 'G', fecha: '2026-06-21T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Lunes 22 junio
  { local: 'Argentina', visitante: 'Austria', fase: 'grupos', grupo: 'J', fecha: '2026-06-22T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Francia', visitante: 'Irak', fase: 'grupos', grupo: 'I', fecha: '2026-06-22T17:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Noruega', visitante: 'Senegal', fase: 'grupos', grupo: 'I', fecha: '2026-06-22T20:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Jordania', visitante: 'Argelia', fase: 'grupos', grupo: 'J', fecha: '2026-06-22T23:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Martes 23 junio
  { local: 'Portugal', visitante: 'Uzbekistán', fase: 'grupos', grupo: 'K', fecha: '2026-06-23T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Inglaterra', visitante: 'Ghana', fase: 'grupos', grupo: 'L', fecha: '2026-06-23T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Panamá', visitante: 'Croacia', fase: 'grupos', grupo: 'L', fecha: '2026-06-23T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Colombia', visitante: 'RD Congo', fase: 'grupos', grupo: 'K', fecha: '2026-06-23T22:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── JORNADA 3 ─────────────────────────────────────────────
  // Miércoles 24 junio
  { local: 'Suiza', visitante: 'Canadá', fase: 'grupos', grupo: 'B', fecha: '2026-06-24T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Bosnia y Herzegovina', visitante: 'Catar', fase: 'grupos', grupo: 'B', fecha: '2026-06-24T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Escocia', visitante: 'Brasil', fase: 'grupos', grupo: 'C', fecha: '2026-06-24T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Marruecos', visitante: 'Haití', fase: 'grupos', grupo: 'C', fecha: '2026-06-24T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'República Checa', visitante: 'México', fase: 'grupos', grupo: 'A', fecha: '2026-06-24T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Sudáfrica', visitante: 'República de Corea', fase: 'grupos', grupo: 'A', fecha: '2026-06-24T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Jueves 25 junio
  { local: 'Curazao', visitante: 'Costa de Marfil', fase: 'grupos', grupo: 'E', fecha: '2026-06-25T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Ecuador', visitante: 'Alemania', fase: 'grupos', grupo: 'E', fecha: '2026-06-25T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Japón', visitante: 'Suecia', fase: 'grupos', grupo: 'F', fecha: '2026-06-25T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Túnez', visitante: 'Países Bajos', fase: 'grupos', grupo: 'F', fecha: '2026-06-25T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Turquía', visitante: 'Estados Unidos', fase: 'grupos', grupo: 'D', fecha: '2026-06-25T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Paraguay', visitante: 'Australia', fase: 'grupos', grupo: 'D', fecha: '2026-06-25T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Viernes 26 junio
  { local: 'Noruega', visitante: 'Francia', fase: 'grupos', grupo: 'I', fecha: '2026-06-26T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Senegal', visitante: 'Irak', fase: 'grupos', grupo: 'I', fecha: '2026-06-26T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Cabo Verde', visitante: 'Arabia Saudí', fase: 'grupos', grupo: 'H', fecha: '2026-06-26T20:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Uruguay', visitante: 'España', fase: 'grupos', grupo: 'H', fecha: '2026-06-26T20:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Egipto', visitante: 'RI de Irán', fase: 'grupos', grupo: 'G', fecha: '2026-06-26T23:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Nueva Zelanda', visitante: 'Bélgica', fase: 'grupos', grupo: 'G', fecha: '2026-06-26T23:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Sábado 27 junio
  { local: 'Panamá', visitante: 'Inglaterra', fase: 'grupos', grupo: 'L', fecha: '2026-06-27T17:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Croacia', visitante: 'Ghana', fase: 'grupos', grupo: 'L', fecha: '2026-06-27T17:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Colombia', visitante: 'Portugal', fase: 'grupos', grupo: 'K', fecha: '2026-06-27T19:30:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'RD Congo', visitante: 'Uzbekistán', fase: 'grupos', grupo: 'K', fecha: '2026-06-27T19:30:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Argelia', visitante: 'Austria', fase: 'grupos', grupo: 'J', fecha: '2026-06-27T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Jordania', visitante: 'Argentina', fase: 'grupos', grupo: 'J', fecha: '2026-06-27T22:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── DIECISEISAVOS DE FINAL ────────────────────────────────
  // Partido 73
  { local: '2ºA', visitante: '2ºB', fase: '16avos', grupo: null, fecha: '2026-06-28T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 74
  { local: '1ºE', visitante: '3ºA/B/C/D/F', fase: '16avos', grupo: null, fecha: '2026-06-29T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 75
  { local: '1ºF', visitante: '2ºC', fase: '16avos', grupo: null, fecha: '2026-06-29T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 76
  { local: '1ºC', visitante: '2ºF', fase: '16avos', grupo: null, fecha: '2026-06-29T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 77
  { local: '1ºI', visitante: '3ºC/D/F/G/H', fase: '16avos', grupo: null, fecha: '2026-06-30T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 78
  { local: '2ºE', visitante: '2ºI', fase: '16avos', grupo: null, fecha: '2026-06-30T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 79
  { local: '1ºA', visitante: '3ºC/E/F/H/I', fase: '16avos', grupo: null, fecha: '2026-06-30T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 80
  { local: '1ºL', visitante: '3ºE/H/I/J/K', fase: '16avos', grupo: null, fecha: '2026-07-01T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 81
  { local: '1ºD', visitante: '3ºB/E/F/I/J', fase: '16avos', grupo: null, fecha: '2026-07-01T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 82
  { local: '1ºG', visitante: '3ºA/E/H/I/J', fase: '16avos', grupo: null, fecha: '2026-07-01T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 83
  { local: '2ºK', visitante: '2ºL', fase: '16avos', grupo: null, fecha: '2026-07-02T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 84
  { local: '1ºH', visitante: '2ºJ', fase: '16avos', grupo: null, fecha: '2026-07-02T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 85
  { local: '1ºB', visitante: '3ºE/F/G/I/J', fase: '16avos', grupo: null, fecha: '2026-07-02T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 86
  { local: '1ºJ', visitante: '2ºH', fase: '16avos', grupo: null, fecha: '2026-07-03T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 87
  { local: '1ºK', visitante: '3ºD/E/I/J/L', fase: '16avos', grupo: null, fecha: '2026-07-03T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 88
  { local: '2ºD', visitante: '2ºG', fase: '16avos', grupo: null, fecha: '2026-07-03T21:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── OCTAVOS DE FINAL ──────────────────────────────────────
  // Partido 89
  { local: 'G.P74', visitante: 'G.P77', fase: 'octavos', grupo: null, fecha: '2026-07-04T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 90
  { local: 'G.P73', visitante: 'G.P75', fase: 'octavos', grupo: null, fecha: '2026-07-04T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 91
  { local: 'G.P76', visitante: 'G.P78', fase: 'octavos', grupo: null, fecha: '2026-07-05T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 92
  { local: 'G.P79', visitante: 'G.P80', fase: 'octavos', grupo: null, fecha: '2026-07-05T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 93
  { local: 'G.P83', visitante: 'G.P84', fase: 'octavos', grupo: null, fecha: '2026-07-06T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 94
  { local: 'G.P81', visitante: 'G.P82', fase: 'octavos', grupo: null, fecha: '2026-07-06T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 95
  { local: 'G.P86', visitante: 'G.P88', fase: 'octavos', grupo: null, fecha: '2026-07-07T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 96
  { local: 'G.P85', visitante: 'G.P87', fase: 'octavos', grupo: null, fecha: '2026-07-07T19:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── CUARTOS DE FINAL ──────────────────────────────────────
  // Partido 97
  { local: 'G.P89', visitante: 'G.P90', fase: 'cuartos', grupo: null, fecha: '2026-07-09T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 98
  { local: 'G.P93', visitante: 'G.P94', fase: 'cuartos', grupo: null, fecha: '2026-07-10T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 99
  { local: 'G.P91', visitante: 'G.P92', fase: 'cuartos', grupo: null, fecha: '2026-07-11T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 100
  { local: 'G.P95', visitante: 'G.P96', fase: 'cuartos', grupo: null, fecha: '2026-07-11T19:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── SEMIFINALES ───────────────────────────────────────────
  // Partido 101
  { local: 'G.P97', visitante: 'G.P98', fase: 'semifinal', grupo: null, fecha: '2026-07-14T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  // Partido 102
  { local: 'G.P99', visitante: 'G.P100', fase: 'semifinal', grupo: null, fecha: '2026-07-15T18:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── TERCER PUESTO ─────────────────────────────────────────
  // Partido 103
  { local: 'P.P101', visitante: 'P.P102', fase: 'tercer_lugar', grupo: null, fecha: '2026-07-18T18:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── FINAL ─────────────────────────────────────────────────
  // Partido 104
  { local: 'G.P101', visitante: 'G.P102', fase: 'final', grupo: null, fecha: '2026-07-19T18:00:00-04:00', golesLocal: null, golesVisitante: null },
];

// ═══════════════════════════════════════════════════════════════
// EJECUCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🏆 SEED Mundial 2026 - Iniciando...\n');

  // ─── 1. Crear/actualizar las 48 selecciones ────────────────
  console.log('📌 Paso 1: Creando las 48 selecciones...');
  const paisesUnicos = new Set<string>();
  for (const equipos of Object.values(GRUPOS)) {
    for (const equipo of equipos) {
      paisesUnicos.add(equipo);
    }
  }

  const paisesMap = new Map<string, number>();

  for (const nombre of paisesUnicos) {
    const pais = await prisma.pais.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    paisesMap.set(nombre, pais.id);
  }
  console.log(`   ✅ ${paisesMap.size} selecciones registradas.\n`);

  // ─── 2. Crear los grupos ───────────────────────────────────
  console.log('📌 Paso 2: Creando los 12 grupos con sus equipos...');

  // Limpiar grupos existentes
  await prisma.grupo.deleteMany({});

  let gruposCreados = 0;
  for (const [grupo, equipos] of Object.entries(GRUPOS)) {
    for (const equipo of equipos) {
      const paisId = paisesMap.get(equipo);
      if (!paisId) {
        console.warn(`   ⚠️  País no encontrado: ${equipo}`);
        continue;
      }
      await prisma.grupo.create({
        data: {
          nombre: grupo,
          paisId,
          puntos: 0,
          partidosJugados: 0,
          ganados: 0,
          empatados: 0,
          perdidos: 0,
          golesAFavor: 0,
          golesEnContra: 0,
          diferenciaGoles: 0,
          tarjetasAmarillas: 0,
          tarjetasRojas: 0,
          fairPlayPuntos: 0,
        },
      });
      gruposCreados++;
    }
  }
  console.log(`   ✅ ${gruposCreados} registros de grupo creados (12 grupos × 4 equipos).\n`);

  // ─── 3. Crear los partidos de fase de grupos ───────────────
  console.log('📌 Paso 3: Creando los 104 partidos del fixture...');

  // Limpiar partidos existentes (y sus pronósticos en cascada)
  await prisma.pronosticoPartido.deleteMany({});
  await prisma.golPartido.deleteMany({});
  await prisma.tarjetaPartido.deleteMany({});
  await prisma.partido.deleteMany({});

  let partidosCreados = 0;
  let partidosGrupos = 0;
  let partidosEliminatorias = 0;

  for (const partido of PARTIDOS) {
    const localId = paisesMap.get(partido.local);
    const visitanteId = paisesMap.get(partido.visitante);

    if (localId && visitanteId) {
      // Partido de fase de grupos con equipos reales
      await prisma.partido.create({
        data: {
          localId,
          visitanteId,
          fase: partido.fase,
          grupo: partido.grupo,
          fecha: new Date(partido.fecha),
          golesLocal: partido.golesLocal,
          golesVisitante: partido.golesVisitante,
          bloqueado: partido.golesLocal !== null, // Bloqueado si ya se jugó
          actualizadoPorAdmin: partido.golesLocal !== null,
        },
      });
      partidosGrupos++;
    } else {
      // Partido eliminatorio (placeholder - usa el primer país como placeholder)
      const placeholderLocal = paisesMap.values().next().value!;
      const placeholderVisitante = Array.from(paisesMap.values())[1];

      await prisma.partido.create({
        data: {
          localId: placeholderLocal,
          visitanteId: placeholderVisitante,
          fase: partido.fase,
          grupo: partido.grupo,
          fecha: new Date(partido.fecha),
          golesLocal: null,
          golesVisitante: null,
          bloqueado: false,
          actualizadoPorAdmin: false,
        },
      });
      partidosEliminatorias++;
    }
    partidosCreados++;
  }

  console.log(`   ✅ ${partidosCreados} partidos creados:`);
  console.log(`      • Fase de grupos: ${partidosGrupos}`);
  console.log(`      • Eliminatorias (placeholder): ${partidosEliminatorias}\n`);

  // ─── 4. Actualizar stats del Grupo A (partidos ya jugados) ─
  console.log('📌 Paso 4: Actualizando estadísticas del Grupo A (partidos jugados)...');

  // México ganó 2-0 a Sudáfrica
  await actualizarEstadisticasGrupo('A', 'México', { gf: 2, gc: 0, resultado: 'G' });
  await actualizarEstadisticasGrupo('A', 'Sudáfrica', { gf: 0, gc: 2, resultado: 'P' });

  // República de Corea ganó 2-1 a República Checa
  await actualizarEstadisticasGrupo('A', 'República de Corea', { gf: 2, gc: 1, resultado: 'G' });
  await actualizarEstadisticasGrupo('A', 'República Checa', { gf: 1, gc: 2, resultado: 'P' });

  console.log('   ✅ Estadísticas del Grupo A actualizadas.\n');

  // ─── Resumen final ─────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏆 SEED COMPLETADO');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   🌍 Selecciones: ${paisesMap.size}`);
  console.log(`   📊 Grupos: 12 (A-L)`);
  console.log(`   ⚽ Partidos: ${partidosCreados}`);
  console.log(`   📅 Inicio: 11 de junio 2026`);
  console.log(`   🏟️  Final: 19 de julio 2026`);
  console.log('═══════════════════════════════════════════════════════\n');
}

async function actualizarEstadisticasGrupo(
  grupo: string,
  pais: string,
  stats: { gf: number; gc: number; resultado: 'G' | 'E' | 'P' },
) {
  const paisRecord = await prisma.pais.findUnique({ where: { nombre: pais } });
  if (!paisRecord) return;

  const puntos = stats.resultado === 'G' ? 3 : stats.resultado === 'E' ? 1 : 0;

  await prisma.grupo.updateMany({
    where: { nombre: grupo, paisId: paisRecord.id },
    data: {
      partidosJugados: { increment: 1 },
      ganados: { increment: stats.resultado === 'G' ? 1 : 0 },
      empatados: { increment: stats.resultado === 'E' ? 1 : 0 },
      perdidos: { increment: stats.resultado === 'P' ? 1 : 0 },
      golesAFavor: { increment: stats.gf },
      golesEnContra: { increment: stats.gc },
      diferenciaGoles: { increment: stats.gf - stats.gc },
      puntos: { increment: puntos },
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
