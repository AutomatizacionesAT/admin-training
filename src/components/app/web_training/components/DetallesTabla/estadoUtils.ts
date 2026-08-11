export function normalizeFilterValue(value?: string | null): string {
  return value?.trim().toUpperCase() ?? ""
}

export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]
export type EstadoKind = "final" | "proceso" | "proyectado"

export function getEstadoKind(estado?: string): EstadoKind {
  const s = estado?.trim().toUpperCase() ?? ""
  if (s === "FINALIZADA" || s === "COMPLETADO" || s === "FINALIZADO" || s === "ENTREGADO") return "final"
  if (s === "EN PROCESO" || s === "EN CURSO") return "proceso"
  return "proyectado"
}

export function getEstadoLabel(kind: EstadoKind): string {
  switch (kind) {
    case "final":
      return "Finalizado"
    case "proceso":
      return "En proceso"
    default:
      return "Proyectado"
  }
}

export function getEstadoRowClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-50 hover:bg-emerald-50/80"
    case "proceso":
      return "bg-amber-50 hover:bg-amber-50/80"
    default:
      return "bg-slate-50 hover:bg-slate-100/70"
  }
}

export function getEstadoAccentClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-400"
    case "proceso":
      return "bg-amber-400"
    default:
      return "bg-slate-300"
  }
}

export function getEstadoBadgeClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-100/80 text-emerald-800 ring-1 ring-inset ring-emerald-200"
    case "proceso":
      return "bg-amber-100/80 text-amber-800 ring-1 ring-inset ring-amber-200"
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
  }
}

export function getEstadoDotClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-500"
    case "proceso":
      return "bg-amber-500"
    default:
      return "bg-slate-400"
  }
}