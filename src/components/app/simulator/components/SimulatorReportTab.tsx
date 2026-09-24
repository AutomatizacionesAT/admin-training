import { useState, useMemo } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarDays,
  Building2,
  Users,
  Search,
  Eye,
  X,
  Award,
  Crown,
  Monitor,
  Target,
  ChevronDown,
} from "lucide-react";
import type { TrainingRecord } from "../utils/utils";
import { parseDateString, getDeliveryCompliance, calculateSLAStats } from "../utils/utils";
import SimulatorDetailModal from "./SimulatorDetailModal";

interface SimulatorReportTabProps {
  data: TrainingRecord[];
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  selectedDireccion: string | null;
  setSelectedDireccion: (dir: string | null) => void;
  availableYears: number[];
  availableDirecciones: string[];
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
];

export default function SimulatorReportTab({
  data,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDireccion,
  setSelectedDireccion,
  availableYears,
  availableDirecciones,
}: SimulatorReportTabProps) {
  const [selectedCampana, setSelectedCampana] = useState<string | null>(null);
  const [selectedCoordinador, setSelectedCoordinador] = useState<string | null>(null);
  const [selectedIndustria, setSelectedIndustria] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);
  const [complianceFilter, setComplianceFilter] = useState<"all" | "on_time" | "delayed" | "pending_delayed">("all");

  // Coordinadores disponibles únicos
  const availableCoordinadores = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      const c = (d.coordinador || "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [data]);

  // Campañas disponibles
  const availableCampanas = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      const name = (d.campana || d.aplicativo || "").trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtrado base (por Año, Mes, Dirección, Campaña, Coordinador)
  const baseData = useMemo(() => {
    return data.filter((record) => {
      if (selectedDireccion && record.direccion !== selectedDireccion) return false;
      if (selectedCampana && (record.campana || record.aplicativo) !== selectedCampana) return false;
      if (selectedCoordinador && (record.coordinador || "").trim() !== selectedCoordinador) return false;

      const date = parseDateString(record.fechaInicio);
      if (selectedYear !== null) {
        if (!date || date.getFullYear() !== selectedYear) return false;
      }
      if (selectedMonth !== null) {
        if (!date || date.getMonth() !== selectedMonth) return false;
      }

      return true;
    });
  }, [data, selectedDireccion, selectedCampana, selectedCoordinador, selectedYear, selectedMonth]);

  // Industrias calculadas sobre baseData para que siempre estén disponibles para interactuar
  const industrias = useMemo(() => {
    const map = new Map<string, number>();
    baseData.forEach((r) => {
      const ind = (r.industria || "Sin Asignar").trim();
      map.set(ind, (map.get(ind) || 0) + 1);
    });
    const totalBase = baseData.length;
    return Array.from(map.entries())
      .map(([nombre, count]) => ({
        nombre,
        count,
        pct: totalBase > 0 ? ((count / totalBase) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.count - a.count);
  }, [baseData]);

  // Filtrado final aplicando la industria seleccionada
  const filteredData = useMemo(() => {
    if (!selectedIndustria) return baseData;
    return baseData.filter((r) => (r.industria || "Sin Asignar").trim().toLowerCase() === selectedIndustria.trim().toLowerCase());
  }, [baseData, selectedIndustria]);

  // Métricas
  const metrics = useMemo(() => {
    let finalizados = 0;
    let enProceso = 0;
    let proyectados = 0;

    filteredData.forEach((r) => {
      const est = (r.estado || "").toLowerCase();
      if (est.includes("finaliz") || est.includes("entreg") || est.includes("complet")) {
        finalizados++;
      } else if (est.includes("proceso") || est.includes("curso")) {
        enProceso++;
      } else {
        proyectados++;
      }
    });

    const total = filteredData.length;
    const finalizadosPct = total > 0 ? Math.round((finalizados / total) * 100) : 0;
    const enProcesoPct = total > 0 ? Math.round((enProceso / total) * 100) : 0;
    const proyectadosPct = total > 0 ? Math.round((proyectados / total) * 100) : 0;

    return {
      total,
      finalizados,
      finalizadosPct,
      enProceso,
      enProcesoPct,
      proyectados,
      proyectadosPct,
    };
  }, [filteredData]);

  // Estadísticas de Cumplimiento de Entregas (SLA)
  const slaStats = useMemo(() => calculateSLAStats(filteredData), [filteredData]);

  // Coordinadores
  const coordinadores = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((r) => {
      const c = (r.coordinador || "Sin Asignar").trim();
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Tabla filtrada por buscador y por cumplimiento SLA
  const tableData = useMemo(() => {
    let list = filteredData;
    if (complianceFilter !== "all") {
      list = list.filter((r) => {
        const comp = getDeliveryCompliance(r);
        return comp.status === complianceFilter;
      });
    }
    if (!tableSearch) return list;
    const term = tableSearch.toLowerCase();
    return list.filter(
      (r) =>
        (r.nombreProceso && r.nombreProceso.toLowerCase().includes(term)) ||
        (r.aplicativo && r.aplicativo.toLowerCase().includes(term)) ||
        (r.campana && r.campana.toLowerCase().includes(term)) ||
        (r.desarrollador && r.desarrollador.toLowerCase().includes(term)) ||
        (r.coordinador && r.coordinador.toLowerCase().includes(term))
    );
  }, [filteredData, complianceFilter, tableSearch]);

  // Cantidad de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedYear !== null) count++;
    if (selectedMonth !== null) count++;
    if (selectedDireccion !== null) count++;
    if (selectedCampana !== null) count++;
    if (selectedCoordinador !== null) count++;
    if (selectedIndustria !== null) count++;
    if (complianceFilter !== "all") count++;
    if (tableSearch.trim() !== "") count++;
    return count;
  }, [
    selectedYear,
    selectedMonth,
    selectedDireccion,
    selectedCampana,
    selectedCoordinador,
    selectedIndustria,
    complianceFilter,
    tableSearch,
  ]);

  const handleClearFilters = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDireccion(null);
    setSelectedCampana(null);
    setSelectedCoordinador(null);
    setSelectedIndustria(null);
    setComplianceFilter("all");
    setTableSearch("");
  };

  return (
    <div className="space-y-6">
      {/* 1. Barra de Filtros Moderna & Dinámica */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all space-y-4">
        {/* Línea decorativa superior con degradado */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-600" />

        {/* Fila Superior: Encabezado, Selector Rápido de Años y Botón Limpiar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-amber-950 shadow-sm shadow-amber-500/20 shrink-0">
              <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-slate-800 uppercase">
                  Filtros de Control
                </span>
                {activeFiltersCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {activeFiltersCount} activo{activeFiltersCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                    Histórico completo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Mostrando <strong className="text-slate-800 font-bold">{filteredData.length}</strong> de {data.length} simuladores registrados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            {/* Botones Rápidos de Año (Histórico / Todos + Años específicos) */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setSelectedYear(null)}
                title="Mostrar registros de todos los años"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${selectedYear === null
                  ? "bg-white text-indigo-950 shadow-sm border border-slate-200/80 font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
              >
                Todos los años
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${selectedYear === yr
                    ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Botón Limpiar Filtros */}
            <button
              onClick={handleClearFilters}
              disabled={activeFiltersCount === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeFiltersCount > 0
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 active:scale-95"
                : "bg-slate-100 text-slate-400 border border-slate-200/60 opacity-60 cursor-not-allowed"
                }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${activeFiltersCount > 0 ? "hover:rotate-180 transition-transform duration-500" : ""}`} />
              Limpiar {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
            </button>
          </div>
        </div>

        {/* Fila Inferior: Píldoras de Filtros Específicos */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Año Select */}
          <div
            className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition-all ${selectedYear !== null
              ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 text-amber-950 font-semibold shadow-xs"
              : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
              } border`}
          >
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${selectedYear !== null ? "text-amber-600" : "text-amber-500"}`} />
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedYear !== null ? "text-amber-800" : "text-slate-400"}`}>
                Año
              </span>
              <select
                value={selectedYear === null ? "" : selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === "" ? null : Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-4 appearance-none text-xs"
              >
                <option value="">Todos los años</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3 shrink-0" />
            {selectedYear !== null && (
              <button
                type="button"
                onClick={() => setSelectedYear(null)}
                title="Quitar filtro de año"
                className="ml-1 p-0.5 rounded-full hover:bg-amber-200/60 text-amber-700 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mes Select */}
          <div
            className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition-all ${selectedMonth !== null
              ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 text-amber-950 font-semibold shadow-xs"
              : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
              } border`}
          >
            <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${selectedMonth !== null ? "text-blue-600" : "text-blue-500"}`} />
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedMonth !== null ? "text-amber-800" : "text-slate-400"}`}>
                Mes
              </span>
              <select
                value={selectedMonth === null ? "" : selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === "" ? null : Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-4 appearance-none text-xs"
              >
                <option value="">Todos los meses</option>
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3 shrink-0" />
            {selectedMonth !== null && (
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                title="Quitar filtro de mes"
                className="ml-1 p-0.5 rounded-full hover:bg-amber-200/60 text-amber-700 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dirección Select */}
          <div
            className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition-all ${selectedDireccion !== null
              ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 text-amber-950 font-semibold shadow-xs"
              : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
              } border`}
          >
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${selectedDireccion !== null ? "text-purple-600" : "text-purple-500"}`} />
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedDireccion !== null ? "text-amber-800" : "text-slate-400"}`}>
                Dirección
              </span>
              <select
                value={selectedDireccion || ""}
                onChange={(e) => setSelectedDireccion(e.target.value || null)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-4 appearance-none text-xs max-w-[170px] truncate"
              >
                <option value="">Todas las direcciones</option>
                {availableDirecciones.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3 shrink-0" />
            {selectedDireccion !== null && (
              <button
                type="button"
                onClick={() => setSelectedDireccion(null)}
                title="Quitar filtro de dirección"
                className="ml-1 p-0.5 rounded-full hover:bg-amber-200/60 text-amber-700 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Campaña Select */}
          <div
            className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition-all ${selectedCampana !== null
              ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 text-amber-950 font-semibold shadow-xs"
              : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
              } border`}
          >
            <Target className={`w-3.5 h-3.5 shrink-0 ${selectedCampana !== null ? "text-emerald-600" : "text-emerald-500"}`} />
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedCampana !== null ? "text-amber-800" : "text-slate-400"}`}>
                Campaña
              </span>
              <select
                value={selectedCampana || ""}
                onChange={(e) => setSelectedCampana(e.target.value || null)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-4 appearance-none text-xs max-w-[170px] truncate"
              >
                <option value="">Todas las campañas</option>
                {availableCampanas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3 shrink-0" />
            {selectedCampana !== null && (
              <button
                type="button"
                onClick={() => setSelectedCampana(null)}
                title="Quitar filtro de campaña"
                className="ml-1 p-0.5 rounded-full hover:bg-amber-200/60 text-amber-700 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Coordinador Select */}
          <div
            className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition-all ${selectedCoordinador !== null
              ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 text-amber-950 font-semibold shadow-xs"
              : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
              } border`}
          >
            <Users className={`w-3.5 h-3.5 shrink-0 ${selectedCoordinador !== null ? "text-indigo-600" : "text-indigo-500"}`} />
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedCoordinador !== null ? "text-amber-800" : "text-slate-400"}`}>
                Coordinador
              </span>
              <select
                value={selectedCoordinador || ""}
                onChange={(e) => setSelectedCoordinador(e.target.value || null)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-4 appearance-none text-xs max-w-[170px] truncate"
              >
                <option value="">Todos los coordinadores</option>
                {availableCoordinadores.map((coord) => (
                  <option key={coord} value={coord}>
                    {coord}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3 shrink-0" />
            {selectedCoordinador !== null && (
              <button
                type="button"
                onClick={() => setSelectedCoordinador(null)}
                title="Quitar filtro de coordinador"
                className="ml-1 p-0.5 rounded-full hover:bg-amber-200/60 text-amber-700 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Chip de Industria Activa (si el usuario la seleccionó desde el card) */}
          {selectedIndustria && (
            <div className="flex items-center gap-1.5 bg-amber-100/90 border border-amber-300 px-3 py-1.5 rounded-2xl text-xs font-bold text-amber-900 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider text-amber-700">Industria:</span>
              <span>{selectedIndustria}</span>
              <button
                type="button"
                onClick={() => setSelectedIndustria(null)}
                title="Quitar filtro de industria"
                className="ml-1 p-0.5 rounded-full hover:bg-amber-200 text-amber-800 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Grid de Métricas Principales (Idéntico a Web Training - 12 Columnas) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ═══ TOTAL SIMULADORES (Col 4) ═══ */}
        <div className="group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1a355b] p-6 shadow-[0_14px_38px_-14px_rgb(26_53_91_/0.55)] ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_18px_44px_-14px_rgb(26_53_91_/0.7)] lg:col-span-4 min-h-[220px]">
          {/* capa de brillo diagonal */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-[#0f2340]/70"
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
              maskImage: "linear-gradient(to top right, black, transparent 90%)",
              WebkitMaskImage: "linear-gradient(to top right, black, transparent 90%)",
            }}
          />

          <div className="relative z-10 mb-5 flex w-full items-start justify-between">
            <div className="rounded-lg bg-white/10 p-2.5 text-amber-500 ring-2 ring-inset ring-white/20 backdrop-blur-sm">
              <Monitor className="h-6 w-6" strokeWidth={2} />
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-200 ring-1 ring-inset ring-white/15">
              Base SM (1)
            </span>
          </div>

          <div className="relative z-10">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300/90">
              Total Simuladores
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-6xl font-black leading-none tracking-tight text-white">
                {metrics.total}
              </p>
              <span className="text-sm font-medium text-sky-200/80">
                registros
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-sky-400/60" />
            <p className="mt-2.5 text-xs leading-relaxed text-sky-100/70">
              Cantidad total de simuladores realizados en el período consultado.
            </p>
          </div>
        </div>

        {/* ═══ INDUSTRIAS (Col 5) ═══ */}
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
            <div className="flex items-center gap-1.5">
              {selectedIndustria && (
                <button
                  onClick={() => setSelectedIndustria(null)}
                  className="flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-500 cursor-pointer"
                  title="Quitar filtro de industria"
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                  Limpiar
                </button>
              )}
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1a355b]">
                {industrias.length} sectores
              </span>
            </div>
          </div>

          <div
            className="grid flex-1 gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            }}
          >
            {industrias.map((ind, idx) => {
              const isSelected = selectedIndustria === ind.nombre;
              const bgColors = ["bg-blue-50 text-blue-600", "bg-amber-50 text-amber-600"];
              const barColors = ["from-blue-500 to-cyan-400", "from-amber-500 to-yellow-400"];
              const hoverClasses = [
                "hover:bg-blue-50 hover:ring-blue-400 hover:ring-1",
                "hover:bg-amber-50 hover:ring-amber-400 hover:ring-1",
              ];
              return (
                <button
                  key={ind.nombre}
                  type="button"
                  onClick={() =>
                    setSelectedIndustria(isSelected ? null : ind.nombre)
                  }
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md text-left cursor-pointer ${isSelected
                    ? "border-[#1a355b] bg-[#1a355b]/[0.08] ring-2 ring-[#1a355b] shadow-md scale-[1.02]"
                    : `border-gray-200 bg-gradient-to-b from-white to-slate-50/60 ${hoverClasses[idx % hoverClasses.length]}`
                    }`}
                  title={isSelected ? `Quitar filtro de ${ind.nombre}` : `Filtrar por ${ind.nombre}`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div
                      className={`rounded-xl p-1.5 transition-colors ${isSelected
                        ? "bg-[#1a355b] text-white"
                        : bgColors[idx % bgColors.length]
                        }`}
                    >
                      <Building2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </div>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-colors ${isSelected
                        ? "bg-[#1a355b] text-white ring-1 ring-white/20"
                        : "text-[#1a355b] bg-blue-50"
                        }`}
                    >
                      {ind.pct}%
                    </span>
                  </div>
                  <div>
                    <h4
                      className={`mb-1 line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-wide transition-colors ${isSelected ? "text-[#1a355b]" : "text-gray-600"
                        }`}
                      title={ind.nombre}
                    >
                      {ind.nombre}
                    </h4>
                    <span
                      className={`text-2xl font-black leading-none tracking-tight transition-colors ${isSelected ? "text-[#1a355b]" : "text-slate-900"
                        }`}
                    >
                      {ind.count}
                    </span>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColors[idx % barColors.length]}`}
                        style={{ width: `${ind.pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
            {industrias.length === 0 && (
              <div className="col-span-full flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center text-xs text-gray-400">
                No hay industrias disponibles
              </div>
            )}
          </div>
        </div>

        {/* ═══ COORDINADORES (Col 3, Row span 2, Altura fija 494px) ═══ */}
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
                WebkitMaskImage: "linear-gradient(to left, black, transparent 70%)",
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
                    onClick={() => setSelectedCoordinador(null)}
                    className="flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-500 cursor-pointer"
                    title="Quitar filtro"
                  >
                    <X className="h-3 w-3" strokeWidth={3} />
                    Limpiar
                  </button>
                )}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-xs font-black text-white ring-1 ring-inset ring-white/25">
                  {coordinadores.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto p-3 max-h-[420px]">
            {coordinadores.map((coord, idx) => {
              const isSelected = selectedCoordinador === coord.nombre;
              const maxCount = coordinadores[0]?.count || 1;
              return (
                <button
                  key={coord.nombre}
                  onClick={() =>
                    setSelectedCoordinador(isSelected ? null : coord.nombre)
                  }
                  className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 ${isSelected
                    ? "border-[#1a355b]/25 bg-[#1a355b]/[0.07] shadow-sm"
                    : "cursor-pointer border-transparent hover:border-slate-100 hover:bg-slate-50"
                    }`}
                >
                  {/* barra de progreso de fondo */}
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 left-0 rounded-xl transition-colors ${isSelected ? "bg-[#1a355b]/10" : "bg-slate-100/70"
                      }`}
                    style={{ width: `${(coord.count / maxCount) * 100}%` }}
                  />
                  <span
                    className={`relative z-10 w-4 shrink-0 text-center text-[10px] font-black tabular-nums ${isSelected ? "text-[#1a355b]" : "text-gray-400"
                      }`}
                  >
                    {idx + 1}
                  </span>
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm ring-2 transition-colors ${isSelected
                      ? "bg-[#1a355b] text-white ring-[#1a355b]/20"
                      : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 ring-white"
                      }`}
                  >
                    {coord.nombre.charAt(0).toUpperCase()}
                    {idx < 3 && (
                      <span
                        className={`absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${idx === 0
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
                    className={`relative z-10 min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wide transition-colors ${isSelected
                      ? "text-[#1a355b]"
                      : "text-gray-700 group-hover:text-[#1a355b]"
                      }`}
                    title={coord.nombre}
                  >
                    {coord.nombre}
                  </p>
                  <span
                    className={`relative z-10 shrink-0 rounded-lg px-2 py-0.5 text-xs font-black tabular-nums ring-1 ring-inset transition-colors ${isSelected
                      ? "bg-[#1a355b] text-white ring-[#1a355b]"
                      : "bg-white text-[#1a355b] ring-gray-100 group-hover:ring-[#1a355b]/20"
                      }`}
                  >
                    {coord.count}
                  </span>
                </button>
              );
            })}
            {coordinadores.length === 0 && (
              <div className="mt-8 text-center text-xs text-gray-400">
                Sin coordinadores registrados
              </div>
            )}
          </div>
        </div>

        {/* ═══ ESTADOS DEL PROCESO (Col 9 debajo de Total + Industrias) ═══ */}
        <div className="col-span-1 grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-9">
          {/* ENTREGADOS */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 ring-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-left">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                  Entregados
                </h4>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">
                  {metrics.finalizados}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  {metrics.finalizadosPct}% del total
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  style={{ width: `${metrics.finalizadosPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Simuladores finalizados y entregados al cliente
              </p>
            </div>
          </div>

          {/* EN PROCESO */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 ring-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-left">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                  En Proceso
                </h4>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-700">
                  {metrics.enProceso}
                </span>
                <span className="text-[11px] font-bold text-amber-600">
                  {metrics.enProcesoPct}% del total
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  style={{ width: `${metrics.enProcesoPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Simuladores que se están construyendo actualmente
              </p>
            </div>
          </div>

          {/* PROYECTADOS */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 ring-slate-400 bg-gradient-to-br from-slate-50 via-white to-slate-100/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-left">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900">
                  Proyectados
                </h4>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <Calendar className="h-5 w-5" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-700">
                  {metrics.proyectados}
                </span>
                <span className="text-[11px] font-bold text-slate-600">
                  {metrics.proyectadosPct}% del total
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-600"
                  style={{ width: `${metrics.proyectadosPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Simuladores planeados y pendientes por iniciar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Banner Ejecutivo de Cumplimiento de Entregas (SLA 5 días) */}
      <div className="bg-gradient-to-r from-[#0b1a2f] via-[#132847] to-[#0b1a2f] rounded-2xl p-5 text-white shadow-lg border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Luces de fondo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl"
        />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-950/40 ring-2 ring-white/20">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Efectividad y Cumplimiento SLA
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-300 border border-emerald-400/30">
                Ventana de 5 días
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
              Porcentaje de Cumplimiento en Entregas
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Evaluación de <span className="font-bold text-white">Fecha Entrega Real</span> contra la <span className="font-bold text-white">Fecha Fin Proyectada</span>.
            </p>
          </div>
        </div>

        {/* Métricas Interactivas de SLA */}
        <div className="relative flex flex-wrap items-center gap-3 shrink-0">
          {/* Tarjeta Porcentaje General */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/15 text-center min-w-[125px]">
            <span className="text-[10px] uppercase font-bold text-sky-200 block">
              % Cumplimiento
            </span>
            <span className="text-3xl font-black text-emerald-400 tracking-tight">
              {slaStats.complianceRate}%
            </span>
            <span className="text-[9px] text-slate-300 block mt-0.5">
              {slaStats.onTimeCount} de {slaStats.totalEvaluated} entregas
            </span>
          </div>

          {/* Botón Filtro: A Tiempo */}
          <button
            onClick={() => setComplianceFilter(complianceFilter === "on_time" ? "all" : "on_time")}
            className={`p-3 rounded-xl border text-center transition cursor-pointer min-w-[105px] ${complianceFilter === "on_time"
              ? "bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-300 shadow-md"
              : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
              }`}
            title="Filtrar simuladores entregados a tiempo"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-emerald-300 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>A Tiempo</span>
            </div>
            <span className="text-2xl font-black">{slaStats.onTimeCount}</span>
            <span className="text-[9px] text-slate-300 block">Cumplieron</span>
          </button>

          {/* Botón Filtro: Con Retraso */}
          <button
            onClick={() => setComplianceFilter(complianceFilter === "delayed" ? "all" : "delayed")}
            className={`p-3 rounded-xl border text-center transition cursor-pointer min-w-[105px] ${complianceFilter === "delayed"
              ? "bg-rose-600 text-white border-rose-300 ring-2 ring-rose-300 shadow-md"
              : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
              }`}
            title="Filtrar simuladores entregados con retraso"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-rose-300 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Con Retraso</span>
            </div>
            <span className="text-2xl font-black text-rose-200">{slaStats.delayedCount}</span>
            <span className="text-[9px] text-slate-300 block">Se pasaron</span>
          </button>

          {/* Botón Filtro: Vencidos Pendientes */}
          {slaStats.pendingDelayedCount > 0 && (
            <button
              onClick={() =>
                setComplianceFilter(complianceFilter === "pending_delayed" ? "all" : "pending_delayed")
              }
              className={`p-3 rounded-xl border text-center transition cursor-pointer min-w-[105px] ${complianceFilter === "pending_delayed"
                ? "bg-amber-600 text-white border-amber-300 ring-2 ring-amber-300 shadow-md"
                : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                }`}
              title="Filtrar simuladores con fecha vencida pendientes de entrega"
            >
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-amber-300 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Vencidos</span>
              </div>
              <span className="text-2xl font-black text-amber-200">
                {slaStats.pendingDelayedCount}
              </span>
              <span className="text-[9px] text-slate-300 block">Pendientes</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Tabla Detallada de Registros con Cumplimiento SLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Registros Detallados de Simuladores
              </h4>
              {selectedIndustria && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1a355b] text-white flex items-center gap-1.5">
                  Industria: {selectedIndustria}
                  <button
                    onClick={() => setSelectedIndustria(null)}
                    className="hover:text-amber-300 transition cursor-pointer font-bold"
                    title="Quitar filtro de industria"
                  >
                    ×
                  </button>
                </span>
              )}
              {complianceFilter !== "all" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-white">
                  Filtro: {complianceFilter === "on_time" ? "A Tiempo" : complianceFilter === "delayed" ? "Con Retraso" : "Vencidos"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mostrando {tableData.length} de {filteredData.length} procesos de simulación
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtros rápidos SLA */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
              <button
                onClick={() => setComplianceFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${complianceFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Todos ({filteredData.length})
              </button>
              <button
                onClick={() => setComplianceFilter("on_time")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${complianceFilter === "on_time"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-50"
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                A Tiempo ({slaStats.onTimeCount})
              </button>
              <button
                onClick={() => setComplianceFilter("delayed")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${complianceFilter === "delayed"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-700 hover:bg-rose-50"
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Con Retraso ({slaStats.delayedCount})
              </button>
            </div>

            {/* Buscador */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar proceso, aplicativo o dev..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 rounded-xl border border-slate-200/80 outline-none focus:border-sky-500 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1a2f] text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Aplicativo</th>
                <th className="py-3 px-4">Proceso / Simulador</th>
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Desarrollador</th>
                <th className="py-3 px-4">Plazo Proyectado</th>
                <th className="py-3 px-4">Fecha Entrega Real</th>
                <th className="py-3 px-4">Cumplimiento SLA</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                    No se encontraron procesos simulados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                tableData.map((row, idx) => {
                  const est = (row.estado || "").toLowerCase();
                  const isDone = est.includes("finaliz") || est.includes("entreg") || est.includes("complet");
                  const isProgress = est.includes("proceso") || est.includes("curso");
                  const comp = getDeliveryCompliance(row);

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord(row)}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {row.aplicativo || "N/A"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 max-w-xs truncate">
                        {row.nombreProceso || "Sin nombre"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">
                        {row.campana || "N/A"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {row.desarrollador || "Sin Asignar"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                        {row.fechaInicio || "—"} → {row.fechaFin || "—"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] font-bold">
                        {row.fechaReal ? (
                          <span className="text-slate-900">{row.fechaReal}</span>
                        ) : (
                          <span className="text-slate-400 italic">Pendiente</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${comp.badgeClass}`}
                          title={comp.description}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${comp.dotColor}`} />
                          {comp.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white ${isDone
                            ? "bg-emerald-600"
                            : isProgress
                              ? "bg-orange-500"
                              : "bg-blue-600"
                            }`}
                        >
                          {row.estado || "Pendiente"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(row);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      <SimulatorDetailModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  );
}
