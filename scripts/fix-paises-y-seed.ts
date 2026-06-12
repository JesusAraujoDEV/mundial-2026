/**
 * FIX: Eliminar países duplicados y poblar grupos + partidos
 * usando los IDs existentes en la BD.
 *
 * USO:
 *   npx ts-node scripts/fix-paises-y-seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// MAPEO: Nombre en fixture FIFA → ID real en tu BD
// ═══════════════════════════════════════════════════════════════

const PAIS_ID: Record<string, number> = {
  'México': 46,
  'Sudáfrica': 39,
  'Corea del Sur': 36,
  'Chequia': 11,
  'Canadá': 47,
  'Bosnia-Herzegovina': 8,
  'Estados Unidos': 48,
  'Paraguay': 33,
  'Catar': 10,
  'Suiza': 41,
  'Brasil': 9,
  'Marruecos': 28,
  'Haití': 22,
  'Escocia': 18,
  'Australia': 5,
  'Turquía': 43,
  'Alemania': 1,
  'Curazao': 15,
  'Países Bajos': 31,
  'Japón': 26,
  'Costa de Marfil': 13,
  'Ecuador': 16,
  'Suecia': 40,
  'Túnez': 42,
  'España': 19,
  'Cabo Verde': 25,
  'Bélgica': 7,
  'Egipto': 17,
  'Arabia Saudita': 2,
  'Irán': 37,
  'Nueva Zelanda': 30,
  'Uruguay': 44,
  'Francia': 20,
  'Senegal': 38,
  'Irak': 24,
  'Noruega': 29,
  'Argentina': 4,
  'Argelia': 3,
  'Austria': 6,
  'Jordania': 27,
  'Portugal': 34,
  'RD Congo': 35,
  'Inglaterra': 23,
  'Croacia': 14,
  'Ghana': 21,
  'Panamá': 32,
  'Uzbekistán': 45,
  'Colombia': 12,
};

// ═══════════════════════════════════════════════════════════════
// GRUPOS: 12 grupos con IDs reales
// ═══════════════════════════════════════════════════════════════

const GRUPOS: Record<string, string[]> = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'Chequia'],
  B: ['Canadá', 'Bosnia-Herzegovina', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

// ═══════════════════════════════════════════════════════════════
// FIXTURE: 104 partidos
// ═══════════════════════════════════════════════════════════════

interface PartidoData {
  local: string;
  visitante: string;
  fase: string;
  grupo: string | null;
  fecha: string;
  golesLocal: number | null;
  golesVisitante: number | null;
}

const PARTIDOS_GRUPOS: PartidoData[] = [
  // ─── JORNADA 1 ─────────────────────────────────────────────
  { local: 'México', visitante: 'Sudáfrica', fase: 'grupos', grupo: 'A', fecha: '2026-06-11T15:00:00-04:00', golesLocal: 2, golesVisitante: 0 },
  { local: 'Corea del Sur', visitante: 'Chequia', fase: 'grupos', grupo: 'A', fecha: '2026-06-11T22:00:00-04:00', golesLocal: 2, golesVisitante: 1 },
  { local: 'Canadá', visitante: 'Bosnia-Herzegovina', fase: 'grupos', grupo: 'B', fecha: '2026-06-12T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Estados Unidos', visitante: 'Paraguay', fase: 'grupos', grupo: 'D', fecha: '2026-06-12T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Catar', visitante: 'Suiza', fase: 'grupos', grupo: 'B', fecha: '2026-06-13T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Brasil', visitante: 'Marruecos', fase: 'grupos', grupo: 'C', fecha: '2026-06-13T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Haití', visitante: 'Escocia', fase: 'grupos', grupo: 'C', fecha: '2026-06-13T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Australia', visitante: 'Turquía', fase: 'grupos', grupo: 'D', fecha: '2026-06-14T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Alemania', visitante: 'Curazao', fase: 'grupos', grupo: 'E', fecha: '2026-06-14T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Países Bajos', visitante: 'Japón', fase: 'grupos', grupo: 'F', fecha: '2026-06-14T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Costa de Marfil', visitante: 'Ecuador', fase: 'grupos', grupo: 'E', fecha: '2026-06-14T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Suecia', visitante: 'Túnez', fase: 'grupos', grupo: 'F', fecha: '2026-06-14T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'España', visitante: 'Cabo Verde', fase: 'grupos', grupo: 'H', fecha: '2026-06-15T12:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Bélgica', visitante: 'Egipto', fase: 'grupos', grupo: 'G', fecha: '2026-06-15T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Arabia Saudita', visitante: 'Uruguay', fase: 'grupos', grupo: 'H', fecha: '2026-06-15T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Irán', visitante: 'Nueva Zelanda', fase: 'grupos', grupo: 'G', fecha: '2026-06-15T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Francia', visitante: 'Senegal', fase: 'grupos', grupo: 'I', fecha: '2026-06-16T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Irak', visitante: 'Noruega', fase: 'grupos', grupo: 'I', fecha: '2026-06-16T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Argentina', visitante: 'Argelia', fase: 'grupos', grupo: 'J', fecha: '2026-06-16T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Austria', visitante: 'Jordania', fase: 'grupos', grupo: 'J', fecha: '2026-06-17T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Portugal', visitante: 'RD Congo', fase: 'grupos', grupo: 'K', fecha: '2026-06-17T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Inglaterra', visitante: 'Croacia', fase: 'grupos', grupo: 'L', fecha: '2026-06-17T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Ghana', visitante: 'Panamá', fase: 'grupos', grupo: 'L', fecha: '2026-06-17T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Uzbekistán', visitante: 'Colombia', fase: 'grupos', grupo: 'K', fecha: '2026-06-17T22:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── JORNADA 2 ─────────────────────────────────────────────
  { local: 'Chequia', visitante: 'Sudáfrica', fase: 'grupos', grupo: 'A', fecha: '2026-06-18T12:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Suiza', visitante: 'Bosnia-Herzegovina', fase: 'grupos', grupo: 'B', fecha: '2026-06-18T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Canadá', visitante: 'Catar', fase: 'grupos', grupo: 'B', fecha: '2026-06-18T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'México', visitante: 'Corea del Sur', fase: 'grupos', grupo: 'A', fecha: '2026-06-18T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Estados Unidos', visitante: 'Australia', fase: 'grupos', grupo: 'D', fecha: '2026-06-19T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Escocia', visitante: 'Marruecos', fase: 'grupos', grupo: 'C', fecha: '2026-06-19T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Brasil', visitante: 'Haití', fase: 'grupos', grupo: 'C', fecha: '2026-06-19T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Turquía', visitante: 'Paraguay', fase: 'grupos', grupo: 'D', fecha: '2026-06-20T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Países Bajos', visitante: 'Suecia', fase: 'grupos', grupo: 'F', fecha: '2026-06-20T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Alemania', visitante: 'Costa de Marfil', fase: 'grupos', grupo: 'E', fecha: '2026-06-20T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Ecuador', visitante: 'Curazao', fase: 'grupos', grupo: 'E', fecha: '2026-06-20T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Túnez', visitante: 'Japón', fase: 'grupos', grupo: 'F', fecha: '2026-06-21T00:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'España', visitante: 'Arabia Saudita', fase: 'grupos', grupo: 'H', fecha: '2026-06-21T12:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Bélgica', visitante: 'Irán', fase: 'grupos', grupo: 'G', fecha: '2026-06-21T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Uruguay', visitante: 'Cabo Verde', fase: 'grupos', grupo: 'H', fecha: '2026-06-21T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Nueva Zelanda', visitante: 'Egipto', fase: 'grupos', grupo: 'G', fecha: '2026-06-21T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Argentina', visitante: 'Austria', fase: 'grupos', grupo: 'J', fecha: '2026-06-22T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Francia', visitante: 'Irak', fase: 'grupos', grupo: 'I', fecha: '2026-06-22T17:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Noruega', visitante: 'Senegal', fase: 'grupos', grupo: 'I', fecha: '2026-06-22T20:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Jordania', visitante: 'Argelia', fase: 'grupos', grupo: 'J', fecha: '2026-06-22T23:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Portugal', visitante: 'Uzbekistán', fase: 'grupos', grupo: 'K', fecha: '2026-06-23T13:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Inglaterra', visitante: 'Ghana', fase: 'grupos', grupo: 'L', fecha: '2026-06-23T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Panamá', visitante: 'Croacia', fase: 'grupos', grupo: 'L', fecha: '2026-06-23T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Colombia', visitante: 'RD Congo', fase: 'grupos', grupo: 'K', fecha: '2026-06-23T22:00:00-04:00', golesLocal: null, golesVisitante: null },

  // ─── JORNADA 3 ─────────────────────────────────────────────
  { local: 'Suiza', visitante: 'Canadá', fase: 'grupos', grupo: 'B', fecha: '2026-06-24T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Bosnia-Herzegovina', visitante: 'Catar', fase: 'grupos', grupo: 'B', fecha: '2026-06-24T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Escocia', visitante: 'Brasil', fase: 'grupos', grupo: 'C', fecha: '2026-06-24T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Marruecos', visitante: 'Haití', fase: 'grupos', grupo: 'C', fecha: '2026-06-24T18:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Chequia', visitante: 'México', fase: 'grupos', grupo: 'A', fecha: '2026-06-24T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Sudáfrica', visitante: 'Corea del Sur', fase: 'grupos', grupo: 'A', fecha: '2026-06-24T21:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Curazao', visitante: 'Costa de Marfil', fase: 'grupos', grupo: 'E', fecha: '2026-06-25T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Ecuador', visitante: 'Alemania', fase: 'grupos', grupo: 'E', fecha: '2026-06-25T16:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Japón', visitante: 'Suecia', fase: 'grupos', grupo: 'F', fecha: '2026-06-25T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Túnez', visitante: 'Países Bajos', fase: 'grupos', grupo: 'F', fecha: '2026-06-25T19:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Turquía', visitante: 'Estados Unidos', fase: 'grupos', grupo: 'D', fecha: '2026-06-25T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Paraguay', visitante: 'Australia', fase: 'grupos', grupo: 'D', fecha: '2026-06-25T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Noruega', visitante: 'Francia', fase: 'grupos', grupo: 'I', fecha: '2026-06-26T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Senegal', visitante: 'Irak', fase: 'grupos', grupo: 'I', fecha: '2026-06-26T15:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Cabo Verde', visitante: 'Arabia Saudita', fase: 'grupos', grupo: 'H', fecha: '2026-06-26T20:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Uruguay', visitante: 'España', fase: 'grupos', grupo: 'H', fecha: '2026-06-26T20:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Egipto', visitante: 'Irán', fase: 'grupos', grupo: 'G', fecha: '2026-06-26T23:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Nueva Zelanda', visitante: 'Bélgica', fase: 'grupos', grupo: 'G', fecha: '2026-06-26T23:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Panamá', visitante: 'Inglaterra', fase: 'grupos', grupo: 'L', fecha: '2026-06-27T17:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Croacia', visitante: 'Ghana', fase: 'grupos', grupo: 'L', fecha: '2026-06-27T17:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Colombia', visitante: 'Portugal', fase: 'grupos', grupo: 'K', fecha: '2026-06-27T19:30:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'RD Congo', visitante: 'Uzbekistán', fase: 'grupos', grupo: 'K', fecha: '2026-06-27T19:30:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Argelia', visitante: 'Austria', fase: 'grupos', grupo: 'J', fecha: '2026-06-27T22:00:00-04:00', golesLocal: null, golesVisitante: null },
  { local: 'Jordania', visitante: 'Argentina', fase: 'grupos', grupo: 'J', fecha: '2026-06-27T22:00:00-04:00', golesLocal: null, golesVisitante: null },
];

// Partidos eliminatorios: usamos placeholder IDs (se actualizan cuando se definan los cruces)
const PLACEHOLDER_LOCAL = 46; // México como placeholder
const PLACEHOLDER_VISITANTE = 4; // Argentina como placeholder

interface PartidoEliminatorio {
  fase: string;
  fecha: string;
  descripcion: string;
}

const PARTIDOS_ELIMINATORIOS: PartidoEliminatorio[] = [
  // 16avos (16 partidos: 73-88)
  { fase: '16avos', fecha: '2026-06-28T18:00:00-04:00', descripcion: '2ºA vs 2ºB' },
  { fase: '16avos', fecha: '2026-06-29T15:00:00-04:00', descripcion: '1ºE vs 3ºA/B/C/D/F' },
  { fase: '16avos', fecha: '2026-06-29T18:00:00-04:00', descripcion: '1ºF vs 2ºC' },
  { fase: '16avos', fecha: '2026-06-29T21:00:00-04:00', descripcion: '1ºC vs 2ºF' },
  { fase: '16avos', fecha: '2026-06-30T15:00:00-04:00', descripcion: '1ºI vs 3ºC/D/F/G/H' },
  { fase: '16avos', fecha: '2026-06-30T18:00:00-04:00', descripcion: '2ºE vs 2ºI' },
  { fase: '16avos', fecha: '2026-06-30T21:00:00-04:00', descripcion: '1ºA vs 3ºC/E/F/H/I' },
  { fase: '16avos', fecha: '2026-07-01T15:00:00-04:00', descripcion: '1ºL vs 3ºE/H/I/J/K' },
  { fase: '16avos', fecha: '2026-07-01T18:00:00-04:00', descripcion: '1ºD vs 3ºB/E/F/I/J' },
  { fase: '16avos', fecha: '2026-07-01T21:00:00-04:00', descripcion: '1ºG vs 3ºA/E/H/I/J' },
  { fase: '16avos', fecha: '2026-07-02T15:00:00-04:00', descripcion: '2ºK vs 2ºL' },
  { fase: '16avos', fecha: '2026-07-02T18:00:00-04:00', descripcion: '1ºH vs 2ºJ' },
  { fase: '16avos', fecha: '2026-07-02T21:00:00-04:00', descripcion: '1ºB vs 3ºE/F/G/I/J' },
  { fase: '16avos', fecha: '2026-07-03T15:00:00-04:00', descripcion: '1ºJ vs 2ºH' },
  { fase: '16avos', fecha: '2026-07-03T18:00:00-04:00', descripcion: '1ºK vs 3ºD/E/I/J/L' },
  { fase: '16avos', fecha: '2026-07-03T21:00:00-04:00', descripcion: '2ºD vs 2ºG' },
  // Octavos (8 partidos: 89-96)
  { fase: 'octavos', fecha: '2026-07-04T15:00:00-04:00', descripcion: 'G.P74 vs G.P77' },
  { fase: 'octavos', fecha: '2026-07-04T19:00:00-04:00', descripcion: 'G.P73 vs G.P75' },
  { fase: 'octavos', fecha: '2026-07-05T15:00:00-04:00', descripcion: 'G.P76 vs G.P78' },
  { fase: 'octavos', fecha: '2026-07-05T19:00:00-04:00', descripcion: 'G.P79 vs G.P80' },
  { fase: 'octavos', fecha: '2026-07-06T15:00:00-04:00', descripcion: 'G.P83 vs G.P84' },
  { fase: 'octavos', fecha: '2026-07-06T19:00:00-04:00', descripcion: 'G.P81 vs G.P82' },
  { fase: 'octavos', fecha: '2026-07-07T15:00:00-04:00', descripcion: 'G.P86 vs G.P88' },
  { fase: 'octavos', fecha: '2026-07-07T19:00:00-04:00', descripcion: 'G.P85 vs G.P87' },
  // Cuartos (4 partidos: 97-100)
  { fase: 'cuartos', fecha: '2026-07-09T15:00:00-04:00', descripcion: 'G.P89 vs G.P90' },
  { fase: 'cuartos', fecha: '2026-07-10T15:00:00-04:00', descripcion: 'G.P93 vs G.P94' },
  { fase: 'cuartos', fecha: '2026-07-11T15:00:00-04:00', descripcion: 'G.P91 vs G.P92' },
  { fase: 'cuartos', fecha: '2026-07-11T19:00:00-04:00', descripcion: 'G.P95 vs G.P96' },
  // Semifinales (2 partidos: 101-102)
  { fase: 'semifinal', fecha: '2026-07-14T18:00:00-04:00', descripcion: 'G.P97 vs G.P98' },
  { fase: 'semifinal', fecha: '2026-07-15T18:00:00-04:00', descripcion: 'G.P99 vs G.P100' },
  // Tercer lugar (1 partido: 103)
  { fase: 'tercer_lugar', fecha: '2026-07-18T18:00:00-04:00', descripcion: 'P.P101 vs P.P102' },
  // Final (1 partido: 104)
  { fase: 'final', fecha: '2026-07-19T18:00:00-04:00', descripcion: 'G.P101 vs G.P102' },
];

// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🏆 FIX + SEED Mundial 2026\n');

  // ─── Paso 1: Eliminar países duplicados (IDs 49-54) ────────
  console.log('🗑️  Paso 1: Eliminando países duplicados (IDs 49-54)...');
  const idsAEliminar = [49, 50, 51, 52, 53, 54];

  for (const id of idsAEliminar) {
    try {
      await prisma.jugador.deleteMany({ where: { paisId: id } });
      await prisma.pais.delete({ where: { id } });
      console.log(`   ✅ País ID ${id} eliminado.`);
    } catch (e: any) {
      if (e.code === 'P2025') {
        console.log(`   ⏭️  País ID ${id} no existe, saltando.`);
      } else {
        console.log(`   ⚠️  Error con ID ${id}: ${e.message}`);
      }
    }
  }

  // ─── Paso 2: Limpiar tablas dependientes ───────────────────
  console.log('\n🧹 Paso 2: Limpiando tablas de grupos y partidos...');
  await prisma.pronosticoPartido.deleteMany({});
  await prisma.golPartido.deleteMany({});
  await prisma.tarjetaPartido.deleteMany({});
  await prisma.partido.deleteMany({});
  await prisma.grupo.deleteMany({});
  console.log('   ✅ Tablas limpiadas.');

  // ─── Paso 3: Crear grupos ─────────────────────────────────
  console.log('\n📊 Paso 3: Creando los 12 grupos...');
  let gruposCreados = 0;

  for (const [grupo, equipos] of Object.entries(GRUPOS)) {
    for (const equipo of equipos) {
      const paisId = PAIS_ID[equipo];
      if (!paisId) {
        console.log(`   ❌ País no mapeado: "${equipo}"`);
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
  console.log(`   ✅ ${gruposCreados} registros de grupo creados.`);

  // ─── Paso 4: Crear partidos de fase de grupos ──────────────
  console.log('\n⚽ Paso 4: Creando 72 partidos de fase de grupos...');
  let partidosGruposCreados = 0;

  for (const p of PARTIDOS_GRUPOS) {
    const localId = PAIS_ID[p.local];
    const visitanteId = PAIS_ID[p.visitante];

    if (!localId || !visitanteId) {
      console.log(`   ❌ No se encontró ID para: ${p.local} (${localId}) vs ${p.visitante} (${visitanteId})`);
      continue;
    }

    await prisma.partido.create({
      data: {
        localId,
        visitanteId,
        fase: p.fase,
        grupo: p.grupo,
        fecha: new Date(p.fecha),
        golesLocal: p.golesLocal,
        golesVisitante: p.golesVisitante,
        bloqueado: p.golesLocal !== null,
        actualizadoPorAdmin: p.golesLocal !== null,
      },
    });
    partidosGruposCreados++;
  }
  console.log(`   ✅ ${partidosGruposCreados} partidos de grupos creados.`);

  // ─── Paso 5: Crear partidos eliminatorios (placeholder) ────
  console.log('\n🏟️  Paso 5: Creando 32 partidos eliminatorios (placeholder)...');
  let eliminatoriasCreadas = 0;

  for (const p of PARTIDOS_ELIMINATORIOS) {
    await prisma.partido.create({
      data: {
        localId: PLACEHOLDER_LOCAL,
        visitanteId: PLACEHOLDER_VISITANTE,
        fase: p.fase,
        grupo: null,
        fecha: new Date(p.fecha),
        golesLocal: null,
        golesVisitante: null,
        bloqueado: false,
        actualizadoPorAdmin: false,
      },
    });
    eliminatoriasCreadas++;
  }
  console.log(`   ✅ ${eliminatoriasCreadas} partidos eliminatorios creados.`);

  // ─── Paso 6: Actualizar estadísticas Grupo A ───────────────
  console.log('\n📈 Paso 6: Actualizando stats del Grupo A (Jornada 1 jugada)...');

  await actualizarGrupo('A', 'México', { gf: 2, gc: 0, resultado: 'G' });
  await actualizarGrupo('A', 'Sudáfrica', { gf: 0, gc: 2, resultado: 'P' });
  await actualizarGrupo('A', 'Corea del Sur', { gf: 2, gc: 1, resultado: 'G' });
  await actualizarGrupo('A', 'Chequia', { gf: 1, gc: 2, resultado: 'P' });

  console.log('   ✅ Grupo A actualizado.');

  // ─── Resumen ───────────────────────────────────────────────
  const totalPartidos = partidosGruposCreados + eliminatoriasCreadas;
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🏆 SEED COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   🌍 Países duplicados eliminados: ${idsAEliminar.length}`);
  console.log(`   📊 Grupos creados: ${gruposCreados} (12 × 4)`);
  console.log(`   ⚽ Partidos creados: ${totalPartidos}`);
  console.log(`      • Fase de grupos: ${partidosGruposCreados}`);
  console.log(`      • Eliminatorias: ${eliminatoriasCreadas}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

async function actualizarGrupo(
  grupo: string,
  pais: string,
  stats: { gf: number; gc: number; resultado: 'G' | 'E' | 'P' },
) {
  const paisId = PAIS_ID[pais];
  if (!paisId) return;

  const puntos = stats.resultado === 'G' ? 3 : stats.resultado === 'E' ? 1 : 0;

  await prisma.grupo.updateMany({
    where: { nombre: grupo, paisId },
    data: {
      partidosJugados: 1,
      ganados: stats.resultado === 'G' ? 1 : 0,
      empatados: stats.resultado === 'E' ? 1 : 0,
      perdidos: stats.resultado === 'P' ? 1 : 0,
      golesAFavor: stats.gf,
      golesEnContra: stats.gc,
      diferenciaGoles: stats.gf - stats.gc,
      puntos,
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
