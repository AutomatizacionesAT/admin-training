/** Parsea fechas de asignaciones (Sheets gviz, ISO, DD/MM/YYYY…) */
export function parseAsignacionDate(raw: string): Date | null {
  if (!raw) return null;

  const gs = raw.match(/Date\((\d{4}),(\d+),(\d+)\)/);
  if (gs) {
    const d = new Date(+gs[1], +gs[2], +gs[3]);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);

  const ymd = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);

  const fb = new Date(raw);
  return isNaN(fb.getTime()) ? null : fb;
}

/** Valor para `<input type="date">` (YYYY-MM-DD) */
export function toInputDateValue(raw: string): string {
  const d = parseAsignacionDate(raw);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayMonth(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/** Tabla: "Desde 11/06 - hasta 15/06" (sin año) */
export function formatAsignacionRango(inicio: string, fin: string): string {
  const s = parseAsignacionDate(inicio);
  const e = parseAsignacionDate(fin);
  if (!s && !e) return '—';
  if (s && !e) return `Desde ${formatDayMonth(s)}`;
  if (!s && e) return `Hasta ${formatDayMonth(e)}`;
  return `Desde ${formatDayMonth(s!)} - hasta ${formatDayMonth(e!)}`;
}
