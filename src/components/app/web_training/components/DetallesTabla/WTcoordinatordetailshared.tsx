import { useEffect } from 'react'
import type { TrainingRecord } from "../../utils/utils"
import { parseDateString } from "../../utils/utils"
import {
  MONTHS,
  normalizeFilterValue,
  getEstadoKind,
  getEstadoLabel,
  getEstadoRowClass,
  getEstadoAccentClass,
  getEstadoBadgeClass,
  getEstadoDotClass
} from "./estadoUtils"


export type EstadoKind = "final" | "proceso" | "proyectado"

export interface WTCoordinatorDetailCoreProps {
  data: TrainingRecord[]
  selectedCoordinador?: string | null
  selectedYear?: number
  selectedMonth?: number | null
  selectedDireccion?: string | null
  selectedCampana?: string | null
  selectedIndustria?: string | null
  /** Estado de los checkboxes "Finalizado / En proceso / Proyectado" */
  selectedEstadoFilters: EstadoKind[]
  onSelectedEstadoFiltersChange: React.Dispatch<React.SetStateAction<EstadoKind[]>>
  /** Clase de altura máxima del contenedor con scroll de la tabla */
  maxHeightClass?: string
  /** Se llama cada vez que cambia la cantidad de filas visibles (para mostrar el contador en el header) */
  onFilteredCountChange?: (count: number) => void
  /** Contenido opcional a la derecha de la leyenda (ej. botón "Expandir") */
  footerExtra?: React.ReactNode
}

function getIndustriaLabel(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "Sin Asignar"
}

export function WTCoordinatorDetailCore({
  data,
  selectedCoordinador,
  selectedYear,
  selectedMonth,
  selectedDireccion,
  selectedCampana,
  selectedIndustria,
  selectedEstadoFilters,
  onSelectedEstadoFiltersChange,
  maxHeightClass = "2xl:max-h-[540px] max-h-[300px]",
  onFilteredCountChange,
  footerExtra,
}: WTCoordinatorDetailCoreProps) {
  const filteredData = data
    .filter((r) => {
      if (selectedCoordinador) {
        if ((r.coordinador || "Sin Asignar") !== selectedCoordinador) return false
      }

      if (selectedDireccion) {
        if (normalizeFilterValue(r.direccion) !== normalizeFilterValue(selectedDireccion)) return false
      }

      if (selectedCampana) {
        if (normalizeFilterValue(r.campana) !== normalizeFilterValue(selectedCampana)) return false
      }

      if (selectedIndustria) {
        if (normalizeFilterValue(getIndustriaLabel(r.industria)) !== normalizeFilterValue(getIndustriaLabel(selectedIndustria))) return false
      }

      const d = parseDateString(r.fechaInicio || r.fechaFin || null)
      if (selectedYear && d) {
        if (d.getFullYear() !== selectedYear) return false
      }
      if (selectedMonth !== null && selectedMonth !== undefined && d) {
        if (d.getMonth() !== selectedMonth) return false
      }

      if (selectedEstadoFilters.length > 0) {
        const estadoKind = getEstadoKind(r.estado ?? "")
        if (!selectedEstadoFilters.includes(estadoKind)) return false
      }

      return true
    })
    .sort((a, b) => (b.rowIndex ?? 0) - (a.rowIndex ?? 0))

  useEffect(() => {
    onFilteredCountChange?.(filteredData.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData.length])

  const chips: { label: string; value: string }[] = []
  if (selectedYear !== undefined) chips.push({ label: "Año", value: String(selectedYear) })
  if (selectedMonth !== null && selectedMonth !== undefined) chips.push({ label: "Mes", value: MONTHS[selectedMonth] })
  if (selectedDireccion) chips.push({ label: "Dirección", value: selectedDireccion })
  if (selectedCampana) chips.push({ label: "Campaña", value: selectedCampana })
  if (selectedIndustria) chips.push({ label: "Industria", value: selectedIndustria })
  if (selectedCoordinador) chips.push({ label: "Coordinador", value: selectedCoordinador })
  if (selectedEstadoFilters.length > 0) {
    chips.push({
      label: "Estado",
      value: selectedEstadoFilters.map(getEstadoLabel).join(", "),
    })
  }

  return (
    <>
      {/* ================== FILTROS APLICADOS EN FILA ================== */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-slate-200/70 bg-slate-50/70 px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
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
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs text-foreground shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-900" />
                {c.label}:<span className="font-semibold text-slate-900">{c.value}</span>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-3">
          {(["final", "proceso", "proyectado"] as EstadoKind[]).map((kind) => (
            <label
              key={kind}
              className="flex cursor-pointer items-center gap-2 rounded-sm bg-blue-50 px-3 py-2 text-sm font-medium text-slate-700 hover:shadow-sm transition hover:ring-2 hover:ring-slate-300"
            >
              <input
                type="checkbox"
                checked={selectedEstadoFilters.includes(kind)}
                onChange={() => {
                  onSelectedEstadoFiltersChange((current) =>
                    current.includes(kind)
                      ? current.filter((item) => item !== kind)
                      : [...current, kind],
                  )
                }}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              <span className="whitespace-nowrap">{getEstadoLabel(kind)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ================== TABLA  ================== */}
      <div className={`${maxHeightClass} overflow-auto`}>
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {["Campaña", "Nombre / Desarrollo", "Fecha Inicio", "Fecha Fin", "Estado", "Desarrollador"].map((h) => (
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
                <td colSpan={6} className="px-6 py-14 text-center">
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
                  {rec.fechaInicio || "dato no encontrado"}
                </td>
                <td className="border-b border-slate-200/60 px-6 py-3.5 text-slate-600">
                  {rec.fechaFin || "dato no encontrado"}
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

      {/* ================== LEYENDA / ACCIONES ================== */}
      {(filteredData.length > 0 || footerExtra) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 bg-slate-50/70 px-6 py-2.5 text-[11px] text-slate-500">
          {filteredData.length > 0 ? (
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
          ) : (
            <span />
          )}
          {footerExtra}
        </div>
      )}
    </>
  )
}