import type { SalaRecord, AsignacionRecord, SalasAdminRecord, SalasRole, TicketRecord } from './types';

const SHEET_ID = '1OtFWpA1NnkErvYmgwjqkic48b9UvGshEKAbBvcl-RuA';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw9Yhu7K4rkz7Rv-Zhy-9UFfHlW_57s4qBy--vNPz6yOlvI6vcQAe3nzHg1p6Ow0fGP/exec';

interface GvizCell { v: string | number | null; f?: string; }
interface GvizRow { c: (GvizCell | null)[]; }
interface GvizData { table: { rows: GvizRow[] }; }

function cell(row: GvizRow, i: number): string {
  return row.c[i]?.v != null ? String(row.c[i]!.v).trim() : '';
}

async function fetchSheet(sheetName: string): Promise<GvizRow[]> {
  // headers=1 le indica a gviz que la fila 1 son encabezados y NO deben
  // aparecer como datos — evita el bug donde una hoja vacía devuelve los headers.
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(sheetName)}`;
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

    // Descarta filas de cabecera que gviz puede colar como datos
    if (sedeRaw && sedeRaw.toUpperCase() === 'SEDE') { rowIndex++; return; }
    if (sala && sala.toUpperCase() === 'SALA') { rowIndex++; return; }

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
// Columnas: CAMPAÑA(0) REQ(1) SALA(2) SEDE(3) FORMADOR(4) FECHA INICIAL(5)
//           FECHA FIN(6) HORARIO(7) CANTIDAD PERSONAS(8)
//           ESTADO ASIGNACION SALA(9) TICKET(10) ESTADO TICKET(11)
export async function fetchSalasAsignaciones(): Promise<AsignacionRecord[]> {
  const rows = await fetchSheet('SALAS_ASIGNACIONES');
  const result: AsignacionRecord[] = [];
  let rowIndex = 2;

  rows.forEach((row) => {
    if (!row?.c?.length) { rowIndex++; return; }
    const campana = cell(row, 0);
    if (!campana || campana.toUpperCase() === 'CAMPAÑA' || campana.toUpperCase() === 'CAMPANA') { rowIndex++; return; }
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
      estadoAsignacion: cell(row, 9) || 'APROBADO',
      ticket: cell(row, 10),
      estadoTicket: cell(row, 11),
    });
    rowIndex++;
  });
  console.log(`📋 SALAS_ASIGNACIONES: ${result.length} asignaciones`);
  return result;
}

// ─── ASIGNACION_TICKET ────────────────────────────────────────────────────────
// Columnas: CAMPAÑA(0) POSICION(1) FALLA PUNTUAL(2) PERSONA REPORTA(3)
//           NUMERO TICKET(4) FECHA REALIZACION(5) PERSONA CREA TICKET(6)
//           FECHA CIERRE(7) OBSERVACIONES(8) RESPUESTA(9)
export async function fetchTickets(): Promise<TicketRecord[]> {
  const rows = await fetchSheet('ASIGNACION_TICKET');
  const result: TicketRecord[] = [];

  rows.forEach((row, i) => {
    if (!row?.c?.length) return;
    const campana = cell(row, 0);
    // Descarta fila vacía o encabezado que gviz devuelve por error en hojas vacías
    if (!campana || campana.toUpperCase() === 'CAMPAÑA' || campana.toUpperCase() === 'CAMPANA') return;
    // Con headers=1, la fila i del gviz corresponde a la fila i+2 del sheet (fila 1 = encabezados)
    result.push({
      rowIndex: i + 2,
      campana,
      posicion: cell(row, 1),
      fallaPuntual: cell(row, 2),
      personaReporta: cell(row, 3),
      numeroTicket: cell(row, 4),
      fechaRealizacion: cell(row, 5),
      personaCreaTicket: cell(row, 6),
      fechaCierre: cell(row, 7),
      observaciones: cell(row, 8),
      respuesta: cell(row, 9),
    });
  });
  console.log(`🎫 ASIGNACION_TICKET: ${result.length} tickets`);
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
      documento === '52829724' ||   // Diana Maritza Perderos
      documento === '1018509964'    // Sebastian Santos Polania
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

// ─── CRUD vía Apps Script ─────────────────────────────────────────────────────
async function gasPost(payload: object): Promise<{ result?: string; error?: string; [key: string]: unknown }> {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let parsed: { result?: string; error?: string; [key: string]: unknown };

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(text || 'Respuesta inválida del Apps Script');
  }

  if (!response.ok) {
    throw new Error(parsed.error || `Error HTTP ${response.status}`);
  }

  if (parsed.result === 'error') {
    throw new Error(parsed.error || 'Error en Apps Script');
  }

  return parsed;
}

// ─── Sala CRUD ────────────────────────────────────────────────────────────────
export async function createSala(sala: Omit<SalaRecord, 'rowIndex'>): Promise<void> {
  await gasPost({ action: 'createSala', data: sala });
}
export async function updateSala(sala: SalaRecord): Promise<void> {
  await gasPost({ action: 'updateSala', rowIndex: sala.rowIndex, data: sala });
}
export async function deleteSala(rowIndex: number): Promise<void> {
  await gasPost({ action: 'deleteSala', rowIndex });
}

// ─── Asignación CRUD ──────────────────────────────────────────────────────────
export async function createAsignacion(a: Omit<AsignacionRecord, 'rowIndex'>): Promise<void> {
  await gasPost({ action: 'createAsignacion', data: a });
}
export async function updateAsignacion(a: AsignacionRecord): Promise<void> {
  await gasPost({ action: 'updateAsignacion', rowIndex: a.rowIndex, data: a });
}
export async function deleteAsignacion(rowIndex: number): Promise<void> {
  await gasPost({ action: 'deleteAsignacion', rowIndex });
}
export async function updateEstadoAsignacion(rowIndex: number, estado: string): Promise<void> {
  await gasPost({ action: 'updateEstadoAsignacion', rowIndex, estado });
}

// ─── Ticket CRUD ──────────────────────────────────────────────────────────────
export async function createTicket(t: Omit<TicketRecord, 'rowIndex'>): Promise<void> {
  await gasPost({ action: 'createTicket', data: t });
}
export async function updateTicket(t: TicketRecord): Promise<void> {
  await gasPost({ action: 'updateTicket', rowIndex: t.rowIndex, data: t });
}
/** Solo guarda la respuesta del admin — NO cierra el ticket (no toca fechaCierre) */
export async function respondTicket(ticket: TicketRecord, respuesta: string): Promise<void> {
  const data = {
    campana: ticket.campana,
    posicion: ticket.posicion,
    fallaPuntual: ticket.fallaPuntual,
    personaReporta: ticket.personaReporta,
    numeroTicket: ticket.numeroTicket,
    fechaRealizacion: ticket.fechaRealizacion,
    personaCreaTicket: ticket.personaCreaTicket,
    fechaCierre: ticket.fechaCierre,
    observaciones: ticket.observaciones,
    respuesta,
  };
  // updateTicket ya está desplegado; respondTicket puede no estarlo aún
  await gasPost({ action: 'updateTicket', rowIndex: ticket.rowIndex, numeroTicket: ticket.numeroTicket, data });
}
/** Cierra definitivamente el ticket (lo ejecuta otra área externa) */
export async function closeTicket(rowIndex: number, respuesta: string): Promise<void> {
  await gasPost({ action: 'closeTicket', rowIndex, respuesta });
}
