interface SheetCell {
  v: string | number | null;
  f?: string;
}

interface SheetRow {
  c: (SheetCell | null)[];
}

interface SheetColumn {
  label: string;
  type: string;
}

interface SheetData {
  table: {
    rows: SheetRow[];
    cols: SheetColumn[];
  };
}

// Tipo para los datos de Simulator (Base_SM)
export interface TrainingRecord {
  id?: string | null;
  direccion: string | null;
  industria: string | null;
  campana: string | null;
  coordinador: string | null;
  aplicativo: string | null;
  nombreProceso: string | null;
  estado: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaReal: string | null;
  desarrollador: string | null;
  notas: string | null;
  rowIndex?: number;
}

export interface FestivoRecord {
  festivo: string | null;
  festividad: string | null;
}

export interface NovedadesRecord {
  desarrollador: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  novedad: string | null;
}

// Helper para normalizar fechas de Google Viz "Date(y,m,d)" a "DD/MM/YYYY"
export const normalizeGvizDate = (value: string | null): string | null => {
  if (!value) return null;

  // Si viene con formato Date(y,m,d)
  if (typeof value === "string" && value.includes("Date(")) {
    const match = value.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const year = match[1];
      const month = parseInt(match[2], 10) + 1; // Gviz usa meses 0-based
      const day = match[3];
      const m = month < 10 ? `0${month}` : month;
      const d = parseInt(day, 10) < 10 ? `0${day}` : day;
      return `${d}/${m}/${year}`;
    }
  }

  // Si viene YYYY-MM-DD (ISO), convertir a DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, dayPart] = value.split("-");
    const day = dayPart.substring(0, 2);
    return `${day}/${month}/${year}`;
  }

  // Si ya es DD/MM/YYYY o DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(value)) {
    const parts = value.split(/[\/\-]/);
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    return `${d}/${m}/${parts[2]}`;
  }

  return value;
};

// Helper para parsear fechas string (DD/MM/YYYY o ISO) a Date object
export const parseDateString = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;

  // Si viene Date(y,m,d)
  if (dateStr.includes("Date(")) {
    const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      return new Date(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
    }
  }

  // Si es DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  // Si es ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

export interface DeliveryCompliance {
  status: "on_time" | "delayed" | "in_progress" | "pending_delayed" | "not_started" | "no_data";
  label: string;
  diffDays: number;
  badgeClass: string;
  dotColor: string;
  description: string;
  hasRealDate: boolean;
}

export const getDeliveryCompliance = (record: TrainingRecord): DeliveryCompliance => {
  const fechaFin = parseDateString(record.fechaFin);
  const fechaReal = parseDateString(record.fechaReal);
  const estado = (record.estado || "").toLowerCase().trim();

  // Caso 1: Tiene fecha real de entrega registrada
  if (fechaReal && fechaFin) {
    const finTime = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate()).getTime();
    const realTime = new Date(fechaReal.getFullYear(), fechaReal.getMonth(), fechaReal.getDate()).getTime();
    const diffDays = Math.round((realTime - finTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        status: "on_time",
        label: diffDays === 0 ? "A Tiempo" : `${Math.abs(diffDays)}d Anticipado`,
        diffDays,
        badgeClass: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 font-semibold",
        dotColor: "bg-emerald-500",
        description: diffDays === 0 ? "Entregado exactamente en la fecha límite" : `Entregado ${Math.abs(diffDays)} día(s) antes del límite`,
        hasRealDate: true,
      };
    } else {
      return {
        status: "delayed",
        label: `+${diffDays}d Retraso`,
        diffDays,
        badgeClass: "bg-rose-100 text-rose-800 ring-1 ring-rose-300 font-bold",
        dotColor: "bg-rose-500",
        description: `Entregado con ${diffDays} día(s) de retraso respecto a la fecha pactada`,
        hasRealDate: true,
      };
    }
  }

  // Caso 2: Finalizado pero sin fecha real registrada
  if (estado.includes("finaliz") || estado.includes("entreg") || estado.includes("complet")) {
    return {
      status: "on_time",
      label: "Finalizado",
      diffDays: 0,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 font-semibold",
      dotColor: "bg-emerald-400",
      description: "Desarrollo concluido satisfactoriamente",
      hasRealDate: false,
    };
  }

  // Caso 3: En proceso o sin iniciar -> evaluar si ya venció
  if (fechaFin) {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const finMidnight = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate()).getTime();
    const diffDays = Math.round((todayMidnight - finMidnight) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        status: "pending_delayed",
        label: `+${diffDays}d Vencido`,
        diffDays,
        badgeClass: "bg-amber-100 text-amber-900 ring-1 ring-amber-300 font-bold",
        dotColor: "bg-amber-500",
        description: `Plazo de entrega superado por ${diffDays} día(s) sin entrega`,
        hasRealDate: false,
      };
    } else {
      return {
        status: "in_progress",
        label: "En Plazo",
        diffDays,
        badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 font-semibold",
        dotColor: "bg-blue-500",
        description: `En desarrollo (${Math.abs(diffDays)} días restantes)`,
        hasRealDate: false,
      };
    }
  }

  return {
    status: "no_data",
    label: "Sin Fechas",
    diffDays: 0,
    badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    dotColor: "bg-slate-400",
    description: "Sin fechas registradas",
    hasRealDate: false,
  };
};

