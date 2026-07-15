export interface AgileTrainingRow {
  campana: string;
  coordinador: string;
  industria: string;
  especializacionFormadores: string;
  formadorDeFormadores: string;
  ced: string;
  uAtento: string;
  redefinicionMallaFormacion: string;
  tipologiasParetoKpi: string;
  encuestaAsesor: string;
  mejoraEncuestaPostTraining: string;
  levantamientosCliente: string;
  migracionMalla: string;
  desarrolloDigital: string;
  herramientasDiferenciales: string;
  metodologiasObjetivos: string;
  piloto: string;
  pptLanzamiento: string;
  graduacionOjt: string;
  resultados: string;
  avance: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: string;
  meta: string;
  cumplimiento: string;
  insignia: string;
  estado: string;
  notas: string;
  especializacionFormadoresPct: number;
  redefinicionMallaFormacionPct: number;
  desarrolloDigitalPct: number;
  pilotoPct: number;
  avancePct: number;
  metaPct: number;
  cumplimientoPct: number;
  duracionDias: number;
  fechaInicioISO: string;
  fechaFinISO: string;
}

export interface AgileTrainingKpis {
  totalCampanas: number;
  promedioAvance: number;
  promedioMeta: number;
  promedioPiloto: number;
  promedioCumplimiento: number;
}

export type AgileSortField = 'campana' | 'coordinador' | 'industria' | 'avancePct' | 'pilotoPct' | 'cumplimientoPct' | 'fechaFinISO';
export type AgileSortOrder = 'asc' | 'desc';
