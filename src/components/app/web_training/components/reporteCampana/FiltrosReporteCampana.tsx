import SearchableSelect from "../../utils/SearchableSelect.tsx";
import type { EstadoServidorFilter } from "../EnviosServidoresReportDialog";
import type { ActividadFilter, ActividadCounts } from "./types";
import { MONTHS } from "./constants";
import {
  SlidersHorizontal,
  CalendarDays,
  CalendarRange,
  Building2,
  Megaphone,
  ChevronDown,
  RotateCcw,
  Monitor,
  Activity,
} from "lucide-react";

interface FiltrosReporteCampanaProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  selectedDireccion: string | null;
  setSelectedDireccion: (dir: string | null) => void;
  availableDirecciones: string[];
  selectedCampana: string | null;
  setSelectedCampana: (campana: string | null) => void;
  unifiedCampanasOptions: string[];
  selectedActividad: ActividadFilter;
  setSelectedActividad: (actividad: ActividadFilter) => void;
  actividadCounts: ActividadCounts;
  selectedEstadoServidor: EstadoServidorFilter | null;
  setSelectedEstadoServidor: (estado: EstadoServidorFilter | null) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function FiltrosReporteCampana({
  selectedYear,
  setSelectedYear,
  availableYears,
  selectedMonth,
  setSelectedMonth,
  selectedDireccion,
  setSelectedDireccion,
  availableDirecciones,
  selectedCampana,
  setSelectedCampana,
  unifiedCampanasOptions,
  selectedActividad,
  setSelectedActividad,
  actividadCounts,
  selectedEstadoServidor,
  setSelectedEstadoServidor,
  activeFiltersCount,
  onClearFilters,
}: FiltrosReporteCampanaProps) {
  return (
    <div className="rounded-2xl border-b-3 border-[#1a3459] p-px shadow-[0_12px_34px_-16px_rgb(59_130_246/0.5)]">
      <div className="relative rounded-[15px] bg-white px-3 py-4 2xl:px-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgb(148 163 184 / 0.35) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            maskImage: "linear-gradient(to right, black, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black, transparent 100%)",
          }}
        />
        <div className="relative flex flex-col gap-y-4">
          <div className="flex w-full items-center gap-2.5">
            <span className="grid size-9 min-w-9 place-items-center rounded-lg bg-primary text-chart-3">
              <SlidersHorizontal
                className="size-6"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-gray-800">
                Filtros
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Campañas
              </span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-blue-500"
                  />
                  {activeFiltersCount} activo{activeFiltersCount > 1 ? "s" : ""}
                </span>
              )}
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-600 transition hover:bg-amber-200 cursor-pointer"
              >
                <RotateCcw
                  className="size-3.5 text-amber-600"
                  aria-hidden="true"
                />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Grid de Filtros Responsivo */}
          {/* En móviles 1 col, tablets 2-3 cols, pantallas grandes 6 cols iguales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            
            {/* Filtro Año */}
            <div className="flex w-full items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="camp-f-anio"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground whitespace-nowrap"
              >
                <CalendarDays className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                Año
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="camp-f-anio"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="peer w-full cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-2 pr-7 text-xs font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500 truncate"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground transition peer-hover:text-chart-4"
                />
              </div>
            </div>

            {/* Filtro Mes */}
            <div className="flex w-full items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="camp-f-mes"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground whitespace-nowrap"
              >
                <CalendarRange className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                Mes
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="camp-f-mes"
                  value={selectedMonth === null ? "" : selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="peer w-full cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-2 pr-7 text-xs font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500 truncate"
                >
                  <option value="">Todos los meses</option>
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground transition peer-hover:text-chart-4"
                />
              </div>
            </div>

            {/* Filtro Dirección */}
            <div className="flex w-full items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="camp-f-direccion"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground whitespace-nowrap"
              >
                <Building2 className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                Dirección
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="camp-f-direccion"
                  value={selectedDireccion === null ? "" : selectedDireccion}
                  onChange={(e) =>
                    setSelectedDireccion(
                      e.target.value === "" ? null : e.target.value,
                    )
                  }
                  className="peer w-full cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-2 pr-7 text-xs font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500 truncate"
                >
                  <option value="">Todas las direcciones</option>
                  {availableDirecciones.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground transition peer-hover:text-chart-4"
                />
              </div>
            </div>

            {/* Filtro Campaña */}
            <div className="flex w-full items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                <Megaphone className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                Campaña
              </label>
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  value={selectedCampana ?? ""}
                  onSelect={(value) => setSelectedCampana(value || null)}
                  options={unifiedCampanasOptions}
                  placeholder="Todas las campañas"
                  color="morado"
                />
              </div>
            </div>

            {/* Filtro Actividad */}
            <div className="flex w-full items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="camp-f-actividad"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground whitespace-nowrap"
              >
                <Activity className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                Actividad
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="camp-f-actividad"
                  value={selectedActividad}
                  onChange={(e) =>
                    setSelectedActividad(
                      e.target.value as ActividadFilter,
                    )
                  }
                  className="peer w-full cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-2 pr-7 text-xs font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500 truncate"
                >
                  <option value="ALL">TODAS LAS CAMPAÑAS</option>
                  <option value="ACTIVAS">
                    ACTIVAS {actividadCounts.activas > 0 ? `(${actividadCounts.activas})` : ""}
                  </option>
                  <option value="INACTIVAS">
                    INACTIVAS {actividadCounts.inactivas > 0 ? `(${actividadCounts.inactivas})` : ""}
                  </option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground transition peer-hover:text-chart-4"
                />
              </div>
            </div>

            {/* Filtro Estado Servidor */}
            <div className="flex w-full items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="camp-f-servidor"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground whitespace-nowrap"
              >
                <Monitor className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                Servidor
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="camp-f-servidor"
                  value={selectedEstadoServidor ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? null
                        : (e.target.value as EstadoServidorFilter);
                    setSelectedEstadoServidor(value);
                  }}
                  className="peer w-full cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-2 pr-7 text-xs font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500 truncate"
                >
                  <option value="">Todos los servidores</option>
                  <option value="SI">EN SERVIDOR</option>
                  <option value="NO">SIN SERVIDOR</option>
                  <option value="MIGRACION">EN MIGRACION</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground transition peer-hover:text-chart-4"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
