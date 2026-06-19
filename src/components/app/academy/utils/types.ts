export type AcademySheetKey = 'formacionInicial' | 'formacionContinua';

export interface AcademyRow {
  industria: string;
  direccion: string;
  campana: string;
  coordinador: string;
  backupRaw: string;
  migracionRaw: string;
  backupPct: number | null;
  migracionPct: number | null;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioISO: string;
  fechaFinISO: string;
  duracion: string;
  duracionDias: number | null;
  estado: string;
  notas: string;
}

export interface AcademyKpis {
  totalCampanas: number;
  promedioBackup: number | null;
  promedioMigracion: number | null;
  backupCompletado: number;
  migracionCompletada: number;
}

export interface PieSlice {
  label: string;
  count: number;
  color: string;
}

export type AcademySortField = 'campana' | 'coordinador' | 'industria' | 'backupPct' | 'migracionPct' | 'fechaFinISO';
export type AcademySortOrder = 'asc' | 'desc';
