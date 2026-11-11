export function normalizarObservacion(observacion: string): string {
  const value = observacion.trim().toUpperCase();
  return value === 'NINGUNO' || value === 'NO' ? '' : value;
}
