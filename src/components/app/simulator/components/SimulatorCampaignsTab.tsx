import { useState, useMemo, Fragment } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Eye,
  ChevronDown,
  Award,
  Calendar,
  CalendarDays,
  Building,
  Building2,
  Briefcase,
  X,
} from "lucide-react";
import type { TrainingRecord, SLAStats } from "../utils/utils";
import { parseDateString, calculateSLAStats, getDeliveryCompliance } from "../utils/utils";
import SimulatorDetailModal from "./SimulatorDetailModal";

interface SimulatorCampaignsTabProps {
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

interface CampaignGroup {
  campana: string;
  industria: string;
  direccion: string;
  coordinadores: string[];
  totalSimuladores: number;
  finalizados: number;
  enProceso: number;
  proyectados: number;
  records: TrainingRecord[];
  estadoGeneral: "EN PROCESO" | "PROYECTADO" | "FINALIZADA";
  progreso: number;
  slaStats: SLAStats;
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

export default function SimulatorCampaignsTab({
  data,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDireccion,
  setSelectedDireccion,
  availableYears,
  availableDirecciones,
}: SimulatorCampaignsTabProps) {
  const [tableSearch, setTableSearch] = useState("");
  const [selectedIndustria, setSelectedIndustria] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);

  // Industrias únicas
  const availableIndustrias = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      if (d.industria && d.industria.trim()) {
        set.add(d.industria.trim());
      }
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtrar registros
  const filteredData = useMemo(() => {
    return data.filter((record) => {
      if (selectedDireccion && record.direccion !== selectedDireccion) return false;
      if (selectedIndustria && record.industria !== selectedIndustria) return false;

      const date = parseDateString(record.fechaInicio);
      if (selectedYear !== null) {
        if (!date || date.getFullYear() !== selectedYear) return false;
      }
      if (selectedMonth !== null) {
        if (!date || date.getMonth() !== selectedMonth) return false;
      }

      return true;
    });
  }, [data, selectedDireccion, selectedIndustria, selectedYear, selectedMonth]);

  // Agrupar por Campaña
  const campaignGroups = useMemo<CampaignGroup[]>(() => {
    const map = new Map<string, TrainingRecord[]>();

    filteredData.forEach((rec) => {
      const campanaName = (rec.campana || rec.aplicativo || "SIN CAMPAÑA").trim();
      const list = map.get(campanaName) || [];
      list.push(rec);
      map.set(campanaName, list);
    });

    const groups: CampaignGroup[] = [];

    map.forEach((records, campana) => {
      let finalizados = 0;
      let enProceso = 0;
      let proyectados = 0;
      const coordSet = new Set<string>();
      let primaryIndustria = "N/A";
      let primaryDireccion = "N/A";

      records.forEach((r) => {
        if (r.coordinador) coordSet.add(r.coordinador.trim());
        if (r.industria && primaryIndustria === "N/A") primaryIndustria = r.industria;
        if (r.direccion && primaryDireccion === "N/A") primaryDireccion = r.direccion;

        const est = (r.estado || "").toLowerCase();
        if (est.includes("finaliz") || est.includes("entreg") || est.includes("complet")) {
          finalizados++;
        } else if (est.includes("proceso") || est.includes("curso")) {
          enProceso++;
        } else {
          proyectados++;
        }
      });

      const totalSimuladores = records.length;
      const progreso = totalSimuladores > 0 ? Math.round((finalizados / totalSimuladores) * 100) : 0;
      const slaStats = calculateSLAStats(records);

      let estadoGeneral: "EN PROCESO" | "PROYECTADO" | "FINALIZADA" = "FINALIZADA";
      if (enProceso > 0) estadoGeneral = "EN PROCESO";
      else if (proyectados > 0) estadoGeneral = "PROYECTADO";

      groups.push({
        campana,
        industria: primaryIndustria,
        direccion: primaryDireccion,
        coordinadores: Array.from(coordSet),
        totalSimuladores,
        finalizados,
        enProceso,
        proyectados,
        records,
        estadoGeneral,
        progreso,
        slaStats,
      });
    });

    return groups.sort((a, b) => {
      if (a.estadoGeneral === "EN PROCESO" && b.estadoGeneral !== "EN PROCESO") return -1;
      if (a.estadoGeneral !== "EN PROCESO" && b.estadoGeneral === "EN PROCESO") return 1;
      if (a.estadoGeneral === "PROYECTADO" && b.estadoGeneral !== "PROYECTADO") return -1;
      if (a.estadoGeneral !== "PROYECTADO" && b.estadoGeneral === "PROYECTADO") return 1;
      return b.totalSimuladores - a.totalSimuladores;
    });
  }, [filteredData]);

