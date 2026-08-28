// ============================================================
//  COHORTS — Data Layer
//  Sheet ID: 1tNoQKiSxqRrVMVo-SZ2ttVsYUNBO-WMuvTQYf7KnqkY
//  Para agregar un nuevo coordinador, añadí su nombre exacto
//  (tal como aparece en la pestaña del Sheet) al array
//  COHORT_SHEETS al final de este archivo.
// ============================================================

const SHEET_ID = "1tNoQKiSxqRrVMVo-SZ2ttVsYUNBO-WMuvTQYf7KnqkY";

// ── Tipos ────────────────────────────────────────────────────

interface GvizCell {
  v: string | number | null;
  f?: string;
}

interface GvizRow {
  c: (GvizCell | null)[];
}

interface GvizTable {
  table: {
    cols: { label: string; type: string }[];
    rows: GvizRow[];
  };
}

export interface CohortRecord {
  // Identificación
  anio: number | null;               // [0] AÑO
  mes: string | null;                // [1] MES  (Date -> DD/MM/YYYY)
  req: string | null;                // [2] REQ
  direccion: string | null;          // [3] DIRECCIÓN
  campana: string | null;            // [4] CAMPAÑA
  segmento: string | null;           // [5] SEGMENTO
  nombre: string | null;             // [6] NOMBRE
  documento: string | null;          // [7] DOCUMENTO
  indicador: string | null;          // [8] INDICADOR
  referencia: string | null;         // [9] REFERENCIA
  formato: string | null;            // [10] FORMATO

  // OJT
  metaOjt: number | null;            // [11]
  resultadoOjt: number | null;       // [12]
  cumplimientoOjt: number | null;    // [13]

  // Semana 1
  metaS1: number | null;             // [14]
  resultadoS1: number | null;        // [15]
  cumplimientoS1: number | null;     // [16]

  // Semana 2
  metaS2: number | null;             // [17]
  resultadoS2: number | null;        // [18]
  cumplimientoS2: number | null;     // [19]

  // Semana 3
  metaS3: number | null;             // [20]
  resultadoS3: number | null;        // [21]
  cumplimientoS3: number | null;     // [22]

  // Semana 4
  metaS4: number | null;             // [23]
  resultadoS4: number | null;        // [24]
  cumplimientoS4: number | null;     // [25]

  // Cierre
  metaCierre: number | null;         // [26]
  resultadoCierre: number | null;    // [27]
  cumplimientoCierre: number | null; // [28]

  // Extra
  observacion: string | null;        // [29]
  formador: string | null;           // [30]
  coordinador: string | null;        // [31]
  cumplimiento70: number | null;     // [32] CUMPLIMIENTO >= 70%

