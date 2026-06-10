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
  formador: string;     // cedula o nombre del coordinador
  fechaInicial: string;
  fechaFin: string;
  horario: string;
  dPersonas: string;
}

// ─── Admin de salas (quien puede loguearse) ───────────────────────────────────
export interface SalasAdminRecord {
  documento: string;    // cédula
  nombre: string;
  cargo: string;
  rol: SalasRole;       // derivado del cargo o campo extra
}

export type SalasRole = 'SUPER_ADMIN' | 'COORDINADOR' | null;

export interface SalasUser {
  documento: string;
  nombre: string;
  cargo: string;
  rol: SalasRole;
}
