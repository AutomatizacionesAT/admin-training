import { parseDateToISO } from '../../usabilidad_web_training/utils/calculations';
import type { AcademyRow, AcademySheetKey } from './types';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzQWg-rrHClJ49zbJHhIwXG48fDsHjwarXgwuE1CkQVJCj0Y84U-z19WuQskLjk7iPR/exec';

interface AcademyScriptResponse {
  result?: string;
  rows?: Array<Array<string | number | null>>;
  error?: string;
}

function getValueAt(values: Array<string | number | null>, index: number): string | number | null {
  return index < values.length ? values[index] : null;
}

function getCellText(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseProgress(value: string | number | null): { raw: string; pct: number | null } {
  if (value === null || value === undefined || value === '') {
    return { raw: 'Pendiente', pct: null };
  }

  if (typeof value === 'number') {
    const pct = value <= 1 ? value * 100 : value;
    return { raw: `${Math.round(pct)}%`, pct };
  }

  const numeric = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (Number.isFinite(numeric)) {
    const pct = numeric <= 1 ? numeric * 100 : numeric;
    return { raw: `${Math.round(pct)}%`, pct };
  }

  return { raw: String(value), pct: null };
}

function parseDateCell(value: string | number | null): { display: string; iso: string } {
  const display = getCellText(value);
  if (!display) return { display: '', iso: '' };
  if (display.toUpperCase() === 'PENDIENTE') return { display: 'Pendiente', iso: '' };

  const iso = parseDateToISO(value ?? display);
  return { display, iso };
}

function parseDuration(value: string | number | null): { text: string; days: number | null } {
  if (value === null || value === undefined || value === '') {
    return { text: 'Pendiente', days: null };
  }

  if (typeof value === 'number') {
    return { text: String(value), days: value };
  }

  const numeric = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (Number.isFinite(numeric)) {
    return { text: String(numeric), days: numeric };
  }

  return { text: String(value), days: null };
}

function mapRows(rows: Array<Array<string | number | null>>): AcademyRow[] {
  return rows.flatMap((row) => {
    const campana = getCellText(getValueAt(row, 2));
    if (!campana || campana.toUpperCase() === 'CAMPAÑA') return [];

    const backup = parseProgress(getValueAt(row, 4));
    const migracion = parseProgress(getValueAt(row, 5));
    const fechaInicio = parseDateCell(getValueAt(row, 6));
    const fechaFin = parseDateCell(getValueAt(row, 7));
    const duracion = parseDuration(getValueAt(row, 8));

    return [{
      industria: getCellText(getValueAt(row, 0)),
      direccion: getCellText(getValueAt(row, 1)),
      campana,
      coordinador: getCellText(getValueAt(row, 3)),
      backupRaw: backup.raw,
      migracionRaw: migracion.raw,
      backupPct: backup.pct,
      migracionPct: migracion.pct,
      fechaInicio: fechaInicio.display,
      fechaFin: fechaFin.display,
      fechaInicioISO: fechaInicio.iso,
      fechaFinISO: fechaFin.iso,
      duracion: duracion.text,
      duracionDias: duracion.days,
      estado: getCellText(getValueAt(row, 9)),
      notas: getCellText(getValueAt(row, 10)),
    }];
  });
}

export async function fetchAcademySheet(sheet: AcademySheetKey): Promise<AcademyRow[]> {
  const response = await fetch(`${GAS_URL}?action=getAcademyData&sheet=${sheet}`);
  const result: AcademyScriptResponse = await response.json();

  if (result.result !== 'success' || !Array.isArray(result.rows)) {
    throw new Error(result.error || `Apps Script sin datos para ${sheet}`);
  }

  return mapRows(result.rows);
}