  // Estadísticas globales de SLA
  const globalSLA = useMemo(() => calculateSLAStats(filteredData), [filteredData]);

  // Filtrado de la tabla por buscador
  const filteredCampaignGroups = useMemo(() => {
    if (!tableSearch) return campaignGroups;
    const term = tableSearch.toLowerCase();
    return campaignGroups.filter(
      (g) =>
        g.campana.toLowerCase().includes(term) ||
        g.industria.toLowerCase().includes(term) ||
        g.direccion.toLowerCase().includes(term) ||
        g.coordinadores.some((c) => c.toLowerCase().includes(term))
    );
  }, [campaignGroups, tableSearch]);

  const totalCampanas = campaignGroups.length;
  const campanasEnProceso = campaignGroups.filter((g) => g.estadoGeneral === "EN PROCESO").length;
  const campanasFinalizadas = campaignGroups.filter((g) => g.estadoGeneral === "FINALIZADA").length;

  // Cantidad de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedYear !== null) count++;
    if (selectedMonth !== null) count++;
    if (selectedDireccion !== null) count++;
    if (selectedIndustria !== null) count++;
    if (tableSearch.trim() !== "") count++;
    return count;
  }, [selectedYear, selectedMonth, selectedDireccion, selectedIndustria, tableSearch]);

  const handleClearFilters = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDireccion(null);
    setSelectedIndustria(null);
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
                  Filtros de Campañas
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
                Mostrando <strong className="text-slate-800 font-bold">{campaignGroups.length}</strong> campañas ({filteredData.length} desarrollos)
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

          {/* Industria Select */}
          <div
            className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition-all ${selectedIndustria !== null
              ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 text-amber-950 font-semibold shadow-xs"
              : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
              } border`}
          >
            <Briefcase className={`w-3.5 h-3.5 shrink-0 ${selectedIndustria !== null ? "text-amber-600" : "text-amber-500"}`} />
            <div className="flex flex-col text-left">
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedIndustria !== null ? "text-amber-800" : "text-slate-400"}`}>
                Industria
              </span>
              <select
                value={selectedIndustria || ""}
                onChange={(e) => setSelectedIndustria(e.target.value || null)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-4 appearance-none text-xs max-w-[170px] truncate"
              >
                <option value="">Todas las industrias</option>
                {availableIndustrias.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3 shrink-0" />
            {selectedIndustria !== null && (
              <button
                type="button"
                onClick={() => setSelectedIndustria(null)}
                title="Quitar filtro de industria"
                className="ml-1 p-0.5 rounded-full hover:bg-amber-200/60 text-amber-700 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Ejecutivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Campañas */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Campañas Atendidas
            </span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {totalCampanas}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Clientes con simuladores
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Campañas Activas */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              En Proceso
            </span>
            <div className="text-3xl font-black text-orange-600 tracking-tight">
              {campanasEnProceso}
            </div>
            <span className="text-[11px] text-orange-600/80 font-medium">
              Campañas en desarrollo
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Campañas Entregadas */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Entregadas
            </span>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {campanasFinalizadas}
            </div>
            <span className="text-[11px] text-emerald-600/80 font-medium">
              100% completadas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Volumen Total */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Simuladores
            </span>
            <div className="text-3xl font-black text-blue-600 tracking-tight">
              {filteredData.length}
            </div>
            <span className="text-[11px] text-blue-600/80 font-medium">
              Procesos consolidados
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Cumplimiento SLA Global */}
        <div className="bg-gradient-to-br from-[#0b1a2f] to-[#13253f] text-white p-5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-200 uppercase tracking-wider block mb-1">
              Cumplimiento SLA
            </span>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {globalSLA.complianceRate}%
            </div>
            <span className="text-[11px] text-slate-300 font-medium">
              {globalSLA.onTimeCount} a tiempo · {globalSLA.delayedCount} retraso
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-400/30">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Tabla Consolidada por Campaña */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Desglose Consolidado por Campaña
            </h4>
            <p className="text-xs text-slate-500">
              Mostrando {filteredCampaignGroups.length} campañas
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar campaña o coordinador..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 rounded-xl border border-slate-200/80 outline-none focus:border-sky-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1a2f] text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Campaña / Cliente</th>
                <th className="py-3 px-4">Sector / Dirección</th>
                <th className="py-3 px-4">Coordinador(es)</th>
                <th className="py-3 px-4 text-center">Simuladores</th>
                <th className="py-3 px-4">Cumplimiento SLA</th>
                <th className="py-3 px-4">Avance (%)</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Ver Procesos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaignGroups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                    No se encontraron campañas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCampaignGroups.map((group) => {
                  const isExpanded = expandedCampaign === group.campana;

                  return (
                    <Fragment key={group.campana}>
                      <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? "bg-slate-50" : ""}`}>
                        <td className="py-2.5 px-4 font-bold text-slate-900 uppercase">
                          {group.campana}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <span className="font-semibold block">{group.industria}</span>
                          <span className="text-[10px] text-slate-400">{group.direccion}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 text-xs">
                          {group.coordinadores.join(", ") || "N/A"}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="font-bold text-slate-800">{group.totalSimuladores}</span>
                          <span className="text-[9px] text-slate-400 block">
                            {group.enProceso} act. · {group.finalizados} fin.
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {group.slaStats.totalEvaluated > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${group.slaStats.complianceRate >= 100
                                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                                : "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                                }`}
                              title={`${group.slaStats.onTimeCount} a tiempo, ${group.slaStats.delayedCount} con retraso`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${group.slaStats.complianceRate >= 100 ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                              />
                              {group.slaStats.complianceRate}% ({group.slaStats.onTimeCount}/{group.slaStats.totalEvaluated})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                              En Curso
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 w-36">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-700">
                              <span>{group.progreso}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{ width: `${group.progreso}%` }}
                                className="h-full bg-blue-600 rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${group.estadoGeneral === "FINALIZADA"
                              ? "bg-emerald-600"
                              : group.estadoGeneral === "EN PROCESO"
                                ? "bg-orange-500"
                                : "bg-blue-600"
                              }`}
                          >
                            {group.estadoGeneral}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() =>
                              setExpandedCampaign(isExpanded ? null : group.campana)
                            }
                            className="px-2.5 py-1 text-xs font-bold text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            {isExpanded ? "Ocultar" : "Detalles"}
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""
                                }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Desplegable de Procesos con Cumplimiento SLA */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-slate-50/80 border-b border-slate-200">
                            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                  Procesos de Simulación ({group.records.length})
                                </h5>
                                <span className="text-[11px] text-slate-500 font-semibold">
                                  Cumplimiento de la campaña: {group.slaStats.complianceRate}% ({group.slaStats.onTimeCount} a tiempo, {group.slaStats.delayedCount} con retraso)
                                </span>
                              </div>
                              <div className="divide-y divide-slate-100 text-xs">
                                {group.records.map((r, i) => {
                                  const comp = getDeliveryCompliance(r);

                                  return (
                                    <div
                                      key={i}
                                      onClick={() => setSelectedRecord(r)}
                                      className="py-2.5 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-bold text-slate-800 shrink-0">
                                          {r.aplicativo || "Aplicativo"}:
                                        </span>
                                        <span className="text-slate-600 truncate max-w-sm">
                                          {r.nombreProceso || "Sin nombre"}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="text-[11px] text-slate-400">
                                          Dev: {r.desarrollador || "Sin Asignar"}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-mono">
                                          {r.fechaInicio || "—"} → {r.fechaFin || "—"}
                                        </span>
                                        {r.fechaReal && (
                                          <span className="text-[11px] text-slate-800 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                            Real: {r.fechaReal}
                                          </span>
                                        )}
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${comp.badgeClass}`}
                                          title={comp.description}
                                        >
                                          {comp.label}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase ${(r.estado || "").toLowerCase().includes("finaliz")
                                            ? "bg-emerald-600"
                                            : "bg-orange-500"
                                            }`}
                                        >
                                          {r.estado || "Pendiente"}
                                        </span>
                                        <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-sky-600" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
