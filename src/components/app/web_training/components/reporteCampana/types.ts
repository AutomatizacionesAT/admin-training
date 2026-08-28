import type { WTReportData } from "../../hooks/useWTReportData";
import type { TrainingRecord, EnviosServidoresRecord } from "../../utils/utils";
import type { EstadoServidorFilter } from "../EnviosServidoresReportDialog";

export type ActividadFilter = "ALL" | "ACTIVAS" | "INACTIVAS";

export interface UnifiedCampana {
  nombre: string;
  normalizedKey: string;
  usabilidadKey: string;
  isActiva: boolean;
  estadoServidor: EstadoServidorFilter;
  rawEstadoServidor: string;
  url: string;
  bases: string;
  coordinadores: string[];
  coordinadorPrincipal: string;
  industrias: string[];
  industriaPrincipal: string;
  direcciones: string[];
  direccionPrincipal: string;
  totalDesarrollos: number;
  desarrollos: TrainingRecord[];
  finalizados: number;
  enProceso: number;
  proyectados: number;
}

export interface WTReportCampProps {
  reportData: WTReportData;
  selectedCoordinador: string | null;
  onSelectCoordinador: (name: string | null) => void;
  data: TrainingRecord[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  selectedDireccion: string | null;
  setSelectedDireccion: (dir: string | null) => void;
  selectedCampana: string | null;
  setSelectedCampana: (campana: string | null) => void;
  availableYears: number[];
  availableDirecciones: string[];
  availableCampanas: string[];
  enviosServidores: EnviosServidoresRecord[];
}

export interface CoordinadorMetric {
  nombre: string;
  count: number;
}

export interface IndustriaMetric {
  nombre: string;
  count: number;
  porcentaje: string;
}

export interface ServerMetrics {
  enServidor: number;
  sinServidor: number;
  enMigracion: number;
  pctEnServidor: number;
  pctSinServidor: number;
  pctEnMigracion: number;
}

export interface ActividadCounts {
  activas: number;
  inactivas: number;
}
