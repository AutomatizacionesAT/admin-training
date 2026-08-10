import type { WTReportData } from "../hooks/useWTReportData";
import type { TrainingRecord } from "../utils/utils";
import SearchableSelect from "../utils/SearchableSelect.tsx";
import { WTCoordinatorDetailTable } from "./WTCoordinatorDetailTable";
import {
  SlidersHorizontal,
  CalendarDays,
  CalendarRange,
  Building2,
  Megaphone,
  ChevronDown,
  RotateCcw,
  Monitor,
  Users,
  X,
  Crown,
} from "lucide-react";
const DIR_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-amber-500 to-yellow-400",
];
const DIR_BG_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
];
const DIR_HOVER_CLASSES = [
  "hover:bg-blue-500 hover:ring-blue-500 hover:ring-1",
  "hover:bg-amber-500 hover:ring-amber-500 hover:ring-1",
];

interface StatusCardProps {
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
  dotClass: string;
  iconPath: string;
  rotateClass?: string;
}

const STATUS_META = [
  {
    ring: "ring-emerald-200",
    bg: "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40",
    chip: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    num: "text-emerald-700",
    bar: "from-emerald-400 to-emerald-600",
    desc: "Desarrollos finalizados y entregados al cliente",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    ring: "ring-amber-200",
    bg: "bg-gradient-to-br from-amber-50 via-white to-amber-50/40",
    chip: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    num: "text-amber-700",
    bar: "from-amber-400 to-orange-500",
    desc: "Desarrollos que se están construyendo actualmente",
    icon: "M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    ring: "ring-slate-400",
    bg: "bg-gradient-to-br from-slate-50 via-white to-slate-100/60",
    chip: "bg-slate-200 text-slate-700",
    dot: "bg-slate-400",
    num: "text-slate-700",
    bar: "from-slate-400 to-slate-600",
    desc: "Desarrollos planeados y pendientes por iniciar",
    icon: "M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
];
const STATUS_CARDS: Omit<StatusCardProps, "value">[] = [
  {
    label: "Entregados",
    colorClass: "border-emerald-100/50",
    bgClass: "bg-emerald-50 text-emerald-500",
    dotClass: "bg-emerald-500",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    rotateClass: "group-hover:rotate-12",
  },
  {
    label: "En proceso",
    colorClass: "border-amber-100/50",
    bgClass: "bg-amber-50 text-amber-500",
    dotClass: "bg-amber-500",
    iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    rotateClass: "group-hover:-rotate-12",
  },
  {
    label: "Proyectados",
    colorClass: "border-slate-100/50",
    bgClass: "bg-slate-50 text-slate-500",
    dotClass: "bg-slate-400",
    iconPath:
      "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
    rotateClass: "group-hover:scale-110",
  },
];

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
];

interface WTReportTabProps {
  reportData: WTReportData;
  selectedCoordinador: string | null;
  onSelectCoordinador: (name: string | null) => void;
  data: TrainingRecord[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  selectedDireccion: string | null;
  setSelectedDireccion: (dir: string | null) => void;
  selectedCampana: string | null;
  setSelectedCampana: (campana: string | null) => void;
  availableYears: number[];
  availableDirecciones: string[];
  availableCampanas: string[];
}

export function WTReportTab({
  reportData,
  selectedCoordinador,
  onSelectCoordinador,
  data,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDireccion,
  setSelectedDireccion,
  selectedCampana,
  setSelectedCampana,
  availableYears,
  availableDirecciones,
  availableCampanas,
}: WTReportTabProps) {
  const statusValues = [
    reportData.finalizados,
    reportData.enProceso,
    reportData.proyectados,
  ];

  return (
    <div className="">
      {/* Filtros */}
      <div className="mb-6 rounded-2xl border-b-3 border-[#1a3459] p-px shadow-[0_12px_34px_-16px_rgb(59_130_246/0.5)]">
        <div className="relative  rounded-[15px] bg-white px-5 py-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgb(148 163 184 / 0.35) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              maskImage: "linear-gradient(to right, black, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to left, black, transparent 100%)",
            }}
          />

          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2.5">
              <span className="size-9 place-items-center rounded-lg bg-primary text-chart-3 min-w-[60px] 2xl:grid hidden">
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
                  Panel
                </span>
              </span>
            </div>

