import type { ParsedRow } from './types';
import { parseDateToISO } from './calculations';
import { fetchTrainingSheet, trainingRequest } from '@/lib/trainingApi';
import type { TrainingSheetRow as GvizRow } from '@/lib/trainingApi';

const SHEET_NAME = 'CONTROL_DE_ACCESOS';

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
    const data = await fetchTrainingSheet(SHEET_NAME);
    const rows = data.table.rows;

    const parsed: ParsedRow[] = [];

    let dateLogCount = 0; // Log primeras 5 fechas para diagnóstico

    rows.forEach((row: GvizRow) => {
      const rawCamp = row.c[3]?.v;   // Col D: CAMPAÑA
      const rawModul = row.c[5]?.v;   // Col F: MODULO
      const rawUser = row.c[2]?.v;   // Col C: USUARIO
      const dateCell = row.c[1];      // Col B: FECHA CREACION

      const camp = rawCamp ? String(rawCamp).trim() : '';
      const modul = rawModul ? String(rawModul).trim() : '';
      const user = rawUser ? String(rawUser).trim() : '';

      // Excluir registros cuyo MODULO contenga "Movilidad"
      if (modul.toUpperCase().includes('MOVILIDAD')) return;

      // Requerir campaña, módulo y fecha
      if (!camp || !modul || !dateCell?.v) return;

      // Diagnóstico: loggear el formato de fecha raw
      if (dateLogCount < 5) {
        console.log(`📅 Fecha raw [v=${JSON.stringify(dateCell.v)}, f=${JSON.stringify(dateCell.f)}]`);
        dateLogCount++;
      }

      // Usar el valor ISO del servidor, no el texto visible dependiente del locale.
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
 * Carga la lista de coordinadores desde la hoja "DATA (4)" (Columna G = índice 6)
 */
export async function fetchCoordinadores(): Promise<string[]> {
  try {
    const data = await fetchTrainingSheet('DATA (4)');
    const coordinadores = new Set<string>();

    data.table.rows.forEach((row: GvizRow) => {
      if (row.c[6]?.v) {
        coordinadores.add(String(row.c[6].v).trim());
      }
    });

    return Array.from(coordinadores).sort();
  } catch (error) {
    console.error('Error al cargar coordinadores:', error);
    throw error;
  }
}

/**
 * Carga la configuración guardada mediante POST autenticado.
 */
export async function fetchUserConfig(): Promise<Record<string, string>> {
  try {
    const result = await trainingRequest<{ config: Record<string, string> }>({ action: 'getConfig' });
    return result.config;
  } catch (error) {
    console.error('No se pudo cargar la configuración.', error);
    throw error;
  }
}

/**
 * Guarda la configuración en Google Sheets mediante el Apps Script
 */
export async function saveUserConfig(configData: string[][]): Promise<boolean> {
  try {
    const payload = {
      action: 'saveConfig',
      configData: configData,
    };

    await trainingRequest(payload);
    return true;
  } catch (error) {
    console.error("Error al guardar la configuración:", error);
    return false;
  }
}
