export const TRAINING_API_URL = 'https://script.google.com/macros/s/AKfycbwdFsr66DKvGBm9JiiBV0ieKhr-VVLj2jHcMyvHP-iaXnIR-o0MiTtJe9_uqFgpqPKQTg/exec';

let sessionToken: string | null = null;
const pendingReads = new Map<string, Promise<TrainingSheet>>();

export function setTrainingSessionToken(token: string | null): void {
  sessionToken = token;
  pendingReads.clear();
}

export function getTrainingSessionToken(): string | null {
  return sessionToken;
}

export async function trainingRequest<T extends object = Record<string, unknown>>(
  payload: Record<string, unknown>,
  authenticated = true,
  endpoint = TRAINING_API_URL,
): Promise<T> {
  const token = sessionToken;
  if (authenticated && !token) throw new Error('Inicia sesión para consultar o modificar los datos.');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, ...(authenticated ? { sessionToken: token } : {}) }),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Respuesta inválida de Apps Script. Verifica que la implementación permita acceso a cualquier usuario.');
  }
  // No entregar datos de una sesión que se cerró mientras se esperaba la respuesta.
  if (authenticated && token !== sessionToken) throw new Error('La sesión cambió. Vuelve a consultar los datos.');
  if (!response.ok || result?.result !== 'success') {
    throw new Error(result?.error || `No se pudo completar la operación (${response.status}).`);
  }
  return result as T;
}

export interface TrainingSheetRow {
  rowIndex: number;
  c: ({ v: string | number | null; f?: string } | null)[];
}

export interface TrainingSheet {
  table: {
    rows: TrainingSheetRow[];
    cols: { label: string; type: string }[];
  };
}

interface SheetResponse {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  displayRows: string[][];
  rowIndices: number[];
}

// Adaptador de las celdas del servidor para conservar los mapeos de cada módulo.
export function fetchTrainingSheet(sheet: string, endpoint = TRAINING_API_URL): Promise<TrainingSheet> {
  const key = `${endpoint}:${sessionToken}:${sheet}`;
  const existing = pendingReads.get(key);
  if (existing) return existing;
  const request = trainingRequest<SheetResponse>({ action: 'readSheet', sheet }, true, endpoint).then(result => {
    if (!Array.isArray(result.rows) || !Array.isArray(result.headers) ||
        !Array.isArray(result.displayRows) || !Array.isArray(result.rowIndices) ||
        result.rows.length !== result.rowIndices.length ||
        result.rows.some((row, index) => !Array.isArray(row) ||
          !Number.isInteger(result.rowIndices[index]) || result.rowIndices[index] < 2)) {
      throw new Error(`Respuesta inválida al consultar ${sheet}.`);
    }
    return {
      table: {
        cols: result.headers.map(label => ({ label, type: 'string' })),
        rows: result.rows.map((row, index) => ({
          rowIndex: result.rowIndices[index],
          c: row.map((value, column) => value === null || value === '' ? null : {
            v: typeof value === 'boolean' ? String(value) : value,
            f: result.displayRows[index]?.[column],
          }),
        })),
      },
    };
  }).finally(() => {
    if (pendingReads.get(key) === request) pendingReads.delete(key);
  });
  pendingReads.set(key, request);
  return request;
}
