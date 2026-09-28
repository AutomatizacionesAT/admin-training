import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "../utils/utils";
import { parseDateString, getDeliveryCompliance } from "../utils/utils";
import SimulatorDetailModal from "./SimulatorDetailModal";

export interface SimulatorTimelineProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

const DAY_COLUMN_WIDTH = 96;
const LEFT_COLUMN_WIDTH = 340;
const VISIBLE_DAYS_AROUND_TODAY = 8;
const LANE_HEIGHT = 44; // Aumentado para acomodar 2 líneas por proceso (fecha fin + fecha real)

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHeaderDay(date: Date): { day: string; weekday: string } {
  const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(date);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    weekday: weekday.slice(0, 3).toUpperCase(),
  };
}

// Colores para la barra de fecha fin planificada (línea superior)
function getEstadoColor(estado: string | null): string {
  if (!estado) return "bg-amber-400 hover:bg-amber-500 text-slate-900";
  const est = estado.toLowerCase().trim();
  if (est.includes("proceso") || est.includes("curso") || est.includes("desarrollo")) {
    return "bg-orange-500 hover:bg-orange-600 text-white";
  }
  if (
    est.includes("proyectad") ||
    est.includes("pendient") ||
    est.includes("espera") ||
    est.includes("sin inici") ||
    est.includes("sin_inici") ||
    est === ""
  ) {
    return "bg-amber-400 hover:bg-amber-500 text-slate-900";
  }
  if (est.includes("finaliza") || est.includes("completa") || est.includes("entrega")) {
    return "bg-emerald-600 hover:bg-emerald-700 text-white";
  }
  if (est.includes("cancel") || est.includes("descart") || est.includes("pausa")) {
    return "bg-slate-500 hover:bg-slate-600 text-white";
  }
  return "bg-amber-400 hover:bg-amber-500 text-slate-900";
}