            <span
              aria-hidden="true"
              className="hidden h-9 w-px bg-linear-to-b from-transparent via-gray-200 to-transparent sm:block"
            />
            <div className="flex items-center gap-2.5 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="f-anio"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground"
              >
                <CalendarDays
                  className="size-3.5 text-amber-500"
                  aria-hidden="true"
                />
                Año
              </label>
              <div className="relative">
                <select
                  id="f-anio"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition focus:ring-2 focus:ring-yellow-500 hover:bg-primary/40 focus:bg-primary/40"
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
            <div className="flex items-center gap-2.5 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="f-mes"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground"
              >
                <CalendarRange
                  className="size-3.5 text-amber-500"
                  aria-hidden="true"
                />
                Mes
              </label>
              <div className="relative">
                <select
                  id="f-mes"
                  value={selectedMonth === null ? "" : selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition focus:ring-2 focus:ring-yellow-500 hover:bg-primary/40 focus:bg-primary/40"
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
            <div className="flex items-center gap-2.5 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary">
              <label
                htmlFor="f-direccion"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground"
              >
                <Building2
                  className="size-3.5 text-amber-500"
                  aria-hidden="true"
                />
                Dirección
              </label>
              <div className="relative">
                <select
                  id="f-direccion"
                  value={selectedDireccion === null ? "" : selectedDireccion}
                  onChange={(e) =>
                    setSelectedDireccion(
                      e.target.value === "" ? null : e.target.value,
                    )
                  }
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition focus:ring-2 focus:ring-yellow-500 hover:bg-primary/40 focus:bg-primary/40"
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
            <div className="flex items-center gap-2.5 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary sm:w-[300px]">
              <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                <Megaphone
                  className="size-3.5 text-amber-500"
                  aria-hidden="true"
                />
                Campaña
              </label>
              <div className="min-w-0 flex-1 p-0 m-0">
                <SearchableSelect
                  value={selectedCampana ?? ""}
                  onSelect={(value) => setSelectedCampana(value || null)}
                  options={availableCampanas}
                  placeholder="Todas las campañas"
                  color="morado"
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {[
                selectedMonth !== null,
                selectedDireccion !== null,
                selectedCampana !== null,
              ].filter(Boolean).length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-blue-500"
                  />
                  {
                    [
                      selectedMonth !== null,
                      selectedDireccion !== null,
                      selectedCampana !== null,
                    ].filter(Boolean).length
                  }
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(null);
                  setSelectedDireccion(null);
                  setSelectedCampana(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-500 transition bg-amber-100 hover:bg-amber-200"
              >
                <RotateCcw
                  className="size-3.5 text-amber-500"
                  aria-hidden="true"
                />
                <span className="2xl:flex hidden">Limpiar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ═══ TOTAL DESARROLLOS ═══ */}
        <div className="group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1a355b] p-6 shadow-[0_14px_38px_-14px_rgb(26_53_91_/0.55)] ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_18px_44px_-14px_rgb(26_53_91_/0.7)] lg:col-span-4">
          {/* capa de brillo diagonal */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/12 via-transparent to-[#0f2340]/70"
          />
          {/* aros decorativos */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-sky-400/20 blur-2xl transition-transform duration-500 group-hover:scale-110"
          />
          {/* trama de puntos */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(rgb(255 255 255 / 0.25) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              maskImage:
                "linear-gradient(to top right, black, transparent 90%)",
              WebkitMaskImage:
                "linear-gradient(to top right, black, transparent 90%)",
            }}
          />

          <div className="relative z-10 mb-5 flex w-full items-start justify-between">
            <div className="rounded-lg bg-white/10 p-2.5 text-amber-500 ring-2 ring-inset ring-white/20 backdrop-blur-sm">
              <Monitor className="h-6 w-6" strokeWidth={2} />
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-200 ring-1 ring-inset ring-white/15">
              Base WT25
            </span>
          </div>

          <div className="relative z-10">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300/90">
              Total Desarrollos
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-6xl font-black leading-none tracking-tight text-white">
                {reportData.totalEntrenamientos}
              </p>
              <span className="text-sm font-medium text-sky-200/80">
                registros
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-sky-400/60" />
            <p className="mt-2.5 text-xs leading-relaxed text-sky-100/70">
              Cantidad total de desarrollos realizados en el período consultado.
            </p>
          </div>
        </div>

        {/* ═══ INDUSTRIAS ═══ */}
        <div className="col-span-1 flex h-full flex-col rounded-2xl border border-gray-100/70 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-5">
          <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-blue-900 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-10 items-center justify-center rounded-xs bg-[#1a355b]/10 text-[#1a355b]">
                <Building2 className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-sm font-bold leading-tight text-gray-900">
                  Industrias
                </h3>
                <p className="text-[11px] font-medium text-gray-500">
                  Distribución de desarrollos por sector
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1a355b]">
              {reportData.industrias.length} sectores
            </span>
          </div>

          <div
            className="grid flex-1 gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            }}
          >
            {reportData.industrias.map((ind, idx) => (
              <div
                key={ind.nombre}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-linear-to-b from-white to-slate-50/60 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${DIR_HOVER_CLASSES[idx % DIR_HOVER_CLASSES.length]}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div
                    className={`rounded-xl p-1.5 ${DIR_BG_COLORS[idx % DIR_BG_COLORS.length]}`}
                  >
                    <Building2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </div>
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-[#1a355b] bg-blue-50">
                    {ind.porcentaje}%
                  </span>
                </div>
                <div>
                  <h4
                    className="mb-1 line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-wide text-gray-600"
                    title={ind.nombre}
                  >
                    {ind.nombre}
                  </h4>
                  <span className="text-2xl font-black leading-none tracking-tight text-foreground">
                    {ind.count}
                  </span>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${DIR_COLORS[idx % DIR_COLORS.length]}`}
                      style={{ width: `${ind.porcentaje}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {reportData.industrias.length === 0 && (
              <div className="col-span-full flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center text-xs text-gray-400">
                No hay industrias disponibles para el período seleccionado
              </div>
            )}
          </div>
        </div>

        {/* ═══ COORDINADORES ═══ */}
        <div className="relative col-span-1 flex flex-col overflow-hidden rounded-2xl border border-gray-100/70 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-3 lg:row-span-2 lg:h-[494px]">
          <div className="relative overflow-hidden bg-[#1a355b] px-4 py-3.5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(rgb(255 255 255 / 0.3) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
                maskImage: "linear-gradient(to left, black, transparent 70%)",
                WebkitMaskImage:
                  "linear-gradient(to left, black, transparent 70%)",
              }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/12 text-sky-200 ring-1 ring-inset ring-white/20">
                  <Users className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-sm font-bold leading-tight text-white">
                    Coordinadores
                  </h3>
                  <p className="text-[11px] font-medium text-sky-200/80">
                    Desarrollos por líder de equipo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedCoordinador && (
                  <button
                    onClick={() => onSelectCoordinador(null)}
                    className="flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-500"
                    title="Ver global"
                  >
                    <X className="h-3 w-3" strokeWidth={3} />
                    Limpiar
                  </button>
                )}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-xs font-black text-white ring-1 ring-inset ring-white/25">
                  {reportData.coordinadores.length}
                </span>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
            {reportData.coordinadores.map((coord, idx) => {
              const isSelected = selectedCoordinador === coord.nombre;
              const maxCount = reportData.coordinadores[0]?.count || 1;
              return (
                <button
                  key={coord.nombre}
                  onClick={() =>
                    onSelectCoordinador(isSelected ? null : coord.nombre)
                  }
                  className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-[#1a355b]/25 bg-[#1a355b]/[0.07] shadow-sm"
                      : "cursor-pointer border-transparent hover:border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  {/* barra de progreso de fondo */}
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 left-0 rounded-xl transition-colors ${
                      isSelected ? "bg-[#1a355b]/10" : "bg-slate-100/70"
                    }`}
                    style={{ width: `${(coord.count / maxCount) * 100}%` }}
                  />
                  <span
                    className={`relative z-10 w-4 shrink-0 text-center text-[10px] font-black tabular-nums ${
                      isSelected ? "text-[#1a355b]" : "text-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm ring-2 transition-colors ${
                      isSelected
                        ? "bg-[#1a355b] text-white ring-[#1a355b]/20"
                        : "bg-linear-to-br from-slate-100 to-slate-200 text-slate-600 ring-white"
                    }`}
                  >
                    {coord.nombre.charAt(0).toUpperCase()}
                    {idx < 3 && (
                      <span
                        className={`absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
                          idx === 0
                            ? "bg-yellow-400 text-yellow-900"
                            : idx === 1
                              ? "bg-slate-300 text-slate-700"
                              : "bg-amber-600 text-white"
                        }`}
                      >
                        <Crown className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p
                    className={`relative z-10 min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wide transition-colors ${
                      isSelected
                        ? "text-[#1a355b]"
                        : "text-gray-700 group-hover:text-[#1a355b]"
                    }`}
                    title={coord.nombre}
                  >
                    {coord.nombre}
                  </p>
                  <span
                    className={`relative z-10 shrink-0 rounded-lg px-2 py-0.5 text-xs font-black tabular-nums ring-1 ring-inset transition-colors ${
                      isSelected
                        ? "bg-[#1a355b] text-white ring-[#1a355b]"
                        : "bg-white text-[#1a355b] ring-gray-100 group-hover:ring-[#1a355b]/20"
                    }`}
                  >
                    {coord.count}
                  </span>
                </button>
              );
            })}
            {reportData.coordinadores.length === 0 && (
              <div className="mt-8 text-center text-xs text-gray-400">
                Sin coordinadores registrados
              </div>
            )}
          </div>
        </div>

        {/* ═══ ESTADOS DEL PROCESO ═══ */}
        <div className="col-span-1 grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-9">
          {STATUS_CARDS.map((card, idx) => {
            const meta = STATUS_META[idx % STATUS_META.length];
            const total = reportData.totalEntrenamientos || 1;
            const pct = Math.round((statusValues[idx] / total) * 100);
            return (
              <div
                key={card.label}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${meta.bg} ${meta.ring}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                      {card.label}
                    </h4>
                  </div>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={meta.icon}
                      />
                    </svg>
                  </span>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <p
                    className={`text-4xl font-black leading-none tracking-tight ${meta.num}`}
                  >
                    {statusValues[idx]}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.chip}`}
                  >
                    {pct}% del total
                  </span>
                </div>

                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-black/4">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${meta.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="mt-2 text-[11px] leading-snug text-gray-500">
                  {meta.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla de detalle por coordinador */}
      {(selectedCoordinador || selectedMonth !== null || selectedDireccion !== null || selectedCampana !== null) && (
        <WTCoordinatorDetailTable
          data={data}
          selectedCoordinador={selectedCoordinador ?? undefined}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          selectedDireccion={selectedDireccion ?? undefined}
          selectedCampana={selectedCampana ?? undefined}
        />
      )}
    </div>
  );
}
