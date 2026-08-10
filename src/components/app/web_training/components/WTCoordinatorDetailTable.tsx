import type { TrainingRecord } from "../utils/utils"
import { parseDateString } from "../utils/utils"
import { ClipboardList } from 'lucide-react';

interface WTCoordinatorDetailTableProps {
  data: TrainingRecord[]
  selectedCoordinador?: string | null
  selectedYear?: number
  selectedMonth?: number | null
  selectedDireccion?: string | null
  selectedCampana?: string | null
}

function normalizeFilterValue(value?: string | null): string {
  return value?.trim().toUpperCase() ?? ""
}

const MONTHS = [
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

/* ---------- helpers de estado (mismos criterios que ya tenías) ---------- */

type EstadoKind = "final" | "proceso" | "proyectado"

function getEstadoKind(estado?: string): EstadoKind {
  const s = estado?.trim().toUpperCase() ?? ""
  if (s === "FINALIZADA" || s === "COMPLETADO" || s === "FINALIZADO" || s === "ENTREGADO") return "final"
  if (s === "EN PROCESO" || s === "EN CURSO") return "proceso"
  return "proyectado"
}

/** color de fondo cálido de TODA la fila, según el estado */
function getEstadoRowClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-50 hover:bg-emerald-50/80"
    case "proceso":
      return "bg-amber-50 hover:bg-amber-50/80"
    default:
      return "bg-slate-50 hover:bg-slate-100/70"
  }
}

/** barrita de acento a la izquierda de la fila */
function getEstadoAccentClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-400"
    case "proceso":
      return "bg-amber-400"
    default:
      return "bg-slate-300"
  }
}

function getEstadoBadgeClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-100/80 text-emerald-800 ring-1 ring-inset ring-emerald-200"
    case "proceso":
      return "bg-amber-100/80 text-amber-800 ring-1 ring-inset ring-amber-200"
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
  }
}

function getEstadoDotClass(estado?: string): string {
  switch (getEstadoKind(estado)) {
    case "final":
      return "bg-emerald-500"
    case "proceso":
      return "bg-amber-500"
    default:
      return "bg-slate-400"
  }
}

