import type { EstadoServidorFilter } from "../EnviosServidoresReportDialog";

export function normalizarCampana(valor?: string | null): string {
  if (!valor) return "";
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function normalizeEstadoServidor(value?: string | null): EstadoServidorFilter {
  if (!value) return "NO";
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (["SI", "TRUE", "VERDADERO", "1", "EN SERVIDOR"].includes(normalized)) return "SI";
  if (["NO", "FALSE", "FALSO", "0", "SIN SERVIDOR"].includes(normalized)) return "NO";
  if (normalized.includes("MIGRACION")) return "MIGRACION";
  return "NO";
}
