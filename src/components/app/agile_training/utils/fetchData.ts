import { parseDateToISO } from '../../usabilidad_web_training/utils/calculations';
import type { AgileTrainingRow } from './types';

const SHEET_ID = '1dPufFMja1m37XDxl0NI51k69jleJ1J6s6pQR2Eja3Y4';
const SHEET_NAME = 'dataagile';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzQWg-rrHClJ49zbJHhIwXG48fDsHjwarXgwuE1CkQVJCj0Y84U-z19WuQskLjk7iPR/exec';

interface GvizCell {
  v: string | number | null;
  f?: string;
}

interface GvizRow {
  c: (GvizCell | null)[];
}

interface GvizData {
  table: {
    rows: GvizRow[];
  };
}

interface AgileScriptResponse {
  result?: string;
  rows?: Array<Array<string | number | null>>;
  error?: string;
}

function getCellText(cell: GvizCell | null | undefined): string {
  if (!cell) return '';
  if (typeof cell.f === 'string' && cell.f.trim()) return cell.f.trim();
  if (cell.v === null || cell.v === undefined) return '';
  return String(cell.v).trim();
}

function parsePercent(cell: GvizCell | null | undefined): number {
  if (!cell) return 0;

  const display = getCellText(cell);
  if (display.includes('%')) {
    const numeric = Number.parseFloat(display.replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  if (typeof cell.v === 'number') {
    if (cell.v >= 0 && cell.v <= 1) {
      return Number((cell.v * 100).toFixed(2));
    }
    return Number(cell.v.toFixed(2));
  }

  const numeric = Number.parseFloat(display.replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseNumber(cell: GvizCell | null | undefined): number {
  if (!cell) return 0;
  if (typeof cell.v === 'number') return cell.v;
  const numeric = Number.parseFloat(getCellText(cell).replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseDateCell(cell: GvizCell | null | undefined): { display: string; iso: string } {
  const display = getCellText(cell);
  if (!display) return { display: '', iso: '' };

  const source = cell?.v ?? display;
  const iso = parseDateToISO(source);
  return { display, iso };
}

function getValueAt(values: Array<string | number | null>, index: number): string | number | null {
  return index < values.length ? values[index] : null;
}

function toCell(value: string | number | null): GvizCell | null {
  if (value === null || value === undefined || value === '') return null;
  return { v: value };
}

function mapRow(row: GvizRow): AgileTrainingRow[] {
  if (!row?.c?.length) return [];

  const campana = getCellText(row.c[0]);
  if (!campana || campana.toUpperCase() === 'CAMPAÑA') return [];

  const fechaInicio = parseDateCell(row.c[21]);
  const fechaFin = parseDateCell(row.c[22]);

  return [{
    campana,
    coordinador: getCellText(row.c[1]),
    industria: getCellText(row.c[2]),
    tercio1: getCellText(row.c[3]),
    formadorDeFormadores: getCellText(row.c[4]),
    ced: getCellText(row.c[5]),
    uAtento: getCellText(row.c[6]),
    tercio2: getCellText(row.c[7]),
    tipologiasParetoKpi: getCellText(row.c[8]),
    encuestaAsesor: getCellText(row.c[9]),
    mejoraEncuestaPostTraining: getCellText(row.c[10]),
    levantamientosCliente: getCellText(row.c[11]),
    migracionMalla: getCellText(row.c[12]),
    tercio3: getCellText(row.c[13]),
    herramientasDiferenciales: getCellText(row.c[14]),
    metodologiasObjetivos: getCellText(row.c[15]),
    piloto: getCellText(row.c[16]),
    pptLanzamiento: getCellText(row.c[17]),
    graduacionOjt: getCellText(row.c[18]),
    resultados: getCellText(row.c[19]),
    avance: getCellText(row.c[20]),
    fechaInicio: fechaInicio.display,
    fechaFin: fechaFin.display,
    duracion: getCellText(row.c[23]),
    meta: getCellText(row.c[24]),
    cumplimiento: getCellText(row.c[25]),
    insignia: getCellText(row.c[26]),
    estado: getCellText(row.c[27]),
    notas: getCellText(row.c[28]),
    tercio1Pct: parsePercent(row.c[3]),
    tercio2Pct: parsePercent(row.c[7]),
    tercio3Pct: parsePercent(row.c[13]),
    pilotoPct: parsePercent(row.c[16]),
    avancePct: parsePercent(row.c[20]),
    metaPct: parsePercent(row.c[24]),
    cumplimientoPct: parsePercent(row.c[25]),
    duracionDias: parseNumber(row.c[23]),
    fechaInicioISO: fechaInicio.iso,
    fechaFinISO: fechaFin.iso,
  }];
}

function mapValuesToRows(values: Array<Array<string | number | null>>): AgileTrainingRow[] {
  return values.flatMap((valuesRow) => {
    const row: GvizRow = {
      c: Array.from({ length: 29 }, (_, index) => toCell(getValueAt(valuesRow, index))),
    };

    return mapRow(row);
  });
}

async function fetchViaAppsScript(): Promise<AgileTrainingRow[]> {
  const response = await fetch(`${GAS_URL}?action=getAgileData`);
  const result: AgileScriptResponse = await response.json();

  if (result.result !== 'success' || !Array.isArray(result.rows)) {
    throw new Error(result.error || 'Apps Script sin datos para Agile Training');
  }

  return mapValuesToRows(result.rows);
}

async function fetchViaGviz(): Promise<AgileTrainingRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const response = await fetch(url);
  const text = await response.text();

  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
  if (!match || !match[1]) {
    console.error('No se pudo parsear la respuesta de Google Sheets');
    return [];
  }

  const data: GvizData = JSON.parse(match[1]);
  return data.table.rows.flatMap(mapRow);
}

export async function fetchAgileTrainingData(): Promise<AgileTrainingRow[]> {
  try {
    try {
      return await fetchViaAppsScript();
    } catch (appsScriptError) {
      console.warn('Apps Script no disponible para Agile Training, intentando gviz...', appsScriptError);
      return await fetchViaGviz();
    }
  } catch (error) {
    console.error('Error al cargar Agile Training:', error);
    throw error;
  }
}
