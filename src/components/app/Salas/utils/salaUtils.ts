import type { SalaRecord } from './types';

export const HORARIO_MANANA = '06:00 A 14:00';
export const HORARIO_TARDE = '14:00 A 22:00';

export function isTurnoAM(horario: string) {
  const h = (horario || '').toUpperCase();
  return !h.startsWith('14') && !h.startsWith('15') && !h.startsWith('16');
}

export interface SalaTurnoInfo {
  label: 'Mañana' | 'Tarde';
  horario: string;
  capacidad: string;
  equipos: string;
}

/** Todas las sedes operan mañana y tarde — une registros AM/PM del catálogo */
export function getSalaTurnos(salaName: string, salas: SalaRecord[]): SalaTurnoInfo[] {
  const matches = salas.filter(s => s.sala === salaName);
  const am = matches.find(s => isTurnoAM(s.horario));
  const pm = matches.find(s => !isTurnoAM(s.horario));
  const base = am || pm || matches[0];

  return [
    {
      label: 'Mañana',
      horario: am?.horario || HORARIO_MANANA,
      capacidad: am?.capacidad || base?.capacidad || '—',
      equipos: am?.equipos || base?.equipos || '—',
    },
    {
      label: 'Tarde',
      horario: pm?.horario || HORARIO_TARDE,
      capacidad: pm?.capacidad || base?.capacidad || '—',
      equipos: pm?.equipos || base?.equipos || '—',
    },
  ];
}