export function WTCoordinatorDetailTable({
  data,
  selectedCoordinador,
  selectedYear,
  selectedMonth,
  selectedDireccion,
  selectedCampana,
}: WTCoordinatorDetailTableProps) {
  const filteredData = data
    .filter((r) => {
      // Filtrar por coordinador si se especifica
      if (selectedCoordinador) {
        if ((r.coordinador || "Sin Asignar") !== selectedCoordinador) return false
      }

      // Filtrar por dirección
      if (selectedDireccion) {
        if (normalizeFilterValue(r.direccion) !== normalizeFilterValue(selectedDireccion)) return false
      }

      // Filtrar por campaña
      if (selectedCampana) {
        if (normalizeFilterValue(r.campana) !== normalizeFilterValue(selectedCampana)) return false
      }

      // Filtrar por año/mes usando fechaInicio cuando sea posible
      const d = parseDateString(r.fechaInicio || r.fechaFin || null)
      if (selectedYear && d) {
        if (d.getFullYear() !== selectedYear) return false
      }
      if (selectedMonth !== null && selectedMonth !== undefined && d) {
        if (d.getMonth() !== selectedMonth) return false
      }

      return true
    })
    // ordenar de atrás para delante: los más recientes primero
    .sort((a, b) => (b.rowIndex ?? 0) - (a.rowIndex ?? 0))

  /* --- chips de filtros aplicados, en fila (solo presentación) --- */
  const chips: { label: string; value: string }[] = []
  if (selectedYear !== undefined) chips.push({ label: "Año", value: String(selectedYear) })
  if (selectedMonth !== null && selectedMonth !== undefined) chips.push({ label: "Mes", value: MONTHS[selectedMonth] })
  if (selectedDireccion) chips.push({ label: "Dirección", value: selectedDireccion })
  if (selectedCampana) chips.push({ label: "Campaña", value: selectedCampana })
  if (selectedCoordinador) chips.push({ label: "Coordinador", value: selectedCoordinador })

  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[0_10px_34px_rgb(15,23,42,0.07)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ================== CABECERA DECORADA ================== */}
      <div className="relative overflow-hidden bg-[#12243d] px-6 py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            color: "#93c5fd",
            maskImage: "linear-gradient(to right, black, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to right, black, transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
              <ClipboardList className="text-white"/>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">Detalle de Entrenamientos Web</h3>
                
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                Desglose de campañas y direcciones {selectedCoordinador ? `para ` : ""}
                {selectedCoordinador && <b className="font-semibold text-amber-400">{selectedCoordinador}</b>}
              </p>
            </div>
          </div>

          {/* contador de registros */}
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-inset ring-white/15">
            <span className="text-2xl font-bold leading-none text-white">{filteredData.length}</span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-300">
              registros
              <br />
              listados
            </span>
          </div>
        </div>
      </div>

      {/* ================== FILTROS APLICADOS EN FILA ================== */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-slate-200/70 bg-slate-50/70 px-6 py-3">
        <span className="mr-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
          </svg>
          Filtros aplicados
        </span>

        {chips.length === 0 ? (
          <span className="text-xs text-slate-500">Mostrando datos sin filtros adicionales</span>
        ) : (
          chips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#12243d]/40" />
              {c.label}:<span className="font-semibold text-slate-900">{c.value}</span>
            </span>
          ))
        )}
      </div>

      {/* ================== TABLA (con max-h + scroll) ================== */}
      <div className="max-h-[540px] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {["Campaña", "Nombre / Desarrollo", "Fechas", "Estado", "Desarrollador"].map((h) => (
                <th
                  key={h}
                  className="border-b border-slate-200 bg-slate-100/90 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    <svg
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">Sin registros para los filtros seleccionados</p>
                  <p className="mt-1 text-xs text-slate-400">Ajusta los filtros para ver resultados</p>
                </td>
              </tr>
            )}
            {filteredData.map((rec, i) => (
              <tr key={i} className={`group transition-colors ${getEstadoRowClass(rec.estado ?? undefined)}`}>
                {/* Campaña + acento de color según estado */}
                <td className="relative border-b border-slate-200/60 px-6 py-3.5 text-slate-600">
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-[3px] ${getEstadoAccentClass(rec.estado ?? undefined)}`}
                  />
                  <span className="font-medium">{rec.campana || "dato no encontrado"}</span>
                </td>

                <td className="border-b border-slate-200/60 px-6 py-3.5 font-semibold text-slate-900">
                  {rec.nombre || rec.desarrollo || "dato no encontrado"}
                </td>

                <td className="border-b border-slate-200/60 px-6 py-3.5 text-slate-600">
                  <div className="flex flex-col gap-0.5">
                    <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
                      <span className="h-1 w-1 rounded-full bg-slate-400" />
                      {rec.fechaInicio || "dato no encontrado"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 pl-0.5 text-xs text-slate-400 tabular-nums">
                      <span className="h-px w-2 bg-slate-300" />
                      {rec.fechaFin || "dato no encontrado"}
                    </span>
                  </div>
                </td>

                <td className="border-b border-slate-200/60 px-6 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${getEstadoBadgeClass(
                      rec.estado ?? undefined,
                    )}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${getEstadoDotClass(rec.estado ?? undefined)}`} />
                    {rec.estado || "SIN INICIAR"}
                  </span>
                </td>

                <td className="border-b border-slate-200/60 px-6 py-3.5">
                  <span className="inline-flex items-center gap-2 text-slate-500 transition-colors group-hover:text-[#12243d]">
                    {rec.desarrollador ? (
                      <>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                          {rec.desarrollador.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium">{rec.desarrollador}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================== PIE ================== */}
      {filteredData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 bg-slate-50/70 px-6 py-2.5 text-[11px] text-slate-500">          
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Finalizado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              En proceso
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Proyectado
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
