import type { ParsedRow } from './types';
import { parseDateToISO } from './calculations';

const SHEET_ID = '1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY';
const SHEET_NAME = 'CONTROL_DE_ACCESOS';

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
    cols: { label: string; type: string }[];
  };
}

/**
 * Columnas en CONTROL_DE_ACCESOS:
 * [0] A - ID/índice
 * [1] B - FECHA CREACION
 * [2] C - USUARIO (cédula)
 * [3] D - CAMPAÑA
 * [4] E - (vacía/skipped)
 * [5] F - MODULO
 * [6] G - OBSERVACION
 */
export async function fetchControlDeAccesos(): Promise<ParsedRow[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const response = await fetch(url);
    const text = await response.text();

    // Google retorna JSONP — extraer el JSON de la respuesta
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
    if (!match || !match[1]) {
      console.error('No se pudo parsear la respuesta de Google Sheets');
      return [];
    }

    const data: GvizData = JSON.parse(match[1]);
    const rows = data.table.rows;

    const parsed: ParsedRow[] = [];

    let dateLogCount = 0; // Log primeras 5 fechas para diagnóstico

    rows.forEach((row: GvizRow) => {
      const rawCamp  = row.c[3]?.v;   // Col D: CAMPAÑA
      const rawModul = row.c[5]?.v;   // Col F: MODULO
      const rawUser  = row.c[2]?.v;   // Col C: USUARIO
      const dateCell = row.c[1];      // Col B: FECHA CREACION

      const camp  = rawCamp  ? String(rawCamp).trim()  : '';
      const modul = rawModul ? String(rawModul).trim() : '';
      const user  = rawUser  ? String(rawUser).trim()  : '';

      // Excluir registros cuyo MODULO contenga "Movilidad"
      if (modul.toUpperCase().includes('MOVILIDAD')) return;

      // Requerir campaña, módulo y fecha
      if (!camp || !modul || !dateCell?.v) return;

      // Diagnóstico: loggear el formato de fecha raw
      if (dateLogCount < 5) {
        console.log(`📅 Fecha raw [v=${JSON.stringify(dateCell.v)}, f=${JSON.stringify(dateCell.f)}]`);
        dateLogCount++;
      }

      // IMPORTANTE: .v de gviz es siempre Date(yyyy, mm, dd) SIN importar el locale.
      // Usar .f es riesgoso porque su formato (MM/DD/YYYY vs DD/MM/YYYY) depende de la config local.
      // Siempre pasaremos el .v original al parser.
      const rawDate = dateCell.v;
      const dateISO = parseDateToISO(rawDate);

      parsed.push({ campana: camp, modulo: modul, usuario: user, dateISO });
    });

    console.log(`📊 CONTROL_DE_ACCESOS: ${parsed.length} registros cargados`);
    return parsed;
  } catch (error) {
    console.error('Error al cargar CONTROL_DE_ACCESOS:', error);
    throw error;
  }
}

/**
 * Carga la lista de coordinadores desde la hoja "DATA" (Columna G = índice 6)
 */
export async function fetchCoordinadores(): Promise<string[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=DATA`;
    const response = await fetch(url);
    const text = await response.text();

    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
    if (!match || !match[1]) return [];

    const data: GvizData = JSON.parse(match[1]);
    const coordinadores = new Set<string>();

    data.table.rows.forEach((row: GvizRow) => {
      if (row.c[6]?.v) {
        coordinadores.add(String(row.c[6].v).trim());
      }
    });

    return Array.from(coordinadores).sort();
  } catch (error) {
    console.error('Error al cargar coordinadores:', error);
    return [];
  }
}
