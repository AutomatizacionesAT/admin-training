import type { CohortRecord } from "../utils/utils";
import type { CohortKPIs, RacPorCampana } from "../hooks/useCohortData";
import {
  Users,
  Building2,
  Crown,
  X,
  BookOpenCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react";

const DIR_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-amber-500 to-yellow-400",
  "from-indigo-500 to-sky-400",
  "from-emerald-500 to-teal-400",
  "from-purple-500 to-indigo-400",
];
const DIR_BG_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
  "bg-indigo-50 text-indigo-600",
  "bg-emerald-50 text-emerald-600",
  "bg-purple-50 text-purple-600",
];
const DIR_HOVER_CLASSES = [
  "hover:bg-blue-500 hover:ring-blue-500 hover:ring-1",
  "hover:bg-amber-500 hover:ring-amber-500 hover:ring-1",
  "hover:bg-indigo-500 hover:ring-indigo-500 hover:ring-1",
  "hover:bg-emerald-500 hover:ring-emerald-500 hover:ring-1",
  "hover:bg-purple-500 hover:ring-purple-500 hover:ring-1",
];

const STATUS_META = [
  {
    label: "Óptimo (≥ 90%)",
    ring: "ring-emerald-200",
    bg: "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40",
    chip: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    num: "text-emerald-700",
    bar: "from-emerald-400 to-emerald-600",
    desc: "Personas con cumplimiento sobresaliente al cierre",
    icon: CheckCircle2,
  },
  {
    label: "En Alerta (70–89%)",
    ring: "ring-amber-200",
    bg: "bg-gradient-to-br from-amber-50 via-white to-amber-50/40",
    chip: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    num: "text-amber-700",
    bar: "from-amber-400 to-orange-500",
    desc: "Personas en rango de seguimiento y refuerzo continuo",
    icon: AlertTriangle,
  },
  {
    label: "Crítico (< 70%)",
    ring: "ring-rose-300",
    bg: "bg-gradient-to-br from-rose-50 via-white to-rose-50/40",
    chip: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    num: "text-rose-700",
    bar: "from-rose-400 to-red-500",
    desc: "Personas por debajo del umbral mínimo de cierre",
    icon: XCircle,
  },
];

interface ByCampana {
  campana: string;
  total: number;
  cumpliendo: number;
  promCierre: number | null;
}

interface ByIndicador {
  indicador: string;
  total: number;
  promCierre: number | null;
}

interface CoordinatorItem {
  nombre: string;
  count: number;
  registros: number;
  promCierre: number | null;
}

interface FormadorItem {
  formador: string;
  total: number;
}

interface StageItem {
  stage: string;
  shortName: string;
  promMeta: number | null;
  promResultado: number | null;
  promCumplimiento: number | null;
  verde: number;
  amarillo: number;
  rojo: number;
  totalValid: number;
}

interface Props {
  kpis: CohortKPIs;
  racPorCampana: RacPorCampana[];
  byCampana: ByCampana[];
  byIndicador: ByIndicador[];
  byCoordinador: CoordinatorItem[];
  byFormador: FormadorItem[];
  stagesEvolution: StageItem[];
  filteredData: CohortRecord[];
  selectedCoordinador: string | null;
  onSelectCoordinador: (coord: string | null) => void;
  selectedCampana: string | null;
  onSelectCampana: (campana: string | null) => void;
}

