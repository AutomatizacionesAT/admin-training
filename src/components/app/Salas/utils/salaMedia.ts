import { SALA_MEDIA_MANIFEST } from './salaMedia.manifest';

/**
 * Fotos: automáticas desde public/salas/ (npm run salas:media)
 * Descripciones: opcionales aquí abajo, clave = palabra del nombre de la sala.
 */
const SALA_DESCRIPCIONES: Record<string, string> = {
  COLPATRIA:
    'Sala exclusiva de capacitación con aforo amplio, escritorios individuales, proyector, tablero móvil y TV. Espacio luminoso ideal para formaciones presenciales.',
};

/**
 * Alias manuales: nombre normalizado del catálogo → clave en el manifest.
 * Usar cuando el nombre de archivo no puede seguir el patrón estándar
 * (ej: nombres con número final ambiguo como "Simulator 2").
 * Formato clave alias: "PREFIJOSEDE NOMBRESALA"
 */
const SALA_MANIFEST_ALIASES: Record<string, string> = {
  // Reservado para casos donde el nombre de archivo no puede seguir el patrón estándar.
  // Ejemplo: 'NEVADOS SIMULATOR 2': 'NEVADOS SIMULATORDOS'
};

/**
 * Mapeo de la primera palabra de la sede (sheet) → prefijo usado en los archivos/manifest.
 * Necesario cuando la carpeta tiene un nombre distinto al primer token de la sede.
 * Ej: sede "PARQUE OLAYA (PEREIRA)" → prefijo "OLAYA" (carpeta public/salas/olaya/)
 */
const SEDE_ROOT_MAP: Record<string, string> = {
  PARQUE: 'OLAYA',
};
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchManifestKey(salaName: string, sede?: string): string | null {
  const normalizedSala = normalizeText(salaName);
  const normalizedSede = sede ? normalizeText(sede) : '';

  // Extraer la primera palabra limpia de la sede, sin paréntesis ni caracteres especiales,
  // y aplicar el mapeo si la carpeta usa un prefijo distinto al primer token de la sede.
  // "NEVADOS(PEREIRA)" → "NEVADOS", "PARQUE OLAYA (PEREIRA)" → "OLAYA"
  const rawRoot = normalizedSede
    ? normalizedSede.replace(/[()]/g, ' ').trim().split(/\s+/)[0]
    : '';
  const sedeRoot = rawRoot ? (SEDE_ROOT_MAP[rawRoot] ?? rawRoot) : '';

  // 0. Alias explícitos (para nombres con número final ambiguo)
  if (sedeRoot) {
    const aliasKey = `${sedeRoot} ${normalizedSala}`;
    if (SALA_MANIFEST_ALIASES[aliasKey]) return SALA_MANIFEST_ALIASES[aliasKey];
  } else {
    if (SALA_MANIFEST_ALIASES[normalizedSala]) return SALA_MANIFEST_ALIASES[normalizedSala];
  }

  // 1. Buscar clave con sede conocida: "TELARES MARSELLA"
  //    Solo busca claves cuyo prefijo coincida con la sede raíz.
  //    Si se pasa sede pero no hay ninguna clave de esa sede, devuelve null
  //    (no hace fallback a otra sede para evitar mostrar fotos equivocadas).
  if (sedeRoot) {
    let bestKey: string | null = null;
    let bestScore = -Infinity;

    for (const key of Object.keys(SALA_MEDIA_MANIFEST)) {
      const nk = normalizeText(key);

      // La clave DEBE empezar con la sede raíz para ser candidata
      if (!nk.startsWith(sedeRoot)) continue;

      // La clave debe contener el nombre de la sala o viceversa
      const keyName = nk.slice(sedeRoot.length).trim(); // parte después de la sede
      if (!normalizedSala.includes(keyName) && !keyName.includes(normalizedSala)) continue;

      let score = keyName.length;
      if (/\d/.test(keyName)) score += 15;

      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }

    // Devolver lo encontrado (puede ser null si la sede no tiene fotos aún)
    return bestKey;
  }

  // 2. Sin sede: fallback por nombre de sala solamente
  let bestKey: string | null = null;
  let bestScore = -Infinity;

  for (const key of Object.keys(SALA_MEDIA_MANIFEST)) {
    const nk = normalizeText(key);
    const keyParts = nk.split(' ');
    const keyName = keyParts.slice(1).join(' ') || nk; // sin la primera palabra (sede)

    if (!normalizedSala.includes(keyName) && !keyName.includes(normalizedSala)) continue;

    let score = keyName.length;
    if (/\d/.test(keyName)) score += 15;
    if (keyName === 'TRAINING ROOM') score -= 25;

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

export function getSalaPhotos(salaName: string, sede?: string): string[] {
  const key = matchManifestKey(salaName, sede);
  if (!key) return [];
  const entry = SALA_MEDIA_MANIFEST[key];
  if (!entry) return []; // alias apunta a clave inexistente — nunca crashear
  return entry.fotos.map((f) => {
    if (f.startsWith('http')) return f;
    const rel = f.startsWith('/') ? f.slice(1) : f.replace(/^\.\//, '');
    const path = `${import.meta.env.BASE_URL}${rel}`.replace(/\/{2,}/g, '/');
    return encodeURI(path);
  });
}

export function getSalaDescripcion(salaName: string, _sede?: string): string | undefined {
  const key = matchDescripcionKey(salaName);
  return key ? SALA_DESCRIPCIONES[key] : undefined;
}

export function salaTieneFotos(salaName: string, sede?: string): boolean {
  return getSalaPhotos(salaName, sede).length > 0;
}
