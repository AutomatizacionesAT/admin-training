import { useState, useMemo, useEffect, useCallback } from 'react';
import type { WTReportData } from "../hooks/useWTReportData";
import type { TrainingRecord, EnviosServidoresRecord } from "../utils/utils";
import { parseDateString } from "../utils/utils";
import SearchableSelect from "../utils/SearchableSelect.tsx";
import { fetchControlDeAccesos } from "../../usabilidad_web_training/utils/fetchData";
import {
  EnviosServidoresReportDialog,
  type EstadoServidorFilter,
} from "./EnviosServidoresReportDialog";
import { getCampanaInfo, IMAGEN_POR_DEFECTO } from "./campanas-info";
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
  Search,
  ExternalLink,
  Eye,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  Activity,
  Zap,
} from "lucide-react";

const DIR_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-amber-500 to-yellow-400",
  "from-emerald-500 to-teal-400",
  "from-purple-500 to-pink-400",
  "from-indigo-500 to-blue-400",
];
const DIR_BG_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
  "bg-emerald-50 text-emerald-600",
  "bg-purple-50 text-purple-600",
  "bg-indigo-50 text-indigo-600",
];
const DIR_HOVER_CLASSES = [
  "hover:bg-blue-500 hover:ring-blue-500 hover:ring-1",
  "hover:bg-amber-500 hover:ring-amber-500 hover:ring-1",
  "hover:bg-emerald-500 hover:ring-emerald-500 hover:ring-1",
  "hover:bg-purple-500 hover:ring-purple-500 hover:ring-1",
  "hover:bg-indigo-500 hover:ring-indigo-500 hover:ring-1",
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

export interface UnifiedCampana {
  nombre: string;
  normalizedKey: string;
  usabilidadKey: string;
  isActiva: boolean;
  estadoServidor: EstadoServidorFilter | null;
  rawEstadoServidor: string;
  url: string;
  bases: string;
  coordinadores: string[];
  coordinadorPrincipal: string;
  industrias: string[];
  industriaPrincipal: string;
  direcciones: string[];
  direccionPrincipal: string;
  totalDesarrollos: number;
  desarrollos: TrainingRecord[];
  finalizados: number;
  enProceso: number;
  proyectados: number;
}

interface WTReportCampProps {
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
  enviosServidores: EnviosServidoresRecord[];
}

function normalizarCampana(valor?: string | null): string {
  if (!valor) return "";
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeEstadoServidor(value?: string | null): EstadoServidorFilter | null {
  if (!value) return null;
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (["SI", "TRUE", "VERDADERO", "1", "EN SERVIDOR"].includes(normalized)) return "SI";
  if (["NO", "FALSE", "FALSO", "0", "SIN SERVIDOR"].includes(normalized)) return "NO";
  if (normalized.includes("MIGRACION")) return "MIGRACION";
  return null;
}

export function WTReportCamp({
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
  enviosServidores,
}: WTReportCampProps) {
  const [selectedIndustria, setSelectedIndustria] = useState<string | null>(null);
  const [selectedActividad, setSelectedActividad] = useState<"ALL" | "ACTIVAS" | "INACTIVAS">("ALL");
  const [selectedEstadoServidor, setSelectedEstadoServidor] =
    useState<EstadoServidorFilter | null>(null);
  const [isEnviosReportOpen, setIsEnviosReportOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [activeCampaignDetail, setActiveCampaignDetail] = useState<UnifiedCampana | null>(null);

  // Carga de campañas activas desde CONTROL_DE_ACCESOS (Usabilidad Web Training)
  const [activeCampanasSet, setActiveCampanasSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    fetchControlDeAccesos()
      .then((rows) => {
        if (!isMounted) return;
        const set = new Set<string>();
        rows.forEach((r) => {
          // En UsabilidadWebTraining la clave de campaña activa es `${r.campana} ${r.modulo}`
          const cardKey = `${r.campana || ""} ${r.modulo || ""}`;
          const norm = normalizarCampana(cardKey);
          if (norm) {
            set.add(norm);
          }
        });
        setActiveCampanasSet(set);
      })
      .catch((err) => {
        console.error("Error al cargar campañas activas desde Control de Accesos:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const isCampanaActiva = useCallback(
    (campOrKey: UnifiedCampana | string) => {
      if (activeCampanasSet.size === 0) return false;
      if (typeof campOrKey === "string") {
        const norm = normalizarCampana(campOrKey);
        return activeCampanasSet.has(norm);
      }
      const hasMatchUsabilidad =
        Boolean(campOrKey.usabilidadKey && activeCampanasSet.has(campOrKey.usabilidadKey));
      const hasMatchNombre = activeCampanasSet.has(campOrKey.normalizedKey);
      return Boolean(hasMatchUsabilidad || hasMatchNombre);
    },
    [activeCampanasSet],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // UNIFICACIÓN DE FUENTES DE DATOS (availableCampanas + data + enviosServidores)
  // ══════════════════════════════════════════════════════════════════════════
  const allUnifiedCampanas = useMemo(() => {
    const map = new Map<string, UnifiedCampana>();

    // 1. Cargar desde enviosServidores (~63 registros)
    enviosServidores.forEach((es) => {
      const campName = es.campana?.trim() || "";
      const normKey = normalizarCampana(campName);
      if (!normKey) return;

      // Clave para cruce con Usabilidad (campanasDos + segmentosDos)
      const cDos = es.campanasDos?.trim() || "";
      const sDos = es.segmentosDos?.trim() || "";
      const claveDos = sDos ? `${cDos} ${sDos}`.trim() : cDos;
      const usabilidadKey = normalizarCampana(claveDos);

      const status = normalizeEstadoServidor(es.estadoServidor);
      map.set(normKey, {
        nombre: campName,
        normalizedKey: normKey,
        usabilidadKey: usabilidadKey || normKey,
        isActiva: false,
        estadoServidor: status,
        rawEstadoServidor: es.estadoServidor || "",
        url: es.url || "",
        bases: es.bases || "",
        coordinadores: [],
        coordinadorPrincipal: "Sin Asignar",
        industrias: [],
        industriaPrincipal: "Sin Asignar",
        direcciones: [],
        direccionPrincipal: "Sin Asignar",
        totalDesarrollos: 0,
        desarrollos: [],
        finalizados: 0,
        enProceso: 0,
        proyectados: 0,
      });
    });

    // 2. Unificar con data (Base WT25 / TrainingRecord[])
    data.forEach((rec) => {
      const campName = rec.campana?.trim() || "";
      const normKey = normalizarCampana(campName);
      if (!normKey) return;

      let camp = map.get(normKey);
      if (!camp) {
        camp = {
          nombre: campName,
          normalizedKey: normKey,
          usabilidadKey: normKey,
          isActiva: false,
          estadoServidor: null,
          rawEstadoServidor: "",
          url: "",
          bases: "",
          coordinadores: [],
          coordinadorPrincipal: "Sin Asignar",
          industrias: [],
          industriaPrincipal: "Sin Asignar",
          direcciones: [],
          direccionPrincipal: "Sin Asignar",
          totalDesarrollos: 0,
          desarrollos: [],
          finalizados: 0,
          enProceso: 0,
          proyectados: 0,
        };
        map.set(normKey, camp);
      }

      if (!camp.nombre && campName) {
        camp.nombre = campName;
      }

      camp.desarrollos.push(rec);
      camp.totalDesarrollos++;

      const coord = rec.coordinador?.trim();
      if (coord && !camp.coordinadores.includes(coord)) {
        camp.coordinadores.push(coord);
      }

      const ind = rec.industria?.trim();
      if (ind && !camp.industrias.includes(ind)) {
        camp.industrias.push(ind);
      }

      const dir = rec.direccion?.trim();
      if (dir && !camp.direcciones.includes(dir)) {
        camp.direcciones.push(dir);
      }

      const est = rec.estado?.trim().toUpperCase() ?? "";
      if (
        est === "FINALIZADA" ||
        est === "COMPLETADO" ||
        est === "FINALIZADO" ||
        est === "ENTREGADO"
      ) {
        camp.finalizados++;
      } else if (est === "EN PROCESO" || est === "EN CURSO") {
        camp.enProceso++;
      } else {
        camp.proyectados++;
      }
    });

    // 3. Incluir cualquier campaña en availableCampanas
    availableCampanas.forEach((cName) => {
      const normKey = normalizarCampana(cName);
      if (normKey && !map.has(normKey)) {
        map.set(normKey, {
          nombre: cName.trim(),
          normalizedKey: normKey,
          usabilidadKey: normKey,
          isActiva: false,
          estadoServidor: null,
          rawEstadoServidor: "",
          url: "",
          bases: "",
          coordinadores: [],
          coordinadorPrincipal: "Sin Asignar",
          industrias: [],
          industriaPrincipal: "Sin Asignar",
          direcciones: [],
          direccionPrincipal: "Sin Asignar",
          totalDesarrollos: 0,
          desarrollos: [],
          finalizados: 0,
          enProceso: 0,
          proyectados: 0,
        });
      }
    });

    // 4. Asignar principales y calcular isActiva
    map.forEach((camp) => {
      if (camp.coordinadores.length > 0) {
        camp.coordinadorPrincipal = camp.coordinadores[0];
      }
      if (camp.industrias.length > 0) {
        camp.industriaPrincipal = camp.industrias[0];
      }
      if (camp.direcciones.length > 0) {
        camp.direccionPrincipal = camp.direcciones[0];
      }
      camp.isActiva = isCampanaActiva(camp);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }, [enviosServidores, data, availableCampanas, isCampanaActiva]);

  // Lista unificada para el SearchableSelect del filtro de campañas
  const unifiedCampanasOptions = useMemo(() => {
    return allUnifiedCampanas.map((c) => c.nombre);
  }, [allUnifiedCampanas]);

  // Conteo de campañas activas e inactivas globales
  const actividadCounts = useMemo(() => {
    let activas = 0;
    let inactivas = 0;
    allUnifiedCampanas.forEach((c) => {
      if (c.isActiva) activas++;
      else inactivas++;
    });
    return { activas, inactivas };
  }, [allUnifiedCampanas]);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTRADO DE CAMPAÑAS
  // ══════════════════════════════════════════════════════════════════════════
  const filteredCampanas = useMemo(() => {
    return allUnifiedCampanas.filter((camp) => {
      // Filtro de Actividad (Activas / Inactivas)
      if (selectedActividad === "ACTIVAS") {
        if (!camp.isActiva) return false;
      } else if (selectedActividad === "INACTIVAS") {
        if (camp.isActiva) return false;
      }

      // Filtro de Dirección
      if (selectedDireccion) {
        const matchesDir =
          camp.direcciones.some(
            (d) => normalizarCampana(d) === normalizarCampana(selectedDireccion),
          ) || normalizarCampana(camp.direccionPrincipal) === normalizarCampana(selectedDireccion);
        if (!matchesDir) return false;
      }

      // Filtro de Coordinador
      if (selectedCoordinador) {
        const matchesCoord =
          camp.coordinadores.some(
            (c) => normalizarCampana(c) === normalizarCampana(selectedCoordinador),
          ) || normalizarCampana(camp.coordinadorPrincipal) === normalizarCampana(selectedCoordinador);
        if (!matchesCoord) return false;
      }

      // Filtro de Industria (seleccionable en las tarjetas)
      if (selectedIndustria) {
        const matchesInd =
          camp.industrias.some(
            (i) => normalizarCampana(i) === normalizarCampana(selectedIndustria),
          ) || normalizarCampana(camp.industriaPrincipal) === normalizarCampana(selectedIndustria);
        if (!matchesInd) return false;
      }

      // Filtro de Campaña seleccionada
      if (selectedCampana) {
        if (
          normalizarCampana(camp.nombre) !== normalizarCampana(selectedCampana)
        ) {
          return false;
        }
      }

      // Filtro de Estado de Servidor
      if (selectedEstadoServidor) {
        if (camp.estadoServidor !== selectedEstadoServidor) {
          return false;
        }
      }

      // Filtro por Fecha (Año / Mes si tiene desarrollos asociados)
      if (selectedMonth !== null) {
        const hasDateMatch = camp.desarrollos.some((d) => {
          const parsed = parseDateString(d.fechaInicio);
          return (
            parsed &&
            parsed.getFullYear() === selectedYear &&
            parsed.getMonth() === selectedMonth
          );
        });
        if (camp.desarrollos.length > 0 && !hasDateMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    allUnifiedCampanas,
    selectedActividad,
    selectedDireccion,
    selectedCoordinador,
    selectedIndustria,
    selectedCampana,
    selectedEstadoServidor,
    selectedYear,
    selectedMonth,
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTRICAS CALCULADAS POR CAMPAÑAS
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Coordinadores: Cantidad de campañas ÚNICAS por coordinador
  const coordinadoresMetrics = useMemo(() => {
    const coordMap = new Map<string, Set<string>>();

    const source = allUnifiedCampanas.filter((camp) => {
      if (selectedActividad === "ACTIVAS" && !camp.isActiva) return false;
      if (selectedActividad === "INACTIVAS" && camp.isActiva) return false;
      if (selectedDireccion) {
        const matchesDir =
          camp.direcciones.some(
            (d) => normalizarCampana(d) === normalizarCampana(selectedDireccion),
          ) || normalizarCampana(camp.direccionPrincipal) === normalizarCampana(selectedDireccion);
        if (!matchesDir) return false;
      }
      if (selectedIndustria) {
        const matchesInd =
          camp.industrias.some(
            (i) => normalizarCampana(i) === normalizarCampana(selectedIndustria),
          ) || normalizarCampana(camp.industriaPrincipal) === normalizarCampana(selectedIndustria);
        if (!matchesInd) return false;
      }
      return true;
    });

    source.forEach((camp) => {
      camp.coordinadores.forEach((coord) => {
        if (!coordMap.has(coord)) {
          coordMap.set(coord, new Set<string>());
        }
        coordMap.get(coord)!.add(camp.normalizedKey);
      });
    });

    return Array.from(coordMap.entries())
      .map(([nombre, campanasSet]) => ({
        nombre,
        count: campanasSet.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allUnifiedCampanas, selectedActividad, selectedDireccion, selectedIndustria]);

  // 2. Industrias: Cantidad de campañas ÚNICAS por industria
  const industriasMetrics = useMemo(() => {
    const indMap = new Map<string, Set<string>>();

    // Mostramos todas las industrias según los otros filtros activos para que sigan siendo seleccionables
    const source = allUnifiedCampanas.filter((camp) => {
      if (selectedActividad === "ACTIVAS" && !camp.isActiva) return false;
      if (selectedActividad === "INACTIVAS" && camp.isActiva) return false;
      if (selectedDireccion) {
        const matchesDir =
          camp.direcciones.some(
            (d) => normalizarCampana(d) === normalizarCampana(selectedDireccion),
          ) || normalizarCampana(camp.direccionPrincipal) === normalizarCampana(selectedDireccion);
        if (!matchesDir) return false;
      }
      if (selectedCoordinador) {
        const matchesCoord =
          camp.coordinadores.some(
            (c) => normalizarCampana(c) === normalizarCampana(selectedCoordinador),
          ) || normalizarCampana(camp.coordinadorPrincipal) === normalizarCampana(selectedCoordinador);
        if (!matchesCoord) return false;
      }
      if (selectedCampana) {
        if (normalizarCampana(camp.nombre) !== normalizarCampana(selectedCampana)) return false;
      }
      if (selectedEstadoServidor) {
        if (camp.estadoServidor !== selectedEstadoServidor) return false;
      }
      if (selectedMonth !== null) {
        const hasDateMatch = camp.desarrollos.some((d) => {
          const parsed = parseDateString(d.fechaInicio);
          return (
            parsed &&
            parsed.getFullYear() === selectedYear &&
            parsed.getMonth() === selectedMonth
          );
        });
        if (camp.desarrollos.length > 0 && !hasDateMatch) return false;
      }
      return true;
    });

    const total = source.length;

    source.forEach((camp) => {
      const ind = camp.industriaPrincipal || "Sin Asignar";
      if (!indMap.has(ind)) {
        indMap.set(ind, new Set<string>());
      }
      indMap.get(ind)!.add(camp.normalizedKey);
    });

    return Array.from(indMap.entries())
      .map(([nombre, campSet]) => ({
        nombre,
        count: campSet.size,
        porcentaje: total > 0 ? ((campSet.size / total) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.count - a.count);
  }, [
    allUnifiedCampanas,
    selectedActividad,
    selectedDireccion,
    selectedCoordinador,
    selectedCampana,
    selectedEstadoServidor,
    selectedYear,
    selectedMonth,
  ]);

  // 3. Estados de Servidores de las campañas
  const serverMetrics = useMemo(() => {
    let enServidor = 0;
    let sinServidor = 0;
    let enMigracion = 0;

    filteredCampanas.forEach((camp) => {
      if (camp.estadoServidor === "SI") enServidor++;
      else if (camp.estadoServidor === "MIGRACION") enMigracion++;
      else sinServidor++;
    });

    const total = filteredCampanas.length || 1;

    return {
      enServidor,
      sinServidor,
      enMigracion,
      pctEnServidor: Math.round((enServidor / total) * 100),
      pctSinServidor: Math.round((sinServidor / total) * 100),
      pctEnMigracion: Math.round((enMigracion / total) * 100),
    };
  }, [filteredCampanas]);

  // Filtrado de la tabla local por buscador
  const tableFilteredCampanas = useMemo(() => {
    if (!tableSearch.trim()) return filteredCampanas;
    const term = normalizarCampana(tableSearch);
    return filteredCampanas.filter(
      (c) =>
        normalizarCampana(c.nombre).includes(term) ||
        normalizarCampana(c.coordinadorPrincipal).includes(term) ||
        normalizarCampana(c.industriaPrincipal).includes(term) ||
        c.coordinadores.some((coord) => normalizarCampana(coord).includes(term)),
    );
  }, [filteredCampanas, tableSearch]);

  const activeFiltersCount = [
    selectedMonth !== null,
    selectedDireccion !== null,
    selectedCampana !== null,
    selectedCoordinador !== null,
    selectedIndustria !== null,
    selectedActividad !== "ALL",
    selectedEstadoServidor !== null,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedMonth(null);
    setSelectedDireccion(null);
    setSelectedCampana(null);
    setSelectedIndustria(null);
    setSelectedActividad("ALL");
    onSelectCoordinador(null);
    setSelectedEstadoServidor(null);
    setIsEnviosReportOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ═══ BARRA DE FILTROS ═══ */}
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
              WebkitMaskImage:
                "linear-gradient(to left, black, transparent 100%)",
            }}
          />

          <div className="relative flex flex-wrap items-center gap-x-2 gap-y-3 2xl:gap-x-5">
            <div className="flex w-full items-center gap-2.5 2xl:w-auto">
              <span className="grid size-9 min-w-[60px] place-items-center rounded-lg bg-primary text-chart-3">
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
              <div className="ml-auto flex items-center gap-2 2xl:hidden">
                {activeFiltersCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-blue-500"
                    />
                    {activeFiltersCount}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearFilters}
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

            <span
              aria-hidden="true"
              className="hidden h-9 w-px bg-linear-to-b from-transparent via-gray-200 to-transparent 2xl:block"
            />

            {/* Filtro Año */}
            <div className="flex items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary 2xl:gap-2.5">
              <label
                htmlFor="camp-f-anio"
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
                  id="camp-f-anio"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500"
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
            <div className="flex items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary 2xl:gap-2.5">
              <label
                htmlFor="camp-f-mes"
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
                  id="camp-f-mes"
                  value={selectedMonth === null ? "" : selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500"
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
            <div className="flex items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary 2xl:gap-2.5">
              <label
                htmlFor="camp-f-direccion"
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
                  id="camp-f-direccion"
                  value={selectedDireccion === null ? "" : selectedDireccion}
                  onChange={(e) =>
                    setSelectedDireccion(
                      e.target.value === "" ? null : e.target.value,
                    )
                  }
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500"
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
            <div className="flex items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary sm:w-[260px] 2xl:gap-2.5">
              <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                <Megaphone
                  className="size-3.5 text-amber-500"
                  aria-hidden="true"
                />
                Campaña
              </label>
              <div className="m-0 min-w-0 flex-1 p-0">
                <SearchableSelect
                  value={selectedCampana ?? ""}
                  onSelect={(value) => setSelectedCampana(value || null)}
                  options={unifiedCampanasOptions}
                  placeholder="Todas las campañas"
                  color="morado"
                />
              </div>
            </div>

            {/* Filtro Actividad (ACTIVAS / INACTIVAS) */}
            <div className="flex items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary 2xl:gap-2.5">
              <label
                htmlFor="camp-f-actividad"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground"
              >
                <Activity
                  className="size-3.5 text-amber-500"
                  aria-hidden="true"
                />
                Actividad
              </label>
              <div className="relative">
                <select
                  id="camp-f-actividad"
                  value={selectedActividad}
                  onChange={(e) =>
                    setSelectedActividad(
                      e.target.value as "ALL" | "ACTIVAS" | "INACTIVAS",
                    )
                  }
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500"
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
            <div className="flex items-center gap-2 rounded-sm px-3 py-2 ring-1 ring-inset ring-blue-100/90 transition hover:shadow-sm hover:ring-primary 2xl:gap-2.5">
              <label
                htmlFor="camp-f-servidor"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground"
              >
                <Monitor className="size-3.5 text-amber-500" aria-hidden="true" />
                Servidor
              </label>
              <div className="relative">
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
                  className="peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition hover:bg-primary/40 focus:bg-primary/40 focus:ring-2 focus:ring-yellow-500"
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

            {/* Botón Limpiar Desktop */}
            <div className="ml-auto hidden items-center gap-2 2xl:flex">
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
                onClick={handleClearFilters}
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
        </div>
      </div>

      {/* ═══ GRID SUPERIOR: TOTAL CAMPAÑAS, INDUSTRIAS, COORDINADORES ═══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ═══ TOTAL CAMPAÑAS (CARD PRINCIPAL) ═══ */}
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
                {filteredCampanas.length}
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
                  {actividadCounts.activas} Activas
                </span>
                <span className="text-sky-300/50">·</span>
                <span>{actividadCounts.inactivas} Inactivas</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEnviosReportOpen(true)}
                className="flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 cursor-pointer"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Informe Servidores
              </button>
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
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 ring-emerald-200 cursor-pointer text-left ${
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
              Campañas activas en servidor de entrenamiento
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
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br from-slate-50 via-white to-slate-100/60 ring-slate-300 cursor-pointer text-left ${
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
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br from-amber-50 via-white to-amber-50/40 ring-amber-200 cursor-pointer text-left ${
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
              Campañas en proceso de migración de servidores
            </p>
          </button>
        </div>
      </div>

      {/* ═══ TABLA CONSOLIDADA DE TODAS LAS CAMPAÑAS ═══ */}
      <div className="overflow-hidden rounded-2xl border border-gray-100/70 bg-white shadow-[0_10px_34px_rgb(15,23,42,0.07)]">
        <div className="relative overflow-hidden bg-[#12243d] px-6 py-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              color: "#93c5fd",
              maskImage: "linear-gradient(to right, black, transparent 70%)",
              WebkitMaskImage:
                "linear-gradient(to right, black, transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl"
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
                <Layers className="text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    Listado Consolidado de Campañas
                  </h3>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                  Visualización unificada por campaña{" "}
                  {selectedCoordinador && (
                    <>
                      para el líder{" "}
                      <b className="font-semibold text-amber-400">
                        {selectedCoordinador}
                      </b>{" "}
                    </>
                  )}
                  {selectedIndustria && (
                    <>
                      en el sector{" "}
                      <b className="font-semibold text-sky-300">
                        {selectedIndustria}
                      </b>{" "}
                    </>
                  )}
                  {selectedActividad !== "ALL" && (
                    <>
                      (
                      <b
                        className={`font-semibold ${
                          selectedActividad === "ACTIVAS"
                            ? "text-emerald-400"
                            : "text-slate-300"
                        }`}
                      >
                        {selectedActividad === "ACTIVAS" ? "Solo Activas" : "Solo Inactivas"}
                      </b>
                      )
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-inset ring-white/15">
                <span className="text-2xl font-bold leading-none text-amber-400">
                  {tableFilteredCampanas.length}
                </span>
                <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-300">
                  campañas
                  <br />
                  listadas
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnviosReportOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3.5 py-2.5 text-xs font-bold text-amber-300 ring-1 ring-inset ring-amber-400/30 transition hover:bg-amber-500/30 cursor-pointer"
              >
                <Monitor className="h-4 w-4" />
                Informe Servidores
              </button>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda rápida en tabla */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-slate-50/70 px-6 py-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por campaña, coordinador o industria..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 shadow-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {tableSearch && (
            <button
              onClick={() => setTableSearch("")}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                {[
                  "#",
                  "Campaña",
                  "Estado Actividad",
                  "Coordinador(es)",
                  "Industria",
                  "Desarrollos",
                  "Estado Servidor",
                  "URL Servidor",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="border-b border-slate-200 bg-slate-100/90 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableFilteredCampanas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                      <Megaphone className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      No se encontraron campañas para los filtros seleccionados
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Prueba ajustando los filtros superiores o el término de búsqueda
                    </p>
                  </td>
                </tr>
              )}
              {tableFilteredCampanas.map((camp, index) => {
                const info = getCampanaInfo(camp.nombre);
                const campLogo = info.imagen || IMAGEN_POR_DEFECTO;
                const estadoTone =
                  camp.estadoServidor === "SI"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : camp.estadoServidor === "MIGRACION"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200";

                const estadoLabel =
                  camp.estadoServidor === "SI"
                    ? "EN SERVIDOR"
                    : camp.estadoServidor === "MIGRACION"
                      ? "EN MIGRACION"
                      : "SIN SERVIDOR";

                return (
                  <tr
                    key={camp.normalizedKey}
                    className="group transition-colors hover:bg-blue-50/40"
                  >
                    {/* Index */}
                    <td className="border-b border-slate-200/60 px-4 py-3 text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Campaña con Logo */}
                    <td className="border-b border-slate-200/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-xs">
                          <img
                            src={campLogo}
                            alt={camp.nombre}
                            className="h-full w-full object-cover rounded-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                IMAGEN_POR_DEFECTO;
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-bold text-slate-900 leading-tight uppercase tracking-tight"
                            title={camp.nombre}
                          >
                            {camp.nombre}
                          </p>
                          {camp.direccionPrincipal &&
                            camp.direccionPrincipal !== "Sin Asignar" && (
                              <span className="text-[10px] font-medium text-slate-400">
                                {camp.direccionPrincipal}
                              </span>
                            )}
                        </div>
                      </div>
                    </td>

                    {/* Estado Actividad */}
                    <td className="border-b border-slate-200/60 px-4 py-3 text-xs">
                      {camp.isActiva ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          INACTIVA
                        </span>
                      )}
                    </td>

                    {/* Coordinadores */}
                    <td className="border-b border-slate-200/60 px-4 py-3 text-xs">
                      {camp.coordinadores.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {camp.coordinadores.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-900"
                            >
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-[9px] font-bold text-blue-800">
                                {c.charAt(0)}
                              </span>
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Sin asignar
                        </span>
                      )}
                    </td>

                    {/* Industria */}
                    <td className="border-b border-slate-200/60 px-4 py-3 text-xs font-semibold text-slate-600">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIndustria(
                            selectedIndustria === camp.industriaPrincipal
                              ? null
                              : camp.industriaPrincipal,
                          )
                        }
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                          selectedIndustria === camp.industriaPrincipal
                            ? "bg-[#1a355b] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-900"
                        }`}
                        title="Filtrar por esta industria"
                      >
                        {camp.industriaPrincipal || "Sin Asignar"}
                      </button>
                    </td>

                    {/* Desarrollos */}
                    <td className="border-b border-slate-200/60 px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 border border-amber-200/60">
                          {camp.totalDesarrollos}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          desarrollo{camp.totalDesarrollos !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>

                    {/* Estado Servidor */}
                    <td className="border-b border-slate-200/60 px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${estadoTone}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            camp.estadoServidor === "SI"
                              ? "bg-emerald-500"
                              : camp.estadoServidor === "MIGRACION"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                          }`}
                        />
                        {estadoLabel}
                      </span>
                    </td>

                    {/* URL Servidor */}
                    <td className="border-b border-slate-200/60 px-4 py-3 text-xs">
                      {camp.url ? (
                        <a
                          href={camp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-700 transition hover:bg-sky-100 hover:text-sky-900"
                          title={camp.url}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Abrir enlace</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="border-b border-slate-200/60 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setActiveCampaignDetail(camp)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#1a355b] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#12243d] cursor-pointer"
                        title="Ver desarrollos de esta campaña"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver detalle</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ DIALOG: REPORTE GENERAL DE SERVIDORES ═══ */}
      <EnviosServidoresReportDialog
        open={isEnviosReportOpen}
        records={enviosServidores}
        selectedStatus={selectedEstadoServidor}
        onClose={() => setIsEnviosReportOpen(false)}
      />

      {/* ═══ DIALOG: DETALLES DE DESARROLLOS DE LA CAMPAÑA SELECCIONADA ═══ */}
      {activeCampaignDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Dialog */}
            <div className="relative overflow-hidden bg-[#12243d] px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-white/20 bg-white/10 p-0.5">
                    <img
                      src={
                        getCampanaInfo(activeCampaignDetail.nombre).imagen ||
                        IMAGEN_POR_DEFECTO
                      }
                      alt={activeCampaignDetail.nombre}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight text-white">
                      {activeCampaignDetail.nombre}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Coordinador:{" "}
                      <b className="text-amber-400">
                        {activeCampaignDetail.coordinadorPrincipal}
                      </b>{" "}
                      | Sector:{" "}
                      <b className="text-sky-300">
                        {activeCampaignDetail.industriaPrincipal}
                      </b>{" "}
                      | Estado:{" "}
                      <b
                        className={
                          activeCampaignDetail.isActiva
                            ? "text-emerald-400"
                            : "text-slate-300"
                        }
                      >
                        {activeCampaignDetail.isActiva ? "ACTIVA" : "INACTIVA"}
                      </b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-3.5 py-2 ring-1 ring-inset ring-white/15">
                    <span className="text-xl font-bold text-amber-400">
                      {activeCampaignDetail.desarrollos.length}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-slate-300 leading-tight">
                      desarrollos
                      <br />
                      asociados
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCampaignDetail(null)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido del Dialog */}
            <div className="overflow-y-auto bg-slate-50 p-6 space-y-4 max-h-[70vh]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Finalizados
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {activeCampaignDetail.finalizados}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                    En Proceso
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {activeCampaignDetail.enProceso}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-100 p-3.5 text-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                    Proyectados
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {activeCampaignDetail.proyectados}
                  </p>
                </div>
              </div>

              {/* Tabla de registros de entrenamiento */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="border-b border-slate-200 bg-slate-100 px-4 py-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Desglose de Desarrollos Registrados
                  </h4>
                </div>
                <div className="max-h-[40vh] overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 font-bold">Desarrollo / Nombre</th>
                        <th className="px-4 py-2.5 font-bold">Fecha Inicio</th>
                        <th className="px-4 py-2.5 font-bold">Fecha Fin</th>
                        <th className="px-4 py-2.5 font-bold">Estado</th>
                        <th className="px-4 py-2.5 font-bold">Desarrollador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCampaignDetail.desarrollos.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">
                            {rec.nombre || rec.desarrollo || "Sin nombre"}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 text-xs">
                            {rec.fechaInicio || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 text-xs">
                            {rec.fechaFin || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-bold">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                rec.estado?.toUpperCase().includes("FINAL") ||
                                rec.estado?.toUpperCase().includes("COMPLET")
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rec.estado?.toUpperCase().includes("PROCESO") ||
                                    rec.estado?.toUpperCase().includes("CURSO")
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {rec.estado || "SIN INICIAR"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 text-xs">
                            {rec.desarrollador || "-"}
                          </td>
                        </tr>
                      ))}
                      {activeCampaignDetail.desarrollos.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-xs text-slate-400"
                          >
                            Esta campaña proviene de Servidores y aún no tiene registros de desarrollo asociados en Base WT25.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
