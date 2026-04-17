import type { BiometricRow } from './types';
import { parseDateToISO } from '../../usabilidad_web_training/utils/calculations';

const SHEET_ID = '1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY';
const SHEET_NAME = 'INFORME BIOMETRICO';

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

// Convert "9:07:21" or decimal to decimal hours
function parseHoursToDecimal(val: string | number | null | undefined): { timeStr: string; decimal: number } {
  if (val === null || val === undefined || val === '') return { timeStr: '0:00:00', decimal: 0 };
  
  // If it's a number, it could be decimal from Google Sheets (fraction of day)
  if (typeof val === 'number') {
    const hours = val * 24;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.round(((hours - h) * 60 - m) * 60);
    return { 
      timeStr: `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, 
      decimal: hours 
    };
  }

  // If it's a string like "9:07:21"
  const str = String(val).trim();
  const parts = str.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return {
      timeStr: str,
      decimal: h + m / 60 + s / 3600
    };
  }
  
  return { timeStr: str, decimal: 0 };
}

function parseTime(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // Si viene como fracción de día
    const date = new Date(val * 24 * 3600 * 1000);
    return date.toISOString().substr(11, 8);
  }
  return String(val).trim();
}

export async function fetchInformeBiometrico(): Promise<BiometricRow[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const response = await fetch(url);
    const text = await response.text();

    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
    if (!match || !match[1]) {
      console.error('No se pudo parsear la respuesta de Google Sheets');
      return [];
    }

    const data: GvizData = JSON.parse(match[1]);
    const parsed: BiometricRow[] = [];

    data.table.rows.forEach((row: GvizRow) => {
      // Si la fila está totalmente vacía
      if (!row || !row.c || !row.c.length) return;
      
      const rawDateObj = row.c[0];
      const rawSemana = row.c[1]?.v;
      const rawCc = row.c[2]?.v;
      const rawColaborador = row.c[3]?.v;
      const rawIngreso = row.c[4]?.f || row.c[4]?.v; // preferir .f para tiempo
      const rawSalida = row.c[5]?.f || row.c[5]?.v;
      const rawHoras = row.c[6]?.f || row.c[6]?.v;
      const rawObs = row.c[7]?.v;
      
      const diaStr = rawDateObj?.f ? String(rawDateObj.f).trim() : (rawDateObj?.v ? String(rawDateObj.v).trim() : '');
      const colaborador = rawColaborador ? String(rawColaborador).trim() : '';
      
      // Ignorar encabezados o filas vacías
      if (!colaborador || colaborador.toLowerCase() === 'colaborador' || !diaStr) return;
      
      const dateISO = parseDateToISO(rawDateObj?.v === null ? diaStr : (rawDateObj?.v || diaStr));
      
      const parsedHours = parseHoursToDecimal(rawHoras);

      parsed.push({
        dia: diaStr,
        semana: rawSemana ? String(rawSemana).trim() : '',
        cc: rawCc ? String(rawCc).trim() : '',
        colaborador: colaborador,
        ingreso: parseTime(rawIngreso),
        salida: parseTime(rawSalida),
        horasDiarias: parsedHours.timeStr,
        horasDecimal: parsedHours.decimal,
        observacion: rawObs ? String(rawObs).trim() : '',
        dateISO
      });
    });

    console.log(`📊 INFORME BIOMETRICO: ${parsed.length} registros cargados`);
    return parsed;
  } catch (error) {
    console.error('Error al cargar INFORME BIOMETRICO:', error);
    throw error;
  }
}
