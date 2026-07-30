/**
 * Escanea public/salas/** y genera salaMedia.manifest.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SALAS_DIR = path.join(ROOT, 'public', 'salas');
const OUT_FILE = path.join(ROOT, 'src', 'components', 'app', 'Salas', 'utils', 'salaMedia.manifest.ts');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

/** Quita tildes y pasa a mayúsculas (CAFÉ → CAFE) */
function normalizeKey(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Separa sede + clave de sala + índice de galería.
 * Formato esperado: "[Sede] Sala [Nombre] [Orden?]"
 * Ejemplos:
 *   "Telares Sala Marsella.jpg"        → sede=TELARES, key=MARSELLA, order=1
 *   "Telares Sala Marsella 2.jpg"      → sede=TELARES, key=MARSELLA, order=2
 *   "Royal Sala 201.jpg"               → sede=ROYAL,   key=201,      order=1
 *   "Elemento Sala Training Room 1.jpg"→ sede=ELEMENTO, key=TRAINING ROOM 1, order=1
 *   "Elemento Sala Training Room 1 2.jpg"→ sede=ELEMENTO, key=TRAINING ROOM 1, order=2
 */
function parseFilename(filename) {
  const base = path.basename(filename, path.extname(filename));

  // Extraer sede (primera palabra) y el resto tras "Sala "
  const m = base.match(/^(\S+)\s+Sala\s+(.+)$/i);
  if (!m) {
    // Fallback: sin sede — usar solo nombre
    const name = base.replace(/^sala\s+/i, '').trim();
    const gallery = name.match(/^(.+?)\s+([2-9]\d*)$/);
    if (gallery) return { key: normalizeKey(gallery[1]), order: Number(gallery[2]) };
    return { key: normalizeKey(name), order: 1 };
  }

  const sede = normalizeKey(m[1]);   // "TELARES", "ROYAL", "ELEMENTO"
  const rest = m[2].trim();          // "Marsella 2", "Training Room 1 2", "201"

  const numbers = rest.match(/\d+/g) || [];

  // Detectar si el último número es índice de galería (2,3,4…) o parte del nombre
  const galleryM = rest.match(/^(.+?)\s+([2-9]\d*)$/);
  if (galleryM && numbers.length >= 2) {
    // "Training Room 1 2" → nombre=Training Room 1, order=2
    return { key: `${sede} ${normalizeKey(galleryM[1])}`, order: Number(galleryM[2]) };
  }
  if (galleryM && numbers.length === 1) {
    const candidate = galleryM[1].trim();
    const lower = rest.toLowerCase();
    // Si el nombre contiene "training room N", "laboratorio N", "simulator N", etc., el número es parte del nombre.
    // Para "Simulator N" y "Test Room N": usamos la presencia de >=2 números totales (foto 2,3)
    // o bien la convención "Simulator 2 1.jpg" (N + orden=1 explícito) para la primera foto.
    const hasMultipleNumbers = numbers.length >= 2;
    if (/training room\s+\d/i.test(lower) || /laboratorio\s+\d/i.test(lower) || /piso\s+\d/i.test(lower) || /ala\s+[ab]/i.test(lower) || (hasMultipleNumbers && (/simulator\s+\d/i.test(lower) || /test room\s+\d/i.test(lower)))) {
      return { key: `${sede} ${normalizeKey(rest)}`, order: 1 };
    }
    return { key: `${sede} ${normalizeKey(candidate)}`, order: Number(galleryM[2]) };
  }

  return { key: `${sede} ${normalizeKey(rest)}`, order: 1 };
}

function walkImages(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkImages(full, acc);
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
      acc.push(full);
    }
  }
  return acc;
}

function toPublicPath(absPath) {
  const rel = path.relative(path.join(ROOT, 'public'), absPath).replace(/\\/g, '/');
  return `/${rel}`;
}

function generate() {
  const files = walkImages(SALAS_DIR);
  const groups = new Map();

  for (const file of files) {
    const { key, order } = parseFilename(path.basename(file));
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ file, order });
  }

  for (const [, list] of groups) {
    list.sort((a, b) => a.order - b.order);
  }

  const sortedKeys = [...groups.keys()].sort();

  const lines = sortedKeys.map((key) => {
    const fotos = groups.get(key).map(({ file }) => toPublicPath(file));
    const fotosStr = fotos.map((f) => `      ${JSON.stringify(f)}`).join(',\n');
    return `  ${JSON.stringify(key)}: {\n    fotos: [\n${fotosStr},\n    ],\n  }`;
  });

  const content = `// AUTO-GENERADO — no editar a mano.
// Regenerar: npm run salas:media
// Guía de nombres: public/salas/README.md

export const SALA_MEDIA_MANIFEST: Record<string, { fotos: string[] }> = {
${lines.join(',\n')},
};
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : null;
  if (current !== content) {
    fs.writeFileSync(OUT_FILE, content, 'utf8');
  }

  console.log(`✓ salaMedia.manifest.ts — ${sortedKeys.length} salas, ${files.length} imágenes`);
  if (sortedKeys.length === 0) {
    console.log('  (sin imágenes — ver public/salas/README.md)');
  } else {
    for (const key of sortedKeys) {
      console.log(`  · ${key}: ${groups.get(key).length} foto(s)`);
    }
  }
}

generate();
