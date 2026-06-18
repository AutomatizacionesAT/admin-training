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
 * Separa clave de sala vs. índice de galería (foto 2, 3…).
 * "Sala Paris 2"           → PARIS, order 2
 * "Sala Training Room 2"   → TRAINING ROOM 2, order 1  (el 2 es parte del nombre)
 * "Sala Training Room 1 2" → TRAINING ROOM 1, order 2
 */
function parseFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  const name = base.replace(/^sala\s+/i, '').trim();
  const numbers = name.match(/\d+/g) || [];

  const gallery = name.match(/^(.+?)\s+([2-9]\d*)$/);
  if (gallery && numbers.length >= 2) {
    return {
      key: normalizeKey(gallery[1]),
      order: Number(gallery[2]),
    };
  }

  if (gallery && numbers.length === 1) {
    const candidate = gallery[1].trim();
    const order = Number(gallery[2]);
    const lower = name.toLowerCase();
    // El número final es identificador de sala, no galería
    if (/training room\s+\d/i.test(lower) || /laboratorio\s+\d/i.test(lower)) {
      return { key: normalizeKey(name), order: 1 };
    }
    // "Paris 2", "Colombia 2" → foto 2 de la galería
    return { key: normalizeKey(candidate), order };
  }

  return { key: normalizeKey(name), order: 1 };
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
// Generado: ${new Date().toISOString()}

export const SALA_MEDIA_MANIFEST: Record<string, { fotos: string[] }> = {
${lines.join(',\n')},
};
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, content, 'utf8');

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