export interface SLAStats {
  totalEvaluated: number;
  onTimeCount: number;
  delayedCount: number;
  pendingDelayedCount: number;
  complianceRate: number;
}

export const calculateSLAStats = (records: TrainingRecord[]): SLAStats => {
  let onTime = 0;
  let delayed = 0;
  let pendingDelayed = 0;

  records.forEach((r) => {
    const comp = getDeliveryCompliance(r);
    if (comp.status === "on_time") {
      onTime++;
    } else if (comp.status === "delayed") {
      delayed++;
    } else if (comp.status === "pending_delayed") {
      pendingDelayed++;
    }
  });

  const totalFinished = onTime + delayed;
  const rate = totalFinished > 0 ? Math.round((onTime / totalFinished) * 1000) / 10 : 100;

  return {
    totalEvaluated: totalFinished,
    onTimeCount: onTime,
    delayedCount: delayed,
    pendingDelayedCount: pendingDelayed,
    complianceRate: rate,
  };
};

export const fetchGoogleSheetData = async (): Promise<TrainingRecord[]> => {
  try {
    const sheetId = "13aPSr-knf8vEiLWPTlZgcKJWd4H5iBsEb_4wJZgD0lo";
    const smSheetName = encodeURIComponent("Base_SM (1)");
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${smSheetName}&gid=1480937439`;

    const response = await fetch(url);
    const text = await response.text();

    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      const rows = data.table.rows;

      const formattedData: TrainingRecord[] = [];
      rows.forEach((row: SheetRow, index: number) => {
        if (!row || !row.c) return;
        const campana = row.c[3] ? String(row.c[3].v).trim() : null;
        const aplicativo = row.c[5] ? String(row.c[5].v).trim() : null;
        const nombreProceso = row.c[6] ? String(row.c[6].v).trim() : null;

        if (!campana && !aplicativo && !nombreProceso) return;

        formattedData.push({
          rowIndex: index + 2,
          id: row.c[0] ? String(row.c[0].v) : null,
          industria: row.c[1] ? String(row.c[1].v).trim() : null,
          direccion: row.c[2] ? String(row.c[2].v).trim() : null,
          campana,
          coordinador: row.c[4] ? String(row.c[4].v).trim() : null,
          aplicativo,
          nombreProceso,
          estado: row.c[7] ? String(row.c[7].v).trim() : null,
          fechaInicio: normalizeGvizDate(row.c[8] ? String(row.c[8].v) : null),
          fechaFin: normalizeGvizDate(row.c[9] ? String(row.c[9].v) : null),
          fechaReal: normalizeGvizDate(row.c[10] ? String(row.c[10].v) : null),
          desarrollador: row.c[11] ? String(row.c[11].v).trim() : null,
          notas: row.c[12] ? String(row.c[12].v).trim() : null,
        });
      });

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    return [];
  }
};

export const fetchSheetFestivosData = async (): Promise<FestivoRecord[]> => {
  try {
    const sheetId = "13aPSr-knf8vEiLWPTlZgcKJWd4H5iBsEb_4wJZgD0lo";
    const masterSheetName = encodeURIComponent("DATA (4)");
    // Try DATA (4), fallback to DATA
    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${masterSheetName}`;
    let response = await fetch(url);
    if (!response.ok) {
      url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=DATA`;
      response = await fetch(url);
    }
    const text = await response.text();
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      const rows = data.table.rows;

      const formattedData: FestivoRecord[] = [];
      rows.forEach((row: SheetRow) => {
        if (!row || !row.c) return;
        const festivoVal = row.c[3] ? normalizeGvizDate(String(row.c[3].v)) : null;
        const festividadVal = row.c[4] ? String(row.c[4].v) : null;
        if (!festivoVal) return;
        formattedData.push({
          festivo: festivoVal,
          festividad: festividadVal,
        });
      });

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar festivos:", error);
    return [];
  }
};

export const fetchSheetNovedades = async (): Promise<NovedadesRecord[]> => {
  try {
    const sheetId = "13aPSr-knf8vEiLWPTlZgcKJWd4H5iBsEb_4wJZgD0lo";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Novedades`;
    const response = await fetch(url);
    const text = await response.text();
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      const rows = data.table.rows;

      const formattedData: NovedadesRecord[] = [];
      rows.forEach((row: SheetRow) => {
        if (!row || !row.c) return;
        const dev = row.c[0] ? String(row.c[0].v).trim() : null;
        const fInicio = normalizeGvizDate(row.c[1] ? String(row.c[1].v) : null);
        const fFin = normalizeGvizDate(row.c[2] ? String(row.c[2].v) : null);
        const nov = row.c[3] ? String(row.c[3].v).trim() : null;
        if (!dev || !fInicio) return;
        formattedData.push({
          desarrollador: dev,
          fechaInicio: fInicio,
          fechaFin: fFin,
          novedad: nov,
        });
      });

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar novedades:", error);
    return [];
  }
};