  // Interno
  sheetName: string;
  rowIndex: number;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Normaliza el campo MES que viene de gviz.
 * - v = Date(2026,0,1)  → internamente guardamos "01/01/2026" (DD/MM/YYYY)
 * - f = "01. enero"     → lo usamos solo para display en mesLabel()
 * También acepta ISO YYYY-MM-DD como fallback.
 */
const normalizeGvizDate = (value: string | number | null): string | null => {
  if (value === null || value === undefined) return null;
  const s = String(value);
  if (s.includes("Date(")) {
    const m = s.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (m) {
      const y = m[1];
      // gviz usa meses 0-based: 0 = enero
      const mo = (parseInt(m[2]) + 1).toString().padStart(2, "0");
      const d = m[3].padStart(2, "0");
      return `${d}/${mo}/${y}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, d] = s.split("-");
    return `${d}/${mo}/${y}`;
  }
  // Puede venir el formato formateado "01. enero" directamente — lo guardamos tal cual
  return s || null;
};

const toNum = (cell: GvizCell | null | undefined): number | null => {
  if (!cell || cell.v === null || cell.v === undefined) return null;
  const n = Number(cell.v);
  return isNaN(n) ? null : n;
};

const toStr = (cell: GvizCell | null | undefined): string | null => {
  if (!cell || cell.v === null || cell.v === undefined) return null;
  const s = String(cell.v).trim();
  return s === "" ? null : s;
};

// ── Fetch de una hoja ────────────────────────────────────────

const fetchSheet = async (sheetName: string): Promise<CohortRecord[]> => {
  const encoded = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encoded}`;
  const response = await fetch(url);
  const text = await response.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
  if (!match?.[1]) {
    console.warn(`[COHORTS] No se pudo parsear la hoja: ${sheetName}`);
    return [];
  }
  const data: GvizTable = JSON.parse(match[1]);
  return data.table.rows.map((row, idx): CohortRecord => {
    const c = row.c;
    return {
      anio: toNum(c[0]),
      mes: normalizeGvizDate(c[1]?.v ?? null),
      req: toStr(c[2]),
      direccion: toStr(c[3]),
      campana: toStr(c[4]),
      segmento: toStr(c[5]),
      nombre: toStr(c[6]),
      documento: c[7] ? String(c[7].v ?? "").trim() || null : null,
      indicador: toStr(c[8]),
      referencia: toStr(c[9]),
      formato: toStr(c[10]),
      metaOjt: toNum(c[11]),
      resultadoOjt: toNum(c[12]),
      cumplimientoOjt: toNum(c[13]),
      metaS1: toNum(c[14]),
      resultadoS1: toNum(c[15]),
      cumplimientoS1: toNum(c[16]),
      metaS2: toNum(c[17]),
      resultadoS2: toNum(c[18]),
      cumplimientoS2: toNum(c[19]),
      metaS3: toNum(c[20]),
      resultadoS3: toNum(c[21]),
      cumplimientoS3: toNum(c[22]),
      metaS4: toNum(c[23]),
      resultadoS4: toNum(c[24]),
      cumplimientoS4: toNum(c[25]),
      metaCierre: toNum(c[26]),
      resultadoCierre: toNum(c[27]),
      cumplimientoCierre: toNum(c[28]),
      observacion: toStr(c[29]),
      formador: toStr(c[30]),
      coordinador: toStr(c[31]),
      cumplimiento70: toNum(c[32]),
      sheetName,
      rowIndex: idx + 2,
    };
  });
};

// ── Lista de coordinadores ── agregar aquí nuevos ─────────────

// ── Lista completa de hojas de coordinadores en Google Sheets
export const COHORT_SHEETS: string[] = [
  "Jenny Carolina",
  "Jhon Eyder",
  "Cristian Camilo",
  "Jerson Lorena",
  "Jeimmy Lorena",
  "Jhenny Alexander",
  "Jhonny Alexander",
  "Michael David",
  "Michael Daniel",
  "Olga Lucia",
  "Walter Duvan",
  "Walther Duvan",
  "Yanny Vanesa",
  "Yenny Vanessa",
  "Gladys Liliana",
  "Karol Ferreira",
  "Fernando Andres",
  "Deisy Carolina",
  "Marcia Johana",
];

// ── Matcher entre el usuario de AuthContext y las hojas de Cohortes ─────────
export const matchCoordinatorName = (
  userNombre: string | null | undefined,
  availableCoordinadores: string[]
): string | null => {
  if (!userNombre) return null;

  const normUser = userNombre
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const userWords = normUser.split(/\s+/).filter(Boolean);

  for (const coord of availableCoordinadores) {
    const normCoord = coord
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    // 1. Coincidencia exacta o contenida
    if (normUser === normCoord || normUser.includes(normCoord) || normCoord.includes(normUser)) {
      return coord;
    }

    // 2. Coincidencia por los dos primeros nombres (ej. "JENNY CAROLINA")
    if (userWords.length >= 2) {
      const firstTwo = `${userWords[0]} ${userWords[1]}`;
      if (normCoord.includes(firstTwo) || firstTwo.includes(normCoord)) {
        return coord;
      }
    }

    // 3. Coincidencia por primer nombre + inicio
    if (userWords.length >= 1 && normCoord.startsWith(userWords[0])) {
      return coord;
    }
  }

  // Fallback: si no está en la lista pero hay nombres parecidos en COHORT_SHEETS
  for (const coord of COHORT_SHEETS) {
    const normCoord = coord
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (userWords.length >= 2) {
      const firstTwo = `${userWords[0]} ${userWords[1]}`;
      if (normCoord.includes(firstTwo) || firstTwo.includes(normCoord)) {
        return coord;
      }
    }
  }

  return null;
};

// ── Fetch principal ──────────────────────────────────────────

export const fetchAllCohortData = async (): Promise<CohortRecord[]> => {
  const results = await Promise.allSettled(
    COHORT_SHEETS.map((name) => fetchSheet(name))
  );
  const all: CohortRecord[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    } else {
      console.warn(`[COHORTS] Hoja no disponible o sin acceso "${COHORT_SHEETS[i]}":`, result.reason);
    }
  });
  return all;
};

// ── Utilidades de formato y semáforo ─────────────────────────

export type CumplimientoColor = "green" | "yellow" | "red" | "gray";

/** El sheet guarda 1.0 = 100%, 0.75 = 75%. Devuelve 0–100. */
export const toPct = (v: number | null): number | null => {
  if (v === null) return null;
  // Fracción (−2 a 2): multiplicar x100
  if (Math.abs(v) <= 2) return Math.round(v * 100);
  // Ya viene como entero (100, 75…)
  return Math.round(v);
};

export const formatPct = (v: number | null): string => {
  const p = toPct(v);
  return p === null ? "—" : `${p}%`;
};

export const formatNum = (v: number | null): string =>
  v === null ? "—" : v.toLocaleString("es-CO");

export const semaforo = (v: number | null): CumplimientoColor => {
  if (v === null) return "gray";
  const p = toPct(v) ?? v;
  if (p >= 90) return "green";
  if (p >= 70) return "yellow";
  return "red";
};

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

/**
 * Devuelve el nombre del mes dado el campo `mes` almacenado como DD/MM/YYYY.
 * Si el valor ya viene con texto (ej "01. enero"), lo retorna limpio.
 */
export const mesLabel = (mes: string | null): string => {
  if (!mes) return "—";
  // DD/MM/YYYY → extraer mes
  const parts = mes.split("/");
  if (parts.length === 3) {
    const m = parseInt(parts[1]) - 1;
    return MESES[m] ?? mes;
  }
  // "01. enero" o similar → devolver tal cual sin número
  return mes.replace(/^\d+\.\s*/, "");
};

/**
 * Devuelve el número de mes (1–12) dado el campo `mes` almacenado como DD/MM/YYYY.
 */
export const mesNumero = (mes: string | null): number => {
  if (!mes) return 0;
  const parts = mes.split("/");
  if (parts.length === 3) return parseInt(parts[1]);
  return 0;
};
