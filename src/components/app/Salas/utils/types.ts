// ─── Catálogo de salas ────────────────────────────────────────────────────────
export interface SalaRecord {
  rowIndex: number;
  sede: string;
  sala: string;
  tipo: string;         // EXCLUSIVA | ROTATIVA
  capacidad: string;
  equipos: string;
  horario: string;      // 06:00 A 14:00 | 14:00 A 22:00
  tablero: string;      // SI | NO
  tv: string;           // SI | NO
}

// ─── Asignación de sala a formación ───────────────────────────────────────────
export interface AsignacionRecord {
  rowIndex: number;
  campana: string;
  req: string;
  sala: string;
  sede: string;
  formador: string;
  fechaInicial: string;
  fechaFin: string;
  horario: string;
  dPersonas: string;
  estadoAsignacion: string;  // PENDIENTE | APROBADO | RECHAZADO
  ticket: string;            // número de ticket si existe
  estadoTicket: string;      // ABIERTO | CERRADO
}

// ─── Ticket de asignación ─────────────────────────────────────────────────────
export interface TicketRecord {
  rowIndex: number;
  campana: string;
  posicion: string;          // posición que presenta el error
  fallaPuntual: string;
  personaReporta: string;
  numeroTicket: string;
  fechaRealizacion: string;
  personaCreaTicket: string;
  fechaCierre: string;
  observaciones: string;
  respuesta: string;
}

// ─── Admin de salas ───────────────────────────────────────────────────────────
export interface SalasAdminRecord {
  documento: string;
  nombre: string;
  cargo: string;
  rol: SalasRole;
}

export type SalasRole = 'SUPER_ADMIN' | 'COORDINADOR' | null;

export interface SalasUser {
  documento: string;
  nombre: string;
  cargo: string;
  rol: SalasRole;
}
