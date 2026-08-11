import { useEffect, useState } from 'react'
import type { TrainingRecord } from "../../utils/utils"
import { ClipboardList, X } from 'lucide-react'
import {
  WTCoordinatorDetailCore,
  type EstadoKind,
} from './WTcoordinatordetailshared'

interface WTCoordinatorDetailDialogProps {
  open: boolean
  onClose: () => void
  data: TrainingRecord[]
  selectedCoordinador?: string | null
  selectedYear?: number
  selectedMonth?: number | null
  selectedDireccion?: string | null
  selectedCampana?: string | null
  selectedIndustria?: string | null
  /** Filtros de estado que ya estaban activos en la tabla compacta al presionar "Expandir" */
  initialEstadoFilters?: EstadoKind[]
}

export function WTCoordinatorDetailDialog({
  open,
  onClose,
  data,
  selectedCoordinador,
  selectedYear,
  selectedMonth,
  selectedDireccion,
  selectedCampana,
  selectedIndustria,
  initialEstadoFilters = [],
}: WTCoordinatorDetailDialogProps) {
  const [selectedEstadoFilters, setSelectedEstadoFilters] = useState<EstadoKind[]>(initialEstadoFilters)
  const [filteredCount, setFilteredCount] = useState(0)

  // Cada vez que se abre el dialog, parte con los mismos filtros que tenía la tabla compacta
  useEffect(() => {
    if (open) setSelectedEstadoFilters(initialEstadoFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Cerrar con Escape + bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-250 max-h-[90vh]">
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
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
                <ClipboardList className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">Detalle de Desarrollos Web</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                  Vista expandida {selectedCoordinador ? `para ` : ""}
                  {selectedCoordinador && <b className="font-semibold text-amber-400">{selectedCoordinador}</b>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-inset ring-white/15">
                <span className="text-2xl font-bold leading-none text-amber-400">{filteredCount}</span>
                <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-300">
                  registros
                  <br />
                  listados
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <WTCoordinatorDetailCore
            data={data}
            selectedCoordinador={selectedCoordinador}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedDireccion={selectedDireccion}
            selectedCampana={selectedCampana}
            selectedIndustria={selectedIndustria}
            selectedEstadoFilters={selectedEstadoFilters}
            onSelectedEstadoFiltersChange={setSelectedEstadoFilters}
            maxHeightClass="max-h-[65vh]"
            onFilteredCountChange={setFilteredCount}
          />
        </div>
      </div>
    </div>
  )
}