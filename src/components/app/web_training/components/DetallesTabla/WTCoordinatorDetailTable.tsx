import { useState } from 'react'
import type { TrainingRecord } from "../../utils/utils"
import { ClipboardList, Maximize2 } from 'lucide-react';
import { WTCoordinatorDetailCore, type EstadoKind } from './WTcoordinatordetailshared'
import { WTCoordinatorDetailDialog } from './Wtcoordinatordetaildialog'

interface WTCoordinatorDetailTableProps {
  data: TrainingRecord[]
  selectedCoordinador?: string | null
  selectedYear?: number
  selectedMonth?: number | null
  selectedDireccion?: string | null
  selectedCampana?: string | null
}

export function WTCoordinatorDetailTable({
  data,
  selectedCoordinador,
  selectedYear,
  selectedMonth,
  selectedDireccion,
  selectedCampana,
}: WTCoordinatorDetailTableProps) {
  const [selectedEstadoFilters, setSelectedEstadoFilters] = useState<EstadoKind[]>([])
  const [filteredCount, setFilteredCount] = useState(0)
  const [isExpandedOpen, setIsExpandedOpen] = useState(false)

  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[0_10px_34px_rgb(15,23,42,0.07)] animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <h3 className="text-lg font-bold tracking-tight text-white">Detalle de Desarrollos Web</h3>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                Desglose de campañas y solicitudes {selectedCoordinador ? `para ` : ""}
                {selectedCoordinador && <b className="font-semibold text-amber-400">{selectedCoordinador}</b>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-inset ring-white/15">
            <span className="text-2xl font-bold leading-none text-amber-400">{filteredCount}</span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-300">
              registros
              <br />
              listados
            </span>
          </div>
        </div>
      </div>

      <WTCoordinatorDetailCore
        data={data}
        selectedCoordinador={selectedCoordinador}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDireccion={selectedDireccion}
        selectedCampana={selectedCampana}
        selectedEstadoFilters={selectedEstadoFilters}
        onSelectedEstadoFiltersChange={setSelectedEstadoFilters}
        onFilteredCountChange={setFilteredCount}
        footerExtra={
          <button
            type="button"
            onClick={() => setIsExpandedOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#12243d] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a3355] min-w-[150px] cursor-pointer hover:ring-2"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expandir
          </button>
        }
      />

      <WTCoordinatorDetailDialog
        open={isExpandedOpen}
        onClose={() => setIsExpandedOpen(false)}
        data={data}
        selectedCoordinador={selectedCoordinador}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDireccion={selectedDireccion}
        selectedCampana={selectedCampana}
        initialEstadoFilters={selectedEstadoFilters}
      />
    </div>
  )
}