import type { EstadoServidorFilter } from "../EnviosServidoresReportDialog";
import type {
  ActividadCounts,
  CoordinadorMetric,
  IndustriaMetric,
  ServerMetrics,
} from "./types";
import { DIR_COLORS, DIR_BG_COLORS, DIR_HOVER_CLASSES } from "./constants";
import {
  Megaphone,
  Building2,
  Users,
  X,
  Crown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap, 
} from "lucide-react";

interface GridMetricasCampanaProps {
  filteredCampanasCount: number;
  actividadCounts: ActividadCounts;
  onOpenEnviosReport: () => void;
  industriasMetrics: IndustriaMetric[];
  selectedIndustria: string | null;
  setSelectedIndustria: (industria: string | null) => void;
  coordinadoresMetrics: CoordinadorMetric[];
  selectedCoordinador: string | null;
  onSelectCoordinador: (name: string | null) => void;
  serverMetrics: ServerMetrics;
  selectedEstadoServidor: EstadoServidorFilter | null;
  setSelectedEstadoServidor: (estado: EstadoServidorFilter | null) => void;
}

export function GridMetricasCampana({
  filteredCampanasCount, 
  industriasMetrics,
  selectedIndustria,
  setSelectedIndustria,
  coordinadoresMetrics,
  selectedCoordinador,
  onSelectCoordinador,
  serverMetrics,
  selectedEstadoServidor,
  setSelectedEstadoServidor,
}: GridMetricasCampanaProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* ═══ TOTAL CAMPAÑAS  ═══ */}
      <div className="group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1a355b] p-6 shadow-[0_14px_38px_-14px_rgb(26_53_91_/0.55)] ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_18px_44px_-14px_rgb(26_53_91_/0.7)] lg:col-span-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/12 via-transparent to-[#0f2340]/70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-sky-400/20 blur-2xl transition-transform duration-500 group-hover:scale-110"
        />
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
            <Megaphone className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-200 ring-1 ring-inset ring-white/20">
              Base WT + Servidores
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300/90">
            Total Campañas
          </h3>
          <div className="flex items-baseline gap-2">
            <p className="text-6xl font-black leading-none tracking-tight text-white">
              {filteredCampanasCount}
            </p>
            <span className="text-sm font-medium text-sky-200/80">
              campañas existentes
            </span>
          </div>
          <div className="mt-3 h-px w-full bg-sky-400/60" />
          <div className="mt-2.5 flex items-center justify-between text-xs text-sky-100/70">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                <Zap className="h-3 w-3 fill-emerald-300" />
              </span>
              <span>Cantidad total de campañas desarrolladas en el período consultado.</span>
            </span> 
          </div>
        </div>
      </div>

      {/* ═══ INDUSTRIAS (CAMPAÑAS POR SECTOR) ═══ */}
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
                Distribución de campañas por sector
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {selectedIndustria && (
              <button
                type="button"
                onClick={() => setSelectedIndustria(null)}
                className="flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-red-500 cursor-pointer"
                title="Ver todos los sectores"
              >
                <X className="h-3 w-3" strokeWidth={3} />
                Limpiar
              </button>
            )}
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1a355b]">
              {industriasMetrics.length} sectores
            </span>
          </div>
        </div>

        <div
          className="grid flex-1 gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          }}
        >
          {industriasMetrics.map((ind, idx) => {
            const isSelected = selectedIndustria === ind.nombre;
            return (
              <button
                key={ind.nombre}
                type="button"
                onClick={() =>
                  setSelectedIndustria(isSelected ? null : ind.nombre)
                }
                className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer text-left ${
                  isSelected
                    ? "border-[#1a355b] bg-blue-50/90 ring-2 ring-[#1a355b] shadow-sm"
                    : `border-gray-200 bg-linear-to-b from-white to-slate-50/60 ${DIR_HOVER_CLASSES[idx % DIR_HOVER_CLASSES.length]}`
                }`}
                title={`Filtrar campañas por industria: ${ind.nombre}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div
                    className={`rounded-xl p-1.5 ${
                      isSelected
                        ? "bg-[#1a355b] text-white"
                        : DIR_BG_COLORS[idx % DIR_BG_COLORS.length]
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </div>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-[#1a355b] text-white"
                        : "bg-blue-50 text-[#1a355b]"
                    }`}
                  >
                    {ind.porcentaje}%
                  </span>
                </div>
                <div>
                  <h4
                    className={`mb-1 line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-wide ${
                      isSelected ? "text-[#1a355b]" : "text-gray-600"
                    }`}
                    title={ind.nombre}
                  >
                    {ind.nombre}
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black leading-none tracking-tight text-foreground">
                      {ind.count}
                    </span>
                    <span className="text-[10px] font-medium text-gray-500">
                      campaña{ind.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${DIR_COLORS[idx % DIR_COLORS.length]}`}
                      style={{ width: `${ind.porcentaje}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
          {industriasMetrics.length === 0 && (
            <div className="col-span-full flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center text-xs text-gray-400">
              No hay industrias para el filtro seleccionado
            </div>
          )}
        </div>
      </div>

      {/* ═══ COORDINADORES (CAMPAÑAS POR LÍDER DE EQUIPO) ═══ */}
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
                  Campañas por líder de equipo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {selectedCoordinador && (
                <button
                  type="button"
                  onClick={() => onSelectCoordinador(null)}
                  className="flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-500 cursor-pointer"
                  title="Ver todas las campañas"
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                  Limpiar
                </button>
              )}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-xs font-black text-white ring-1 ring-inset ring-white/25">
                {coordinadoresMetrics.length}
              </span>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
          {coordinadoresMetrics.map((coord, idx) => {
            const isSelected = selectedCoordinador === coord.nombre;
            const maxCount = coordinadoresMetrics[0]?.count || 1;
            return (
              <button
                key={coord.nombre}
                type="button"
                onClick={() =>
                  onSelectCoordinador(isSelected ? null : coord.nombre)
                }
                className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-[#1a355b]/25 bg-[#1a355b]/[0.07] shadow-sm"
                    : "cursor-pointer border-transparent hover:border-slate-100 hover:bg-slate-50"
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
                <div className="relative z-10 min-w-0 flex-1">
                  <p
                    className={`truncate text-[11px] font-bold uppercase tracking-wide transition-colors ${
                      isSelected
                        ? "text-[#1a355b]"
                        : "text-gray-700 group-hover:text-[#1a355b]"
                    }`}
                    title={coord.nombre}
                  >
                    {coord.nombre}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {coord.count} campaña{coord.count > 1 ? "s" : ""}
                  </p>
                </div>
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
          {coordinadoresMetrics.length === 0 && (
            <div className="mt-8 text-center text-xs text-gray-400">
              Sin coordinadores asignados
            </div>
          )}
        </div>
      </div>

      {/* ═══ ESTADOS DE SERVIDORES DE CAMPAÑAS (3 CARDS) ═══ */}
      <div className="col-span-1 grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-9">
        {/* Card: En Servidor */}
        <button
          type="button"
          onClick={() => {
            setSelectedEstadoServidor(
              selectedEstadoServidor === "SI" ? null : "SI",
            );
          }}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-linear-to-br from-emerald-50 via-white to-emerald-50/40 ring-emerald-200 cursor-pointer text-left ${
            selectedEstadoServidor === "SI" ? "ring-3 ring-emerald-500 shadow-md" : ""
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                En Servidor
              </h4>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <p className="text-4xl font-black leading-none tracking-tight text-emerald-700">
              {serverMetrics.enServidor}
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {serverMetrics.pctEnServidor}% del total
            </span>
          </div>

          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-black/4">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600"
              style={{ width: `${serverMetrics.pctEnServidor}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] leading-snug text-gray-500">
            Campañas activas en servidor.
          </p>
        </button>

        {/* Card: Sin Servidor */}
        <button
          type="button"
          onClick={() => {
            setSelectedEstadoServidor(
              selectedEstadoServidor === "NO" ? null : "NO",
            );
          }}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-linear-to-br from-slate-50 via-white to-slate-100/60 ring-slate-300 cursor-pointer text-left ${
            selectedEstadoServidor === "NO" ? "ring-3 ring-slate-700 shadow-md" : ""
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                Sin Servidor
              </h4>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
              <AlertCircle className="h-5 w-5" />
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <p className="text-4xl font-black leading-none tracking-tight text-slate-700">
              {serverMetrics.sinServidor}
            </p>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {serverMetrics.pctSinServidor}% del total
            </span>
          </div>

          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-black/4">
            <div
              className="h-full rounded-full bg-linear-to-r from-slate-400 to-slate-600"
              style={{ width: `${serverMetrics.pctSinServidor}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] leading-snug text-gray-500">
            Campañas sin servidor o pendientes por vincular
          </p>
        </button>

        {/* Card: En Migración */}
        <button
          type="button"
          onClick={() => {
            setSelectedEstadoServidor(
              selectedEstadoServidor === "MIGRACION" ? null : "MIGRACION",
            );
          }}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-linear-to-br from-amber-50 via-white to-amber-50/40 ring-amber-200 cursor-pointer text-left ${
            selectedEstadoServidor === "MIGRACION" ? "ring-3 ring-amber-500 shadow-md" : ""
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                En Migración
              </h4>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <p className="text-4xl font-black leading-none tracking-tight text-amber-700">
              {serverMetrics.enMigracion}
            </p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {serverMetrics.pctEnMigracion}% del total
            </span>
          </div>

          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-black/4">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500"
              style={{ width: `${serverMetrics.pctEnMigracion}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] leading-snug text-gray-500">
            Campañas en proceso de migración a servidores
          </p>
        </button>
      </div>
    </div>
  );
}
