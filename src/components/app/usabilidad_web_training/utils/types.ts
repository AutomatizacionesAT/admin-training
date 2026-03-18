export interface ParsedRow {
  campana: string;
  modulo: string;
  usuario: string;
  dateISO: string; // YYYY-MM-DD
}

export interface CampaignReport {
  id: string;
  coordinador: string;
  campana: string;
  totalRacs: number;
  diasHabilesMes: number;
  diasHabilesSemana: number;
  totalIngresosRegistros: number;
}

export interface ManualOverrides {
  [cardKey: string]: Partial<CampaignReport>;
}

export interface DailyBreakdown {
  date: string;
  usuarios: string[];
  count: number;
}

export interface GlobalKpis {
  racs: number;
  ingresosMes: number;
  ingresosSemana: number;
  registros: number;
  globalPercentage: number;
}
