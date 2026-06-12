/**
 * Script para parsear archivos .txt copiados de Transfermarkt
 * y generar el JSON listo para el endpoint POST /mundial/admin/cargar-pais
 *
 * USO:
 *   npx ts-node scripts/parsear-seleccion.ts <archivo.txt> [--enviar]
 *
 * Ejemplos:
 *   npx ts-node scripts/parsear-seleccion.ts alemania.txt
 *   npx ts-node scripts/parsear-seleccion.ts alemania.txt --enviar
 *   npx ts-node scripts/parsear-seleccion.ts plantillas/brasil.txt --enviar --url http://localhost:3000
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Configuración ──────────────────────────────────────────────────────────

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = '/mundial/admin/cargar-pais';

// ─── Mapeo de posiciones Transfermarkt → API ────────────────────────────────

const POSICION_MAP: Record<string, string> = {
  'portero': 'Portero',
  'defensa central': 'Defensa',
  'lateral izquierdo': 'Defensa',
  'lateral derecho': 'Defensa',
  'carrilero izquierdo': 'Defensa',
  'carrilero derecho': 'Defensa',
  'líbero': 'Defensa',
  'pivote': 'Mediocentro',
  'mediocentro': 'Mediocentro',
  'mediocentro ofensivo': 'Mediocentro',
  'mediocentro defensivo': 'Mediocentro',
  'mediapunta': 'Mediocentro',
  'interior derecho': 'Mediocentro',
  'interior izquierdo': 'Mediocentro',
  'extremo derecho': 'Delantero',
  'extremo izquierdo': 'Delantero',
  'delantero centro': 'Delantero',
  'mediapunta / delantero centro': 'Delantero',
  'segunda punta': 'Delantero',
};

// ─── Interfaz de salida ─────────────────────────────────────────────────────

interface JugadorParsed {
  dorsal: number;
  nombre: string;
  posicion: string;
  edad: number;
}

interface SeleccionPayload {
  pais: string;
  jugadores: JugadorParsed[];
}

// ─── Parser ─────────────────────────────────────────────────────────────────

function parsearArchivo(contenido: string): SeleccionPayload {
  const lineas = contenido.split('\n').map((l) => l.trim());

  // La primera línea no vacía es el nombre del país
  const pais = lineas.find((l) => l.length > 0 && !l.startsWith('#'));
  if (!pais) {
    throw new Error('No se pudo determinar el nombre del país (primera línea del archivo).');
  }

  const jugadores: JugadorParsed[] = [];

  // Buscar el patrón: línea con solo un número (dorsal) seguida de datos del jugador
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];

    // Detectar línea de dorsal: es un número solo (1-99) seguido de tab o solo
    const dorsalMatch = linea.match(/^(\d{1,2})\s*$/);

    if (dorsalMatch) {
      const dorsal = parseInt(dorsalMatch[1], 10);

      // Siguiente línea: nombre del jugador (puede tener el nombre duplicado separado por tab)
      i++;
      if (i >= lineas.length) break;
      const lineaNombre = lineas[i];
      const nombre = lineaNombre.split('\t')[0].trim();

      if (!nombre) { i++; continue; }

      // Siguiente línea: posición
      i++;
      if (i >= lineas.length) break;
      const lineaPosicion = lineas[i].trim().toLowerCase();
      const posicion = POSICION_MAP[lineaPosicion] || mapearPosicionFuzzy(lineaPosicion);

      // Siguiente línea: edad + club + valor (separados por tab)
      i++;
      if (i >= lineas.length) break;
      const lineaDatos = lineas[i];
      const partesDatos = lineaDatos.split('\t');
      const edad = parseInt(partesDatos[0], 10);

      if (!isNaN(dorsal) && nombre && posicion && !isNaN(edad)) {
        jugadores.push({ dorsal, nombre, posicion, edad });
      }
    }

    i++;
  }

  if (jugadores.length === 0) {
    throw new Error(
      `No se encontraron jugadores en el archivo. Verifica que el formato sea el de Transfermarkt.`,
    );
  }

  return { pais, jugadores };
}

function mapearPosicionFuzzy(posicion: string): string {
  if (posicion.includes('portero')) return 'Portero';
  if (posicion.includes('defensa') || posicion.includes('lateral') || posicion.includes('carrilero') || posicion.includes('líbero'))
    return 'Defensa';
  if (posicion.includes('delantero') || posicion.includes('extremo') || posicion.includes('punta'))
    return 'Delantero';
  // Default: todo lo que suene a medio
  return 'Mediocentro';
}

// ─── Enviar al endpoint ─────────────────────────────────────────────────────

async function enviarAlEndpoint(payload: SeleccionPayload, baseUrl: string): Promise<void> {
  const url = `${baseUrl}${ENDPOINT}`;
  console.log(`\n📡 Enviando a: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error ${response.status}: ${error}`);
  }

  const data = await response.json();
  console.log('✅ Respuesta del servidor:', JSON.stringify(data, null, 2));
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  PARSER DE SELECCIONES - Mundial 2026                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Uso:                                                        ║
║    npx ts-node scripts/parsear-seleccion.ts <archivo.txt>    ║
║                                                              ║
║  Opciones:                                                   ║
║    --enviar    Envía el JSON al endpoint automáticamente      ║
║    --url       URL base del servidor (default: localhost:3000)║
║                                                              ║
║  Ejemplo:                                                    ║
║    npx ts-node scripts/parsear-seleccion.ts alemania.txt     ║
║    npx ts-node scripts/parsear-seleccion.ts brasil.txt --enviar║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  const archivoArg = args[0];
  const enviar = args.includes('--enviar');
  const urlIndex = args.indexOf('--url');
  const baseUrl = urlIndex !== -1 && args[urlIndex + 1] ? args[urlIndex + 1] : API_BASE_URL;

  // Resolver ruta del archivo
  const archivoPath = path.isAbsolute(archivoArg)
    ? archivoArg
    : path.resolve(process.cwd(), archivoArg);

  if (!fs.existsSync(archivoPath)) {
    console.error(`❌ Archivo no encontrado: ${archivoPath}`);
    process.exit(1);
  }

  console.log(`📂 Leyendo: ${archivoPath}`);
  const contenido = fs.readFileSync(archivoPath, 'utf-8');

  const payload = parsearArchivo(contenido);

  console.log(`\n🏳️  País: ${payload.pais}`);
  console.log(`👥 Jugadores encontrados: ${payload.jugadores.length}`);
  console.log('');

  // Mostrar tabla resumen
  console.log('┌──────┬────────────────────────────────┬──────────────┬──────┐');
  console.log('│ #    │ Nombre                         │ Posición     │ Edad │');
  console.log('├──────┼────────────────────────────────┼──────────────┼──────┤');
  for (const j of payload.jugadores) {
    const dorsal = String(j.dorsal).padEnd(4);
    const nombre = j.nombre.padEnd(30).slice(0, 30);
    const posicion = j.posicion.padEnd(12);
    const edad = String(j.edad).padEnd(4);
    console.log(`│ ${dorsal} │ ${nombre} │ ${posicion} │ ${edad} │`);
  }
  console.log('└──────┴────────────────────────────────┴──────────────┴──────┘');

  // Guardar JSON
  const outputDir = path.resolve(path.dirname(archivoPath), 'json');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `${payload.pais.toLowerCase().replace(/\s+/g, '-')}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\n💾 JSON guardado en: ${outputPath}`);

  // Enviar si se indicó
  if (enviar) {
    await enviarAlEndpoint(payload, baseUrl);
  } else {
    console.log(`\n💡 Usa --enviar para enviarlo directamente al servidor.`);
    console.log(`   npx ts-node scripts/parsear-seleccion.ts ${archivoArg} --enviar`);
  }
}

main().catch((err) => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});
