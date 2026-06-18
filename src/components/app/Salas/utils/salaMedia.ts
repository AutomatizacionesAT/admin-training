import { SALA_MEDIA_MANIFEST } from './salaMedia.manifest';

/**
 * Fotos: automáticas desde public/salas/ (npm run salas:media)
 * Descripciones: opcionales aquí abajo, clave = palabra del nombre de la sala.
 */
const SALA_DESCRIPCIONES: Record<string, string> = {
  COLPATRIA:
    'Sala exclusiva de capacitación con aforo amplio, escritorios individuales, proyector, tablero móvil y TV. Espacio luminoso ideal para formaciones presenciales.',
};

/** CAFÉ → CAFE, misma lógica que el generador de archivos */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchManifestKey(salaName: string): string | null {
  const normalized = normalizeText(salaName);
  let bestKey: string | null = null;
  let bestScore = -Infinity;

  for (const key of Object.keys(SALA_MEDIA_MANIFEST)) {
    const nk = normalizeText(key);
    if (!normalized.includes(nk)) continue;

    // Preferir claves más específicas (más largas, con números, frases completas)
    let score = nk.length;
    if (/\d/.test(nk)) score += 15;
    // Evitar que "TRAINING ROOM" genérico pise "PISO 4 ALA B", etc.
    if (nk === 'TRAINING ROOM') score -= 25;

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey;
}

function matchDescripcionKey(salaName: string): string | null {
  const normalized = normalizeText(salaName);
  const keys = Object.keys(SALA_DESCRIPCIONES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (normalized.includes(normalizeText(key))) return key;
  }
  return null;
}

export function getSalaPhotos(salaName: string): string[] {
  const key = matchManifestKey(salaName);
  if (!key) return [];
  return SALA_MEDIA_MANIFEST[key].fotos.map((f) => {
    if (f.startsWith('http')) return f;
    const rel = f.startsWith('/') ? f.slice(1) : f.replace(/^\.\//, '');
    const path = `${import.meta.env.BASE_URL}${rel}`.replace(/\/{2,}/g, '/');
    return encodeURI(path);
  });
}

export function getSalaDescripcion(salaName: string): string | undefined {
  const key = matchDescripcionKey(salaName);
  return key ? SALA_DESCRIPCIONES[key] : undefined;
}

export function salaTieneFotos(salaName: string): boolean {
  return getSalaPhotos(salaName).length > 0;
}
