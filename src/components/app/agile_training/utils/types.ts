export interface AgileTrainingRow {
  campana: string;
  coordinador: string;
  industria: string;
  tercio1: string;
  formadorDeFormadores: string;
  ced: string;
  uAtento: string;
  tercio2: string;
  tipologiasParetoKpi: string;
  encuestaAsesor: string;
  mejoraEncuestaPostTraining: string;
  levantamientosCliente: string;
  migracionMalla: string;
  tercio3: string;
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
  tercio1Pct: number;
  tercio2Pct: number;
  tercio3Pct: number;
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
  promedioPiloto: number;
  promedioCumplimiento: number;
  finalizadas: number;
  enProgreso: number;
  novedad: number;
  pausado: number;
}

export type AgileSortField = 'campana' | 'coordinador' | 'industria' | 'avancePct' | 'pilotoPct' | 'cumplimientoPct' | 'fechaFinISO';
export type AgileSortOrder = 'asc' | 'desc';
