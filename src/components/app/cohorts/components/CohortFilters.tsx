import type { CohortFilters } from "../hooks/useCohortData";
import {
  SlidersHorizontal,
  CalendarDays,
  CalendarRange,
  Building2,
  Megaphone,
  ChevronDown,
  RotateCcw,
  Users,
  Target,
  FileSpreadsheet,
  ChevronRight,
  X,
  Compass,
  Lock,
} from "lucide-react";
import SearchableSelect from "@/components/app/web_training/utils/SearchableSelect.tsx";

const MESES = [
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
];

interface Props {
  filters: CohortFilters;
  onChange: (f: CohortFilters | ((prev: CohortFilters) => CohortFilters)) => void;
  availableAnios: number[];
  availableCoordinadores: string[];
  availableCampanas: string[];
  availableDirecciones: string[];
  availableIndicadores: string[];
  totalFiltered: number;
  totalAll: number;
  onOpenReportModal?: () => void;
  lockedCoordinador?: string | null;
  isSuperAdmin?: boolean;
}

export default function CohortFiltersComponent({
  filters,
  onChange,
  availableAnios,
  availableCoordinadores,
  availableCampanas,
  availableDirecciones,
  availableIndicadores,
  totalFiltered,
  totalAll,
  onOpenReportModal,
  lockedCoordinador,
}: Props) {
  const set = <K extends keyof CohortFilters>(key: K, val: CohortFilters[K]) =>
    onChange((prev) => ({ ...prev, [key]: val }));

  const isAnioActive = filters.anio !== null;
  const isMesActive = filters.mes !== null;
  const isCoordinadorActive = filters.coordinador !== null;
  const isDireccionActive = filters.direccion !== null;
  const isCampanaActive = filters.campana !== null;
  const isIndicadorActive = filters.indicador !== null;

  const activeCount = [
    isMesActive,
    isCoordinadorActive,
    isDireccionActive,
    isCampanaActive,
    isIndicadorActive,
  ].filter(Boolean).length;

  const resetAll = () => {
    onChange({
      anio: filters.anio,
      mes: null,
      coordinador: lockedCoordinador ?? null,
      campana: null,
      direccion: null,
      indicador: null,
    });
  };

  // Construir migas de pan en el nuevo orden jerárquico
  const activeBreadcrumbs = [
    isMesActive && {
      key: "mes",
      label: MESES[(filters.mes ?? 1) - 1],
      type: "Mes",
      onRemove: () => set("mes", null),
    },
    isCoordinadorActive && !lockedCoordinador && {
      key: "coordinador",
      label: filters.coordinador!,
      type: "Coordinador",
      onRemove: () => set("coordinador", null),
    },
    isDireccionActive && {
      key: "direccion",
      label: filters.direccion!,
      type: "Dirección",
      onRemove: () => set("direccion", null),
    },
    isCampanaActive && {
      key: "campana",
      label: filters.campana!,
      type: "Campaña",
      onRemove: () => set("campana", null),
    },
    isIndicadorActive && {
      key: "indicador",
      label: filters.indicador!,
      type: "Indicador",
      onRemove: () => set("indicador", null),
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    type: string;
    onRemove: () => void;
  }[];

  // Clase base unificada para las 6 cajas de filtros
  const getFilterBoxClass = (isActive: boolean) =>
    `h-[34px] flex items-center gap-1.5 rounded-sm px-2.5 transition-all shrink-0 box-border ${isActive
      ? "ring-2 ring-amber-400 bg-amber-50/40 border border-amber-300 shadow-2xs"
      : "ring-1 ring-inset ring-blue-100/90 hover:ring-[#1a355b] bg-white"
    }`;

  const selectInnerClass = (isActive: boolean) =>
    `h-[26px] leading-[26px] peer cursor-pointer appearance-none rounded-sm pl-2 pr-6 text-xs font-semibold outline-none transition box-border ${isActive
      ? "bg-amber-100 text-amber-950 font-bold"
      : "bg-blue-100/60 text-gray-800 hover:bg-blue-200/60"
    }`;

  return (
    <div className="mb-6 rounded-2xl border-b-3 border-[#1a3459] p-px shadow-[0_12px_34px_-16px_rgb(59_130_246/0.5)] bg-white">
      <div className="relative rounded-[15px] bg-white 2xl:px-4 px-3 py-3">
        {/* radial dots overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[15px]"
          style={{
            backgroundImage:
              "radial-gradient(rgb(148 163 184 / 0.35) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            maskImage: "linear-gradient(to right, black, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to left, black, transparent 100%)",
          }}
        />

        {/* ═══ FILA SUPERIOR: FILTROS A LA IZQ + BOTONES A LA DER ═══ */}
        <div className="relative flex items-center justify-between gap-2 flex-wrap">
          {/* Grupo Izquierdo de Filtros */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            {/* Panel label */}
            <div className="h-[34px] flex items-center gap-1.5 shrink-0 pr-1">
              <span className="size-8 place-items-center rounded-lg bg-[#1a355b] text-amber-400 min-w-[34px] grid shadow-sm">
                <SlidersHorizontal
                  className="size-4"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[11px] font-bold tracking-tight text-gray-800">
                  Filtros
                </span>
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Panel
                </span>
              </span>
            </div>

            <span
              aria-hidden="true"
              className="hidden h-6 w-px bg-gray-200 2xl:block shrink-0 mx-0.5"
            />

            {/* 1. Año */}
            <div className={getFilterBoxClass(isAnioActive)}>
              <label
                htmlFor="cohort-f-anio"
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isAnioActive ? "text-amber-900 font-black" : "text-gray-600"
                  }`}
              >
                <CalendarDays
                  className={`size-3 ${isAnioActive ? "text-amber-600" : "text-amber-500"}`}
                  aria-hidden="true"
                />
                Año
              </label>
              <div className="relative flex items-center">
                <select
                  id="cohort-f-anio"
                  value={filters.anio ?? ""}
                  onChange={(e) =>
                    set("anio", e.target.value === "" ? null : Number(e.target.value))
                  }
                  className={selectInnerClass(isAnioActive)}
                >
                  {availableAnios.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className={`pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 transition ${isAnioActive ? "text-amber-700" : "text-gray-600"
                    }`}
                />
              </div>
            </div>

            {/* 2. Mes */}
            <div className={getFilterBoxClass(isMesActive)}>
              <label
                htmlFor="cohort-f-mes"
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isMesActive ? "text-amber-950 font-black" : "text-gray-600"
                  }`}
              >
                <CalendarRange
                  className={`size-3 ${isMesActive ? "text-amber-600" : "text-amber-500"}`}
                  aria-hidden="true"
                />
                Mes
              </label>
              <div className="relative flex items-center">
                <select
                  id="cohort-f-mes"
                  value={filters.mes === null ? "" : filters.mes}
                  onChange={(e) =>
                    set(
                      "mes",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className={`${selectInnerClass(isMesActive)} max-w-[105px] truncate`}
                >
                  <option value="">Todos</option>
                  {MESES.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className={`pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 transition ${isMesActive ? "text-amber-700" : "text-gray-600"
                    }`}
                />
              </div>
            </div>

            {/* 3. Coordinador (Fijo si está bloqueado por rol, o Selector si es Super Admin) */}
            {lockedCoordinador ? (
              <div className="h-[34px] flex items-center gap-1.5 rounded-sm px-2.5 bg-blue-50/90 border border-blue-200 shadow-2xs">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-950">
                  <Lock className="size-3 text-blue-700" />
                  Coord: <span className="text-[#1a355b] font-bold max-w-[130px] truncate" title={lockedCoordinador}>{lockedCoordinador}</span>
                </span>
              </div>
            ) : availableCoordinadores.length > 1 && (
              <div className={getFilterBoxClass(isCoordinadorActive)}>
                <label
                  htmlFor="cohort-f-coordinador"
                  className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isCoordinadorActive ? "text-amber-950 font-black" : "text-gray-600"
                    }`}
                >
                  <Users
                    className={`size-3 ${isCoordinadorActive ? "text-amber-600" : "text-amber-500"}`}
                    aria-hidden="true"
                  />
                  Coord
                </label>
                <div className="relative flex items-center">
                  <select
                    id="cohort-f-coordinador"
                    value={filters.coordinador ?? ""}
                    onChange={(e) =>
                      set("coordinador", e.target.value === "" ? null : e.target.value)
                    }
                    className={`${selectInnerClass(isCoordinadorActive)} max-w-[125px] truncate`}
                  >
                    <option value="">Todos</option>
                    {availableCoordinadores.map((coord) => (
                      <option key={coord} value={coord}>
                        {coord}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 transition ${isCoordinadorActive ? "text-amber-700" : "text-gray-600"
                      }`}
                  />
                </div>
              </div>
            )}

            {/* 4. Dirección */}
            <div className={getFilterBoxClass(isDireccionActive)}>
              <label
                htmlFor="cohort-f-direccion"
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isDireccionActive ? "text-amber-950 font-black" : "text-gray-600"
                  }`}
              >
                <Building2
                  className={`size-3 ${isDireccionActive ? "text-amber-600" : "text-amber-500"}`}
                  aria-hidden="true"
                />
                Dir
              </label>
              <div className="relative flex items-center">
                <select
                  id="cohort-f-direccion"
                  value={filters.direccion === null ? "" : filters.direccion}
                  onChange={(e) =>
                    set("direccion", e.target.value === "" ? null : e.target.value)
                  }
                  className={`${selectInnerClass(isDireccionActive)} max-w-[120px] truncate`}
                >
                  <option value="">Todas</option>
                  {availableDirecciones.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className={`pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 transition ${isDireccionActive ? "text-amber-700" : "text-gray-600"
                    }`}
                />
              </div>
            </div>

            {/* 5. Campaña */}
            <div className={`${getFilterBoxClass(isCampanaActive)} w-[180px]`}>
              <label
                className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${isCampanaActive ? "text-amber-950 font-black" : "text-gray-600"
                  }`}
              >
                <Megaphone
                  className={`size-3 ${isCampanaActive ? "text-amber-600" : "text-amber-500"}`}
                  aria-hidden="true"
                />
                Campaña
              </label>
              <div className="min-w-0 flex-1 p-0 m-0 flex items-center">
                <SearchableSelect
                  value={filters.campana ?? ""}
                  onSelect={(value) => set("campana", value || null)}
                  options={availableCampanas}
                  placeholder="Todas"
                  color="morado"
                />
              </div>
            </div>

            {/* 6. Req / Indicador */}
            {availableIndicadores.length > 0 && (
              <div className={`${getFilterBoxClass(isIndicadorActive)} w-[180px]`}>
                <label
                  className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${isIndicadorActive ? "text-amber-950 font-black" : "text-gray-600"
                    }`}
                >
                  <Target
                    className={`size-3 ${isIndicadorActive ? "text-amber-600" : "text-amber-500"}`}
                    aria-hidden="true"
                  />
                  Indicador
                </label>
                <div className="min-w-0 flex-1 p-0 m-0 flex items-center">
                  <SearchableSelect
                    value={filters.indicador ?? ""}
                    onSelect={(value) => set("indicador", value || null)}
                    options={availableIndicadores}
                    placeholder="Todos"
                    color="morado"
                    align="right"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grupo Derecho: Acciones fijas en la misma fila */}
          <div className="h-[34px] flex items-center gap-2 shrink-0 ml-auto">
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
                <span className="size-1.5 rounded-full bg-blue-500" />
                {activeCount}
              </span>
            )}

            <button
              type="button"
              onClick={resetAll}
              className="h-[30px] inline-flex items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-amber-700 transition bg-amber-100/80 hover:bg-amber-200 cursor-pointer shadow-2xs"
              title="Limpiar todos los filtros"
            >
              <RotateCcw
                className="size-3.5 text-amber-600"
                aria-hidden="true"
              />
              <span>Limpiar</span>
            </button>

            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                className="h-[30px] inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-black text-white bg-gradient-to-r from-[#1a355b] via-[#244b80] to-[#1a355b] hover:from-[#142947] hover:to-[#1e3f6f] transition-all shadow-sm ring-1 ring-white/20 hover:scale-[1.02] cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="size-3.5 text-amber-400" />
                <span>Generar Informe</span>
              </button>
            )}
          </div>
        </div>

        {/* ═══ FILA INFERIOR: SEGUIMIENTO Y REGISTROS (SOLO SI HAY FILTROS ACTIVOS) ═══ */}
        {activeBreadcrumbs.length > 0 && (
          <div className="relative z-10 mt-2.5 pt-2 border-t border-gray-100/80 flex items-center justify-between gap-2 flex-wrap animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 flex-wrap text-xs min-w-0 flex-1">
              <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[9px] text-[#1a355b] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50 shrink-0">
                <Compass className="size-2.5 text-amber-500" />
                Filtrando por:
              </span>

              {activeBreadcrumbs.map((crumb, idx) => (
                <div key={crumb.key} className="flex items-center gap-1 shrink-0">
                  {idx > 0 && (
                    <ChevronRight className="size-2.5 text-gray-400 shrink-0" strokeWidth={2.5} />
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300/80 shadow-2xs">
                    <span className="text-[9px] font-semibold text-amber-800/80">
                      {crumb.type}:
                    </span>
                    <span className="max-w-[150px] truncate" title={crumb.label}>{crumb.label}</span>
                    <button
                      type="button"
                      onClick={crumb.onRemove}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-amber-200 text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
                      title={`Quitar filtro ${crumb.type}`}
                    >
                      <X className="size-2.5" strokeWidth={2.5} />
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-auto text-xs text-gray-500">
              <span className="tabular-nums font-semibold text-[11px]">
                <strong className="text-[#1a355b]">
                  {totalFiltered.toLocaleString("es-CO")}
                </strong>{" "}
                / {totalAll.toLocaleString("es-CO")} registros
              </span>
              <button
                type="button"
                onClick={resetAll}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline transition cursor-pointer"
              >
                Restablecer todos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