export default function CohortResumenTab({
  kpis,
  racPorCampana,
  byIndicador,
  byCoordinador,
  byFormador,
  stagesEvolution,
  filteredData,
  selectedCoordinador,
  onSelectCoordinador,
  selectedCampana,
  onSelectCampana,
}: Props) {
  // Calculamos el total de RACs en las campañas mostradas
  const totalRacs = racPorCampana.reduce((s, r) => s + r.racs, 0);

  // Status values para las 3 tarjetas inferiores
  const totalSemaforo = (kpis.verde + kpis.amarillo + kpis.rojo) || 1;
  const statusCounts = [kpis.verde, kpis.amarillo, kpis.rojo];

  return (
    <div className="space-y-6">
      {/* ═══ GRID PRINCIPAL ═══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* ── 1. HERO CARD: TOTAL PERSONAS / RACS ── */}
        <div className="group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1a355b] p-6 shadow-[0_14px_38px_-14px_rgb(26_53_91_/0.55)] ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_18px_44px_-14px_rgb(26_53_91_/0.7)] lg:col-span-4">
          {/* Capa de brillo diagonal */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-[#0f2340]/70"
          />
          {/* Aros decorativos */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-sky-400/20 blur-2xl transition-transform duration-500 group-hover:scale-110"
          />
          {/* Trama de puntos */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(rgb(255 255 255 / 0.25) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              maskImage: "linear-gradient(to top right, black, transparent 90%)",
              WebkitMaskImage:
                "linear-gradient(to top right, black, transparent 90%)",
            }}
          />

          <div className="relative z-10 mb-5 flex w-full items-start justify-between">
            <div className="rounded-lg bg-white/10 p-2.5 text-amber-400 ring-2 ring-inset ring-white/20 backdrop-blur-sm">
              <Users className="h-6 w-6" strokeWidth={2} />
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-200 ring-1 ring-inset ring-white/15">
              Cohorts 30D
            </span>
          </div>

          <div className="relative z-10">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300/90">
              Total Personas en Proceso
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-6xl font-black leading-none tracking-tight text-white tabular-nums">
                {kpis.totalPersonas.toLocaleString("es-CO")}
              </p>
              <span className="text-sm font-medium text-sky-200/80">
                RACs únicos
              </span>
            </div>

            <div className="mt-3 h-px w-full bg-sky-400/60" />

            <div className="mt-3 flex items-center justify-between text-xs text-sky-100/90">
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpenCheck className="w-3.5 h-3.5 text-amber-400" />
                {kpis.totalCohortes} cohortes activas
              </span>
              <span className="font-semibold text-sky-200">
                {filteredData.length.toLocaleString("es-CO")} registros
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-sky-100/70">
              Personas evaluadas durante sus primeros 30 días en el período consultado.
            </p>
          </div>
        </div>

        {/* ── 2. INDUSTRIAS / CAMPAÑAS ── */}
        <div className="col-span-1 flex h-full flex-col rounded-2xl border border-gray-100/70 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-5">
          <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-blue-900 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-10 items-center justify-center rounded-sm bg-[#1a355b]/10 text-[#1a355b]">
                <Building2 className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-sm font-bold leading-tight text-gray-900">
                  Campañas
                </h3>
                <p className="text-[11px] font-medium text-gray-500">
                  Distribución de RACs por campaña
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCampana && (
                <button
                  type="button"
                  onClick={() => onSelectCampana(null)}
                  className="flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Quitar
                </button>
              )}
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1a355b]">
                {racPorCampana.length} campañas
              </span>
            </div>
          </div>

          <div
            className="grid flex-1 gap-3 max-h-[380px] overflow-y-auto pr-1"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
            }}
          >
            {racPorCampana.map((camp, idx) => {
              const isSelected = selectedCampana === camp.campana;
              const pct = totalRacs > 0 ? Math.round((camp.racs / totalRacs) * 100) : 0;
              return (
                <button
                  key={camp.campana}
                  type="button"
                  onClick={() => onSelectCampana(isSelected ? null : camp.campana)}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                    DIR_HOVER_CLASSES[idx % DIR_HOVER_CLASSES.length]
                  } cursor-pointer text-left ${
                    isSelected
                      ? "border-[#1a355b] ring-2 ring-[#1a355b]/20 bg-blue-50/70"
                      : "border-gray-200 bg-gradient-to-b from-white to-slate-50/60"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div
                      className={`rounded-xl p-1.5 ${
                        DIR_BG_COLORS[idx % DIR_BG_COLORS.length]
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </div>
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-[#1a355b] bg-blue-50">
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <h4
                      className="mb-1 line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-wide text-gray-600"
                      title={camp.campana}
                    >
                      {camp.campana}
                    </h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black leading-none tracking-tight text-gray-900 tabular-nums">
                        {camp.racs}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">RACs</span>
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          DIR_COLORS[idx % DIR_COLORS.length]
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {camp.promCierre !== null && (
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                        <span>Cierre:</span>
                        <span className="font-bold text-[#1a355b]">{camp.promCierre}%</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {racPorCampana.length === 0 && (
              <div className="col-span-full flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center text-xs text-gray-400">
                No hay campañas disponibles para el período seleccionado
              </div>
            )}
          </div>
        </div>

        {/* ── 3. COORDINADORES RANKING ── */}
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
                    RACs por líder de equipo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedCoordinador && (
                  <button
                    onClick={() => onSelectCoordinador(null)}
                    className="flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-500 cursor-pointer"
                    title="Ver global"
                  >
                    <X className="h-3 w-3" strokeWidth={3} />
                    Limpiar
                  </button>
                )}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-xs font-black text-white ring-1 ring-inset ring-white/25">
                  {byCoordinador.length}
                </span>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
            {byCoordinador.map((coord, idx) => {
              const isSelected = selectedCoordinador === coord.nombre;
              const maxCount = byCoordinador[0]?.count || 1;
              return (
                <button
                  key={coord.nombre}
                  onClick={() =>
                    onSelectCoordinador(isSelected ? null : coord.nombre)
                  }
                  className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#1a355b]/25 bg-[#1a355b]/[0.07] shadow-sm"
                      : "border-transparent hover:border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  {/* Barra de progreso de fondo */}
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
                        : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 ring-white"
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
            {byCoordinador.length === 0 && (
              <div className="mt-8 text-center text-xs text-gray-400">
                Sin coordinadores registrados
              </div>
            )}
          </div>
        </div>

        {/* ── 4. STATUS / SEMÁFORO CARDS (BOTTOM ROW) ── */}
        <div className="col-span-1 grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-9">
          {STATUS_META.map((meta, idx) => {
            const count = statusCounts[idx];
            const pct = Math.round((count / totalSemaforo) * 100);
            const Icon = meta.icon;
            return (
              <div
                key={meta.label}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${meta.bg} ${meta.ring}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                      {meta.label}
                    </h4>
                  </div>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <p
                    className={`text-4xl font-black leading-none tracking-tight tabular-nums ${meta.num}`}
                  >
                    {count.toLocaleString("es-CO")}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.chip}`}
                  >
                    {pct}% del total
                  </span>
                </div>

                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-black/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${meta.bar}`}
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

      {/* ═══ EVOLUCIÓN POR ETAPAS: OJT → S1 → S2 → S3 → S4 → CIERRE ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a355b]/10 text-[#1a355b]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-900">Evolución por Etapas de Cohort</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-semibold">OJT → Semana 1 → 2 → 3 → 4 → Cierre 30D</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-gray-100">
          {stagesEvolution.map((stage, idx) => {
            const pct = stage.promCumplimiento;
            const isLast = idx === stagesEvolution.length - 1;
            const color =
              pct === null ? "gray"
              : pct >= 90 ? "green"
              : pct >= 70 ? "amber"
              : "red";
            const colorMap = {
              green: { bar: "from-emerald-400 to-emerald-600", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
              amber: { bar: "from-amber-400 to-orange-500", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
              red:   { bar: "from-rose-400 to-red-500",   text: "text-rose-700",   bg: "bg-rose-50",   ring: "ring-rose-200" },
              gray:  { bar: "from-gray-300 to-gray-400",  text: "text-gray-500",   bg: "bg-gray-50",   ring: "ring-gray-200" },
            }[color];

            return (
              <div
                key={stage.shortName}
                className={`relative flex flex-col items-center justify-between gap-2 px-4 py-5 transition-all hover:bg-slate-50/60 ${
                  isLast ? "bg-gradient-to-b from-[#1a355b]/5 to-[#1a355b]/10" : ""
                }`}
              >
                {/* Stage label */}
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className={`inline-flex items-center justify-center h-7 w-7 rounded-xl text-xs font-black ring-1 ${
                    isLast ? "bg-[#1a355b] text-amber-300 ring-[#1a355b]" : `${colorMap.bg} ${colorMap.text} ${colorMap.ring}`
                  }`}>
                    {stage.shortName}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 text-center leading-tight">
                    {stage.stage}
                  </span>
                </div>

                {/* Pct number */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-3xl font-black tabular-nums leading-none ${
                    isLast ? "text-[#1a355b]" : colorMap.text
                  }`}>
                    {pct !== null ? `${pct}%` : "—"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">cumplimiento</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${colorMap.bar}`}
                    style={{ width: `${Math.min(100, pct ?? 0)}%` }}
                  />
                </div>

                {/* Meta vs Resultado */}
                <div className="flex items-center justify-between w-full text-[10px] font-semibold">
                  <span className="text-gray-400">
                    Meta: <span className="text-gray-600">{stage.promMeta ?? "—"}</span>
                  </span>
                  <span className="text-gray-400">
                    Res: <span className="text-gray-600">{stage.promResultado ?? "—"}</span>
                  </span>
                </div>

                {/* Semaforo mini-bar */}
                {stage.totalValid > 0 && (
                  <div className="flex items-center gap-0.5 w-full h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${Math.round((stage.verde / stage.totalValid) * 100)}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${Math.round((stage.amarillo / stage.totalValid) * 100)}%` }} />
                    <div className="h-full bg-rose-500 rounded-r-full" style={{ width: `${Math.round((stage.rojo / stage.totalValid) * 100)}%` }} />
                  </div>
                )}

                {/* Arrow connector (all but last) */}
                {!isLast && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center h-6 w-6 rounded-full bg-white border border-gray-200 shadow-xs">
                    <span className="text-[10px] text-gray-400">›</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SECCIÓN INFERIOR ADICIONAL: INDICADORES & FORMADORES ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cumplimiento por Indicador */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100/70 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">
                Cumplimiento por Indicador
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              {byIndicador.length} indicadores
            </span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {byIndicador.map((ind) => (
              <div
                key={ind.indicador}
                className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex-1 text-xs font-semibold text-gray-700 truncate" title={ind.indicador}>
                  {ind.indicador}
                </span>
                <span className="text-[11px] font-medium text-gray-400 tabular-nums">
                  {ind.total} reg
                </span>
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{ width: `${Math.min(100, ind.promCierre ?? 0)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#1a355b] tabular-nums w-10 text-right">
                  {ind.promCierre !== null ? `${ind.promCierre}%` : "—"}
                </span>
              </div>
            ))}
            {byIndicador.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Sin indicadores para los filtros seleccionados
              </p>
            )}
          </div>
        </div>

        {/* Top Formadores */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100/70 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Crown className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">
                Top Formadores
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              {byFormador.length} registrados
            </span>
          </div>

          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {byFormador.slice(0, 7).map(({ formador, total }, idx) => (
              <div
                key={formador}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="w-4 text-[10px] font-black text-gray-400 tabular-nums text-center">
                  {idx + 1}
                </span>
                <span className="flex-1 text-xs font-semibold text-gray-700 truncate uppercase" title={formador}>
                  {formador}
                </span>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md tabular-nums">
                  {total}
                </span>
              </div>
            ))}
            {byFormador.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Sin formadores registrados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
