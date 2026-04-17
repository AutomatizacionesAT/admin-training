export interface BiometricRow {
  dia: string;
  semana: string;
  cc: string;
  colaborador: string;
  ingreso: string;
  salida: string;
  horasDiarias: string; // formato texto "9:07:21"
  horasDecimal: number; // convertido a decimal 9.12
  observacion: string;
  dateISO: string; // YYYY-MM-DD
}

export interface ColaboradorSummary {
  colaborador: string;
  cc: string;
  diasRegistrados: number;
  diasTrabajados: number;
  llegadasTarde: number;
  ausencias: number;
  totalHoras: number;
  promedioHoras: number;
  observaciones: string[];
}

export interface BiometricKpis {
  totalColaboradores: number;
  totalRegistros: number;
  totalLlegadasTarde: number;
  totalAusencias: number;
  promedioHorasDiarias: number;
  totalHorasTrabajadas: number;
}

export type SortField = 'colaborador' | 'cc' | 'dateISO' | 'ingreso' | 'salida' | 'horasDecimal' | 'observacion' | 'semana';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'tabla' | 'resumen';
