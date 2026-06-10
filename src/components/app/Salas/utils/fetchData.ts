import type { SalaRecord, AsignacionRecord, SalasAdminRecord, SalasRole } from './types';

const SHEET_ID = '1OtFWpA1NnkErvYmgwjqkic48b9UvGshEKAbBvcl-RuA';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbySKDZybmsTJRudsjNmyBlY6hDQjZT5nGt1_hTnBDSLUKObkVwMzL8XnCQEI5lTx361/exec';

interface GvizCell { v: string | number | null; f?: string; }
interface GvizRow { c: (GvizCell | null)[]; }
interface GvizData { table: { rows: GvizRow[] }; }

function cell(row: GvizRow, i: number): string {
  return row.c[i]?.v != null ? String(row.c[i]!.v).trim() : '';
}

async function fetchSheet(sheetName: string): Promise<GvizRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
  if (!match?.[1]) return [];
  const data: GvizData = JSON.parse(match[1]);
  return data.table.rows ?? [];
}

// ─── SALAS_CATALOGO ───────────────────────────────────────────────────────────
export async function fetchSalasCatalogo(): Promise<SalaRecord[]> {
  const rows = await fetchSheet('SALAS_CATALOGO');
  const result: SalaRecord[] = [];
  let rowIndex = 2;
  let lastSede = '';
  let lastSala: SalaRecord | null = null;

  rows.forEach((row) => {
    if (!row?.c?.length) { rowIndex++; return; }
    const sedeRaw = cell(row, 0);
    const sala = cell(row, 1);
    const horario = cell(row, 5);

    if (sedeRaw) lastSede = sedeRaw;
    const sede = lastSede;

    if (!sala) {
      // Fila de horario alternativo (PM) de la sala anterior
      if (lastSala && horario) {
        result.push({ ...lastSala, rowIndex, horario });
      }
      rowIndex++;
      return;
    }

    const record: SalaRecord = {
      rowIndex,
      sede,
      sala,
      tipo: cell(row, 2),
      capacidad: cell(row, 3),
      equipos: cell(row, 4),
      horario,
      tablero: cell(row, 6),
      tv: cell(row, 7),
    };
    lastSala = record;
    result.push(record);
    rowIndex++;
  });
  console.log(`🏛 SALAS_CATALOGO: ${result.length} entradas (AM+PM)`);
  return result;
}

// ─── SALAS_ASIGNACIONES ───────────────────────────────────────────────────────
export async function fetchSalasAsignaciones(): Promise<AsignacionRecord[]> {
  const rows = await fetchSheet('SALAS_ASIGNACIONES');
  const result: AsignacionRecord[] = [];
  let rowIndex = 2;

  rows.forEach((row) => {
    if (!row?.c?.length) { rowIndex++; return; }
    const campana = cell(row, 0);
    if (!campana) { rowIndex++; return; }
    result.push({
      rowIndex,
      campana,
      req: cell(row, 1),
      sala: cell(row, 2),
      sede: cell(row, 3),
      formador: cell(row, 4),
      fechaInicial: cell(row, 5),
      fechaFin: cell(row, 6),
      horario: cell(row, 7),
      dPersonas: cell(row, 8),
    });
    rowIndex++;
  });
  console.log(`📋 SALAS_ASIGNACIONES: ${result.length} asignaciones`);
  return result;
}

// ─── SALAS_ADMINS ─────────────────────────────────────────────────────────────
export async function fetchSalasAdmins(): Promise<SalasAdminRecord[]> {
  const rows = await fetchSheet('SALAS_ADMINS');
  const result: SalasAdminRecord[] = [];

  rows.forEach((row) => {
    if (!row?.c?.length) return;
    const documento = cell(row, 0);
    const nombre = cell(row, 1);
    const cargo = cell(row, 2);
    if (!documento) return;


    let rol: SalasRole = 'COORDINADOR';
    if (
      documento === '52829724' || // Diana Maritza Perderos
      documento === '1018509964'      // Sebastian Santos Polania
    ) {
      rol = 'SUPER_ADMIN';
    }

    result.push({ documento, nombre, cargo, rol });
  });
  return result;
}

// ─── Login por cédula ─────────────────────────────────────────────────────────
export async function loginByCedula(cedula: string): Promise<SalasAdminRecord | null> {
  const admins = await fetchSalasAdmins();
  return admins.find(a => a.documento === cedula.trim()) ?? null;
}

// ─── CRUD vía Apps Script (modo no-cors) ──────────────────────────────────────
async function gasPost(payload: object): Promise<void> {
  await fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
}

// Sala CRUD
export async function createSala(sala: Omit<SalaRecord, 'rowIndex'>): Promise<void> {
  await gasPost({ action: 'createSala', data: sala });
}
export async function updateSala(sala: SalaRecord): Promise<void> {
  await gasPost({ action: 'updateSala', rowIndex: sala.rowIndex, data: sala });
}
export async function deleteSala(rowIndex: number): Promise<void> {
  await gasPost({ action: 'deleteSala', rowIndex });
}

// Asignación CRUD
export async function createAsignacion(a: Omit<AsignacionRecord, 'rowIndex'>): Promise<void> {
  await gasPost({ action: 'createAsignacion', data: a });
}
export async function updateAsignacion(a: AsignacionRecord): Promise<void> {
  await gasPost({ action: 'updateAsignacion', rowIndex: a.rowIndex, data: a });
}
export async function deleteAsignacion(rowIndex: number): Promise<void> {
  await gasPost({ action: 'deleteAsignacion', rowIndex });
}
