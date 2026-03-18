/**
 * Convierte un serial de fecha de Excel a YYYY-MM-DD
 */
export function excelSerialToISO(serial: number): string {
  const utcDays = Math.floor(serial) - 25569;
  const d = new Date(utcDays * 86400 * 1000);
  return d.toISOString().split('T')[0];
}

/**
 * Parsea cualquier formato de fecha a YYYY-MM-DD.
 *
 * Soporta:
 *  - Número serial de Excel (e.g. 45739)
 *  - Google Viz Date/DateTime: "Date(2025,2,18)" o "Date(2025,2,18,10,30,0)"  ← mes 0-based
 *  - DD/MM/YYYY o DD/MM/YYYY HH:mm:ss  (formato colombiano típico)
 *  - YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss  (ISO, ya listo)
 *  - MM/DD/YYYY (detectado por año > 31 en parts[2])
 */
export function parseDateToISO(value: unknown): string {
  // 1. Serial numérico (Excel)
  if (typeof value === 'number') {
    return excelSerialToISO(value);
  }

  const str = String(value).trim();

  // 2. Formato Google Visualization: Date(año, mes0based, día, ...)
  //    Funciona para Date y DateTime (ignora hora)
  const gviz = str.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
  if (gviz) {
    const y = gviz[1];
    const m = String(parseInt(gviz[2]) + 1).padStart(2, '0'); // 0-based → 1-based
    const d = gviz[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Quitar la parte de hora si existe (e.g. "18/03/2025 10:30:00" → "18/03/2025")
  const datePart = str.split(/[\sT]/)[0];

  // 3. ISO: YYYY-MM-DD (ya está en el formato correcto)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  // 4. DD/MM/YYYY o MM/DD/YYYY
  const parts = datePart.split('/');
  if (parts.length === 3) {
    const [a, b, c] = parts;
    // Si c tiene 4 dígitos es el año → asumimos DD/MM/YYYY (formato colombiano)
    if (c.length === 4) {
      return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    }
    // Si a tiene 4 dígitos → YYYY/MM/DD
    if (a.length === 4) {
      return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
    }
  }

  // Fallback: devolver tal cual (se loggeará como inválido en fetch)
  return datePart || str;
}

/**
 * Calcula el porcentaje de registros logrados respecto a la meta semanal.
 */
export function getPercentage(registros: number, semana: number): number {
  if (semana === 0) return 0;
  return Math.round((registros / semana) * 100);
}