export default function SimulatorTimeline({
  data,
  festivos,
  novedades,
  currentMonth,
  setCurrentMonth,
}: SimulatorTimelineProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 1. Filtrar desarrolladores exclusivos de Simuladores para que NO aparezcan vacaciones de Web Training (Federico, Sebas, Juan Avendaño, etc.)
  const simulatorDevs = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      if (d.desarrollador && d.desarrollador.trim()) {
        set.add(d.desarrollador.toUpperCase().trim());
      }
    });
    return set;
  }, [data]);

  const simulatorNovedades = useMemo(() => {
    return novedades.filter((nov) => {
      const novDev = (nov.desarrollador || "").toUpperCase().trim();
      if (!novDev) return false;
      // Solo mostrar novedades si el desarrollador existe en los registros de Simuladores
      return Array.from(simulatorDevs).some(
        (sDev) => sDev.includes(novDev) || novDev.includes(sDev)
      );
    });
  }, [novedades, simulatorDevs]);

  // Días del mes activo
  const monthStart = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    [currentMonth]
  );
  const monthEnd = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    [currentMonth]
  );

  const monthLabel = useMemo(() => {
    const raw = new Intl.DateTimeFormat("es-CO", {
      month: "long",
      year: "numeric",
    }).format(monthStart);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [monthStart]);

  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    const cursor = new Date(monthStart.getTime());
    while (cursor <= monthEnd) {
      days.push(new Date(cursor.getTime()));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [monthStart, monthEnd]);

  const currentDayKey = useMemo(() => toDayKey(new Date()), []);
  const todayIndex = useMemo(
    () => timelineDays.findIndex((d) => toDayKey(d) === currentDayKey),
    [timelineDays, currentDayKey]
  );

  // Set de festivos
  const festivoMap = useMemo(() => {
    const map = new Map<string, string>();
    festivos.forEach((f) => {
      if (f.festivo) {
        const d = parseDateString(f.festivo);
        if (d) map.set(toDayKey(d), f.festividad || "Festivo");
      }
    });
    return map;
  }, [festivos]);

  // Campañas únicas de Simuladores
  const campanasUnicas = useMemo(() => {
    const set = new Set<string>();

    data.forEach((item) => {
      const name = (item.campana || item.aplicativo || "SIN CAMPAÑA").trim();
      const searchMatch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.aplicativo && item.aplicativo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.nombreProceso && item.nombreProceso.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.desarrollador && item.desarrollador.toLowerCase().includes(searchTerm.toLowerCase()));

      if (searchMatch) {
        set.add(name);
      }
    });

    const list = Array.from(set);

    const getCampanaInfo = (campanaName: string) => {
      const records = data.filter(
        (d) => (d.campana || d.aplicativo || "SIN CAMPAÑA").trim() === campanaName
      );

      let tieneProceso = false;
      let tieneProyectado = false;
      let totalActivos = 0;
      let minStart: number | null = null;
      let finalizados = 0;
      let finalizadosATiempo = 0;
      let finalizadosTarde = 0;
      let enProceso = 0;
      let sinIniciar = 0;
      let pendientesVencidos = 0;
      let pendientesEnPlazo = 0;

      records.forEach((rec) => {
        const est = (rec.estado || "").toLowerCase();
        const comp = getDeliveryCompliance(rec);
        const isFin = est.includes("finaliz") || est.includes("entrega") || est.includes("complet");

        if (isFin) {
          finalizados++;
          if (comp.status === "delayed") {
            finalizadosTarde++;
          } else {
            finalizadosATiempo++;
          }
        } else {
          // Pendiente o En Proceso
          if (est.includes("proceso") || est.includes("curso")) {
            tieneProceso = true;
            enProceso++;
          } else {
            tieneProyectado = true;
            sinIniciar++;
          }
          totalActivos++;

          if (comp.status === "pending_delayed") {
            pendientesVencidos++;
          } else {
            pendientesEnPlazo++;
          }
        }

        const startDate = parseDateString(rec.fechaInicio);
        if (startDate) {
          const t = startDate.getTime();
          if (minStart === null || t < minStart) {
            minStart = t;
          }
        }
      });

      let estadoCampana = "ENTREGADO";
      if (tieneProceso) estadoCampana = "EN PROCESO";
      else if (tieneProyectado || sinIniciar > 0) estadoCampana = "PENDIENTE";

      return {
        estadoCampana,
        tieneProceso,
        tieneProyectado,
        totalActivos,
        totalRecords: records.length,
        finalizados,
        finalizadosATiempo,
        finalizadosTarde,
        enProceso,
        sinIniciar,
        totalPendientes: enProceso + sinIniciar,
        pendientesVencidos,
        pendientesEnPlazo,
        minStart,
      };
    };

    const sorted = list.sort((a, b) => {
      const infoA = getCampanaInfo(a);
      const infoB = getCampanaInfo(b);

      if (infoA.tieneProceso && !infoB.tieneProceso) return -1;
      if (!infoA.tieneProceso && infoB.tieneProceso) return 1;

      if (infoA.tieneProyectado && !infoB.tieneProyectado) return -1;
      if (!infoA.tieneProyectado && infoB.tieneProyectado) return 1;

      if (infoA.minStart !== null && infoB.minStart !== null) {
        return infoA.minStart - infoB.minStart;
      }

      return a.localeCompare(b);
    });

    return sorted.map((c) => ({
      nombre: c,
      info: getCampanaInfo(c),
    }));
  }, [data, searchTerm]);

  // Barras posicionadas por Campaña
  // Cada proceso genera hasta 2 barras stacked: la superior (fechaFin planificada) y la inferior (fechaReal)
  type Bar = {
    lane: number;
    startIndex: number | null;
    endIndex: number | null;
    record: TrainingRecord;
    // Índices de la fecha real (para barra secundaria)
    realStartIndex: number | null;
    realEndIndex: number | null;
  };

  const barsByCampana = useMemo(() => {
    const map = new Map<string, Bar[]>();

    campanasUnicas.forEach(({ nombre: campanaKey }) => {
      const records = data.filter(
        (d) => (d.campana || d.aplicativo || "SIN CAMPAÑA").trim() === campanaKey
      );

      const bars: Bar[] = [];

      const validRecords = records
        .map((rec) => {
          const s = parseDateString(rec.fechaInicio);
          const e = parseDateString(rec.fechaFin) || s;
          return { rec, start: s, end: e };
        })
        .filter((item): item is { rec: TrainingRecord; start: Date; end: Date } => item.start !== null && item.end !== null)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      validRecords.forEach(({ rec, start, end }) => {
        const realDate = parseDateString(rec.fechaReal);
        const maxEnd = realDate && realDate > end ? realDate : end;

        const clippedStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
        const clippedMaxEnd = new Date(Math.min(maxEnd.getTime(), monthEnd.getTime()));
        clippedStart.setHours(0, 0, 0, 0);
        clippedMaxEnd.setHours(0, 0, 0, 0);

        if (clippedStart > clippedMaxEnd) return;

        const dayMs = 24 * 60 * 60 * 1000;

        // Barra 1: Planificada (start -> end)
        let startIndex: number | null = null;
        let endIndex: number | null = null;
        const pClippedStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
        const pClippedEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()));
        pClippedStart.setHours(0, 0, 0, 0);
        pClippedEnd.setHours(0, 0, 0, 0);

        if (pClippedStart <= pClippedEnd) {
          startIndex = Math.round((pClippedStart.getTime() - monthStart.getTime()) / dayMs);
          endIndex = Math.round((pClippedEnd.getTime() - monthStart.getTime()) / dayMs);
          if (startIndex < 0) startIndex = 0;
          if (endIndex >= timelineDays.length) endIndex = timelineDays.length - 1;
        }

        // Barra 2: Fecha real o Progreso
        let realStartIndex: number | null = null;
        let realEndIndex: number | null = null;
        if (realDate) {
          const rClippedStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
          const rClippedEnd = new Date(Math.min(realDate.getTime(), monthEnd.getTime()));
          rClippedStart.setHours(0, 0, 0, 0);
          rClippedEnd.setHours(0, 0, 0, 0);
          if (rClippedStart <= rClippedEnd) {
            realStartIndex = Math.round((rClippedStart.getTime() - monthStart.getTime()) / dayMs);
            realEndIndex = Math.round((rClippedEnd.getTime() - monthStart.getTime()) / dayMs);
            if (realStartIndex < 0) realStartIndex = 0;
            if (realEndIndex >= timelineDays.length) realEndIndex = timelineDays.length - 1;
          }
        } else {
          // Sin fecha real: barra de progreso desde inicio hasta HOY (el día actual)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Solo mostrar progreso si el proceso ya empezó (start <= today)
          if (start <= today) {
            const progressEnd = new Date(Math.min(today.getTime(), monthEnd.getTime()));
            progressEnd.setHours(0, 0, 0, 0);

            const rStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
            rStart.setHours(0, 0, 0, 0);

            if (rStart <= progressEnd) {
              realStartIndex = Math.round((rStart.getTime() - monthStart.getTime()) / dayMs);
              realEndIndex = Math.round((progressEnd.getTime() - monthStart.getTime()) / dayMs);
              if (realEndIndex >= timelineDays.length) realEndIndex = timelineDays.length - 1;
              if (realStartIndex < 0) realStartIndex = 0;
            }
          }
        }

        if (startIndex === null && realStartIndex === null) return;

        const barSpanStart = Math.min(startIndex ?? 999, realStartIndex ?? 999);
        const barSpanEnd = Math.max(endIndex ?? -1, realEndIndex ?? -1);

        let lane = 0;
        while (
          bars.some(
            (b) => {
              const bStart = Math.min(b.startIndex ?? 999, b.realStartIndex ?? 999);
              const bEnd = Math.max(b.endIndex ?? -1, b.realEndIndex ?? -1);
              return b.lane === lane && !(barSpanEnd < bStart || barSpanStart > bEnd);
            }
          )
        ) {
          lane++;
        }

        bars.push({
          lane,
          startIndex,
          endIndex,
          record: rec,
          realStartIndex,
          realEndIndex,
        });
      });

      map.set(campanaKey, bars);
    });

    return map;
  }, [campanasUnicas, data, monthStart, monthEnd, timelineDays.length]);

  // Novedades de desarrolladores de Simuladores
  const novedadesPosicionadas = useMemo(() => {
    type NovItem = {
      startIndex: number;
      endIndex: number;
      record: NovedadesRecord;
    };

    const result: NovItem[] = [];

    simulatorNovedades.forEach((nov) => {
      const start = parseDateString(nov.fechaInicio);
      const end = parseDateString(nov.fechaFin) || start;
      if (!start || !end) return;

      const clippedStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
      const clippedEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()));
      clippedStart.setHours(0, 0, 0, 0);
      clippedEnd.setHours(0, 0, 0, 0);

      if (clippedStart > clippedEnd) return;

      const dayMs = 24 * 60 * 60 * 1000;
      const startIndex = Math.round((clippedStart.getTime() - monthStart.getTime()) / dayMs);
      const endIndex = Math.round((clippedEnd.getTime() - monthStart.getTime()) / dayMs);

      if (startIndex < 0 || endIndex >= timelineDays.length) return;

      result.push({ startIndex, endIndex, record: nov });
    });

    return result;
  }, [simulatorNovedades, monthStart, monthEnd, timelineDays.length]);

  // Auto-scroll inicial centrado en el día de hoy
  useEffect(() => {
    if (!scrollRef.current) return;
    if (todayIndex >= 0) {
      const targetLeft =
        todayIndex * DAY_COLUMN_WIDTH -
        (VISIBLE_DAYS_AROUND_TODAY / 2) * DAY_COLUMN_WIDTH +
        DAY_COLUMN_WIDTH / 2;
      scrollRef.current.scrollLeft = Math.max(0, targetLeft);
    } else {
      scrollRef.current.scrollLeft = 0;
    }
  }, [todayIndex, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    const isCurrentMonth =
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth();

    if (!isCurrentMonth) {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (scrollRef.current && todayIndex >= 0) {
      const targetLeft =
        todayIndex * DAY_COLUMN_WIDTH -
        (VISIBLE_DAYS_AROUND_TODAY / 2) * DAY_COLUMN_WIDTH +
        DAY_COLUMN_WIDTH / 2;
      scrollRef.current.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
    }
  };

  const isTodayMonth = useMemo(() => {
    const today = new Date();
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    );
  }, [currentMonth]);

  const totalTimelineWidth = LEFT_COLUMN_WIDTH + timelineDays.length * DAY_COLUMN_WIDTH;

  return (
    <div className="flex 2xl:h-[630px] h-[480px] flex-col overflow-hidden rounded-xl ring-2 ring-sky-800/20 bg-white shadow-sm">
      {/* Controles del encabezado */}
      <div className="flex flex-col gap-4 bg-slate-100 p-4 px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-slate-800">
            Timeline de Campañas
          </h2>
          <p className="text-xs text-slate-500">
            Vista cronológica mensual por desarrollos
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:ring-2 ring-amber-600 bg-slate-200 hover:bg-amber-200 text-amber-600 transition cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="rounded-full ring-2 ring-slate-300 bg-white px-4 py-2 pb-3 text-sm font-extrabold capitalize text-slate-800 min-w-[130px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:ring-2 ring-amber-600 bg-slate-200 hover:bg-amber-200 text-amber-600 transition cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Botón DÍA DE HOY */}
          <button
            type="button"
            onClick={handleGoToToday}
            className={`flex items-center gap-1.5 rounded-sm px-3 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs active:scale-95 shrink-0 ${isTodayMonth
              ? "bg-amber-400 hover:bg-amber-500 text-slate-950 ring-2 ring-amber-500"
              : "bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-950 ring-2 ring-slate-300 hover:ring-amber-400"
              }`}
            title="Ir al mes actual y centrar en el día de hoy"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-indigo-600" />
            <span>Día de Hoy</span>
            {!isTodayMonth && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b365d]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por campaña o cliente..."
              className="w-full rounded-sm ring-2 ring-slate-300 text-[#1b365d] bg-[#1b365d]/10 py-2 pl-9 pr-8 text-xs font-medium outline-none focus:ring-[#1b365d]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-900 hover:text-red-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LEYENDA DE BARRAS ═══ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Barras:</span>

        {/* En proceso */}
        <div className="flex items-center gap-1.5">
          <div className="h-[8px] w-5 rounded-sm bg-orange-500" />
          <span className="text-[10px] font-semibold text-slate-600">
            <span className="text-orange-600 font-black">─ Naranja</span> = En proceso
          </span>
        </div>

        <div className="h-3 w-px bg-slate-300 shrink-0" />

        {/* Sin iniciar */}
        <div className="flex items-center gap-1.5">
          <div className="h-[8px] w-5 rounded-sm bg-amber-400 ring-1 ring-amber-500/50" />
          <span className="text-[10px] font-semibold text-slate-600">
            <span className="text-amber-600 font-black">─ Amarillo</span> = Sin iniciar
          </span>
        </div>

        <div className="h-3 w-px bg-slate-300 shrink-0" />

        {/* Progreso hasta hoy (Línea 2) */}
        <div className="flex items-center gap-1.5">
          <div className="h-[6px] w-5 rounded-sm bg-sky-500" />
          <span className="text-[10px] font-semibold text-slate-600">
            <span className="text-sky-600 font-black">─ Azul</span> = Progreso hasta hoy
          </span>
        </div>

        <div className="h-3 w-px bg-slate-300 shrink-0" />

        {/* Entregado a tiempo */}
        <div className="flex items-center gap-1.5">
          <div className="h-[8px] w-5 rounded-sm bg-emerald-600" />
          <span className="text-[10px] font-semibold text-slate-600">
            <span className="text-emerald-600 font-black">─ Verde</span> = Entregado a tiempo
          </span>
        </div>

        <div className="h-3 w-px bg-slate-300 shrink-0" />

        {/* Con retraso */}
        <div className="flex items-center gap-1.5">
          <div className="h-[6px] w-5 rounded-sm bg-rose-500" />
          <span className="text-[10px] font-semibold text-slate-600">
            <span className="text-rose-600 font-black">─ Rojo</span> = Tardanza / Con retraso
          </span>
        </div>

        <div className="h-3 w-px bg-slate-300 shrink-0" />

        <span className="text-[9px] text-slate-400 italic">Línea superior = planificado · Línea inferior = real</span>
      </div>

      {/* Tabla Timeline con doble scroll: scroll en X (días) y scroll en Y (campañas) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto m-4 rounded-2xl ring-1 ring-sky-800/20"
      >
        <div style={{ minWidth: totalTimelineWidth }}>
          {/* FRANJA DE NOVEDADES (Solo desarrolladores de Simuladores) */}
          {novedadesPosicionadas.length > 0 && (
            <div
              style={{ width: `${totalTimelineWidth}px` }}
              className="flex bg-slate-800 border-b border-slate-900"
            >
              <div
                style={{ width: `${LEFT_COLUMN_WIDTH}px` }}
                className="sticky left-0 z-30 bg-slate-800 px-4 py-1.5 flex items-center justify-between border-r border-slate-900"
              >
                <span className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                  ⚠️ Novedades ({novedadesPosicionadas.length})
                </span>
              </div>
              <div className="relative z-0 h-8 flex-1 bg-slate-800">
                {novedadesPosicionadas.map((item, idx) => {
                  const barGap = 2;
                  const left = item.startIndex * DAY_COLUMN_WIDTH + barGap;
                  const width =
                    (item.endIndex - item.startIndex + 1) * DAY_COLUMN_WIDTH -
                    barGap * 2;
                  const dev = item.record.desarrollador || "Desarrollador";
                  const nov = item.record.novedad || "Novedad";

                  return (
                    <div
                      key={`nov-${idx}`}
                      className="absolute top-1 flex h-6 items-center truncate rounded-md bg-slate-600 px-2 text-[10px] font-bold text-white transition hover:bg-amber-500 hover:scale-[1.01] cursor-pointer z-20"
                      style={{
                        left,
                        width: Math.max(width, 28),
                      }}
                      title={`Novedad: ${nov}\nDesarrollador: ${dev}\nInicio: ${item.record.fechaInicio} - Fin: ${item.record.fechaFin}`}
                    >
                      <span className="truncate">Novedad: {nov} de ( {dev} )</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DÍAS DEL ENCABEZADO (Sticky top) */}
          <div
            style={{ width: `${totalTimelineWidth}px` }}
            className="sticky top-0 z-20 flex border-b border-slate-200 bg-slate-100 shadow-xs"
          >
            {/* Columna Izquierda Fija: CAMPAÑA / CLIENTE */}
            <div
              style={{ width: `${LEFT_COLUMN_WIDTH}px` }}
              className="sticky left-0 z-30 flex items-center gap-2 border-r border-slate-200 bg-slate-800 px-4 py-3 text-xs font-bold uppercase text-white"
            >
              <CalendarIcon className="h-4 w-4 text-indigo-400" />
              <span>Campaña / Cliente</span>
            </div>

            {/* Días del Mes */}
            <div className="flex flex-1">
              {timelineDays.map((day) => {
                const { day: dayNum, weekday } = formatHeaderDay(day);
                const key = toDayKey(day);
                const isToday = key === currentDayKey;
                const isFestivo = festivoMap.has(key);
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={key}
                    style={{ width: `${DAY_COLUMN_WIDTH}px` }}
                    className={`border-r border-slate-200 py-2 text-center text-[10px] font-bold shrink-0 ${isToday
                      ? "bg-amber-300 ring-2 ring-amber-500 ring-inset text-amber-950 font-black"
                      : isFestivo
                        ? "bg-red-100 text-red-700 ring-2 ring-inset ring-red-300"
                        : isWeekend
                          ? "bg-slate-200/60 text-slate-400"
                          : "text-slate-600"
                      }`}
                  >
                    <div className="uppercase">{weekday}</div>
                    <div
                      className={`text-xs ${isFestivo ? "font-black text-red-700" : "font-extrabold"
                        }`}
                    >
                      {dayNum}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FILAS DE CAMPAÑAS */}
          {campanasUnicas.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No hay campañas registradas para este periodo en Simuladores.
            </div>
          ) : (
            campanasUnicas.map(({ nombre: campana, info }) => {
              const bars = barsByCampana.get(campana) ?? [];
              const laneCount = Math.max(...bars.map((b) => b.lane), -1) + 1;
              const rowHeight = Math.max(laneCount * LANE_HEIGHT + 14, 48);

              const colorBadge = getEstadoColor(info.estadoCampana);

              return (
                <div
                  key={campana}
                  style={{ minHeight: `${rowHeight}px`, width: `${totalTimelineWidth}px` }}
                  className="flex border-b border-slate-200 transition hover:bg-slate-50/50"
                >
                  {/* Columna Izquierda Fija: Nombre Campaña */}
                  <div
                    style={{ width: `${LEFT_COLUMN_WIDTH}px`, minHeight: `${rowHeight}px` }}
                    className="sticky left-0 z-10 flex flex-col justify-center border-r border-slate-200 bg-white px-3 py-2 shrink-0"
                  >
                    {/* Fila 1: badge estado + total */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${colorBadge}`}
                      >
                        {info.estadoCampana}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
                        {info.finalizados} de {info.totalRecords} entregados
                      </span>
                    </div>

                    {/* Fila 2: Desglose claro y transparente (A tiempo vs Tardanza vs Pendientes) */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {/* Entregados a tiempo */}
                      {info.finalizadosATiempo > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800"
                          title={`${info.finalizadosATiempo} entregados a tiempo`}
                        >
                          ✓ {info.finalizadosATiempo} a tiempo
                        </span>
                      )}

                      {/* Entregados con tardanza */}
                      {info.finalizadosTarde > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700 ring-1 ring-rose-300"
                          title={`${info.finalizadosTarde} entregado(s) fuera de la fecha pactada`}
                        >
                          🔴 {info.finalizadosTarde} con tardanza
                        </span>
                      )}

                      {/* Pendientes */}
                      {info.totalPendientes > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-900"
                          title={`${info.totalPendientes} pendientes (${info.enProceso} en proceso, ${info.sinIniciar} sin iniciar)`}
                        >
                          ⏳ {info.totalPendientes} pend.
                          {info.pendientesVencidos > 0 && (
                            <span className="font-black text-rose-600">({info.pendientesVencidos} venc.)</span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Fila 3: Nombre de la Campaña */}
                    <div
                      className="truncate text-xs font-black text-slate-800 uppercase"
                      title={campana}
                    >
                      {campana}
                    </div>
                  </div>

                  {/* Área del Timeline de la fila */}
                  <div
                    className="relative z-0 border-b border-slate-100 flex-1 flex"
                    style={{ minHeight: `${rowHeight}px` }}
                  >
                    {/* Celdas de fondo por día */}
                    {timelineDays.map((day) => {
                      const key = toDayKey(day);
                      const isToday = key === currentDayKey;
                      const isFestivo = festivoMap.has(key);
                      const dayOfWeek = day.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                      return (
                        <div
                          key={key}
                          style={{ width: `${DAY_COLUMN_WIDTH}px` }}
                          className={`border-r border-slate-100 shrink-0 h-full ${isToday
                            ? "bg-amber-100"
                            : isFestivo
                              ? "bg-red-100 ring-1 ring-inset ring-red-200/60"
                              : isWeekend
                                ? "bg-slate-100/70"
                                : ""
                            }`}
                        />
                      );
                    })}

                    {/* Barras de Procesos / Simuladores — 2 líneas por proceso */}
                    {bars.map((bar, idx) => {
                      const barGap = 2;
                      const top = 6 + bar.lane * LANE_HEIGHT;
                      const barColor = getEstadoColor(bar.record.estado);

                      const label =
                        bar.record.desarrollador ||
                        bar.record.nombreProceso ||
                        bar.record.aplicativo ||
                        "SIMULADOR";

                      const comp = getDeliveryCompliance(bar.record);

                      return (
                        <div key={idx} className="absolute z-10" style={{ top: `${top}px`, left: 0, right: 0, pointerEvents: "none" }}>
                          {/* LÍNEA 1: Fecha Fin Planificada (superior) */}
                          {bar.startIndex !== null && bar.endIndex !== null && (() => {
                            const left = bar.startIndex * DAY_COLUMN_WIDTH + barGap;
                            const width = (bar.endIndex - bar.startIndex + 1) * DAY_COLUMN_WIDTH - barGap * 2;
                            return (
                              <div
                                onClick={() => setSelectedRecord(bar.record)}
                                style={{
                                  left: `${left}px`,
                                  width: `${Math.max(width, 24)}px`,
                                  position: "absolute",
                                  top: 0,
                                  pointerEvents: "all",
                                }}
                                className={`h-[18px] rounded-sm px-1.5 flex items-center justify-between gap-1 text-[9px] font-bold shadow-xs cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-sm uppercase ${barColor} opacity-95`}
                                title={`📅 Fecha planificada fin: ${bar.record.fechaFin || "N/A"}\n[${bar.record.estado || "Estado"}] ${bar.record.aplicativo || ""} - ${label}`}
                              >
                                <span className="truncate text-[9px]">{label}</span>
                                {comp.status === "delayed" && (
                                  <span className="shrink-0 bg-rose-950/80 text-rose-200 px-1 rounded text-[8px] font-black">+{comp.diffDays}d</span>
                                )}
                                {comp.status === "on_time" && comp.hasRealDate && (
                                  <span className="shrink-0 bg-emerald-950/70 text-emerald-200 px-1 rounded text-[8px] font-black">✓</span>
                                )}
                              </div>
                            );
                          })()}

                          {/* LÍNEA 2: Progreso / Fecha Real (inferior) */}
                          {bar.realStartIndex !== null && bar.realEndIndex !== null && (() => {
                            const rLeft = bar.realStartIndex * DAY_COLUMN_WIDTH + barGap;
                            const rWidth = (bar.realEndIndex - bar.realStartIndex + 1) * DAY_COLUMN_WIDTH - barGap * 2;
                            const hasReal = Boolean(bar.record.fechaReal);

                            let progressColor = "bg-sky-500 hover:bg-sky-600";
                            let labelText = "▶ Hasta hoy";

                            if (comp.status === "delayed") {
                              progressColor = "bg-rose-600 hover:bg-rose-700 shadow-sm ring-1 ring-rose-400";
                              labelText = `🚨 Real: ${bar.record.fechaReal} (+${comp.diffDays}d tardanza)`;
                            } else if (comp.status === "pending_delayed") {
                              progressColor = "bg-rose-500 hover:bg-rose-600 shadow-sm ring-1 ring-rose-300";
                              labelText = `⚠️ Vencido (+${comp.diffDays}d) ▶ Hasta hoy`;
                            } else if (hasReal) {
                              progressColor = "bg-emerald-600 hover:bg-emerald-700";
                              labelText = `✓ Real: ${bar.record.fechaReal}`;
                            } else {
                              progressColor = "bg-sky-500 hover:bg-sky-600";
                              labelText = "▶ Hasta hoy";
                            }

                            return (
                              <div
                                onClick={() => setSelectedRecord(bar.record)}
                                style={{
                                  left: `${rLeft}px`,
                                  width: `${Math.max(rWidth, 12)}px`,
                                  position: "absolute",
                                  top: 20,
                                  pointerEvents: "all",
                                }}
                                className={`h-[16px] rounded-sm px-1.5 flex items-center gap-1 text-[8px] font-bold text-white cursor-pointer transition-transform hover:scale-[1.01] ${progressColor} opacity-95`}
                                title={hasReal
                                  ? `🏁 Fecha real de entrega: ${bar.record.fechaReal}\nCumplimiento: ${comp.label}\n${comp.description}`
                                  : `📊 Progreso hasta hoy (sin fecha real registrada)\nEstado: ${bar.record.estado || "N/A"}\n${comp.description}`
                                }
                              >
                                <span className="truncate">
                                  {labelText}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
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
