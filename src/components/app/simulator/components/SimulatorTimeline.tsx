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
const LEFT_COLUMN_WIDTH = 280;
const VISIBLE_DAYS_AROUND_TODAY = 8;
const LANE_HEIGHT = 28;

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

// Colores exactos de Web Training (Screenshot 3)
function getEstadoColor(estado: string | null): string {
  if (!estado) return "bg-slate-500 hover:bg-slate-600";
  const est = estado.toLowerCase();
  if (est.includes("proceso") || est.includes("curso") || est.includes("desarrollo")) {
    return "bg-orange-500 hover:bg-orange-600"; // Naranja Web Training
  }
  if (est.includes("proyectad") || est.includes("pendient") || est.includes("espera")) {
    return "bg-blue-600 hover:bg-blue-700"; // Azul Web Training
  }
  if (est.includes("finaliza") || est.includes("completa") || est.includes("entrega")) {
    return "bg-emerald-600 hover:bg-emerald-700"; // Verde Web Training
  }
  return "bg-slate-500 hover:bg-slate-600";
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

      records.forEach((rec) => {
        const est = (rec.estado || "").toLowerCase();
        if (est.includes("proceso") || est.includes("curso")) {
          tieneProceso = true;
          totalActivos++;
        } else if (est.includes("proyectad") || est.includes("pendient")) {
          tieneProyectado = true;
          totalActivos++;
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
      else if (tieneProyectado) estadoCampana = "PROYECTADO";

      return {
        estadoCampana,
        tieneProceso,
        tieneProyectado,
        totalActivos,
        totalRecords: records.length,
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
  type Bar = {
    lane: number;
    startIndex: number;
    endIndex: number;
    record: TrainingRecord;
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
        const clippedStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
        const clippedEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()));
        clippedStart.setHours(0, 0, 0, 0);
        clippedEnd.setHours(0, 0, 0, 0);

        if (clippedStart > clippedEnd) return;

        const dayMs = 24 * 60 * 60 * 1000;
        const startIndex = Math.round((clippedStart.getTime() - monthStart.getTime()) / dayMs);
        const endIndex = Math.round((clippedEnd.getTime() - monthStart.getTime()) / dayMs);

        if (startIndex < 0 || endIndex >= timelineDays.length) return;

        let lane = 0;
        while (
          bars.some(
            (b) => b.lane === lane && !(endIndex < b.startIndex || startIndex > b.endIndex)
          )
        ) {
          lane++;
        }

        bars.push({
          lane,
          startIndex,
          endIndex,
          record: rec,
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

  const totalTimelineWidth = LEFT_COLUMN_WIDTH + timelineDays.length * DAY_COLUMN_WIDTH;

  return (
    <div className="flex 2xl:h-[630px] h-[480px] flex-col overflow-hidden rounded-xl ring-2 ring-sky-800/20 bg-white shadow-sm">
      {/* Controles del encabezado (Idéntico a Web Training - Screenshot 3) */}
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
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="rounded-full ring-2 ring-slate-300 bg-white px-4 py-2 pb-3 text-sm font-extrabold capitalize text-slate-800">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:ring-2 ring-amber-600 bg-slate-200 hover:bg-amber-200 text-amber-600 transition cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <div className="relative w-full md:w-72">
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
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase text-white ${colorBadge}`}
                      >
                        {info.estadoCampana}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {info.totalRecords} {info.totalRecords === 1 ? "Pendiente" : "Pendientes"}
                      </span>
                    </div>

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

                    {/* Barras de Procesos / Simuladores */}
                    {bars.map((bar, idx) => {
                      const barGap = 2;
                      const left = bar.startIndex * DAY_COLUMN_WIDTH + barGap;
                      const width =
                        (bar.endIndex - bar.startIndex + 1) * DAY_COLUMN_WIDTH -
                        barGap * 2;
                      const top = 6 + bar.lane * LANE_HEIGHT;
                      const barColor = getEstadoColor(bar.record.estado);

                      const label =
                        bar.record.desarrollador ||
                        bar.record.nombreProceso ||
                        bar.record.aplicativo ||
                        "SIMULADOR";

                      const comp = getDeliveryCompliance(bar.record);

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedRecord(bar.record)}
                          style={{
                            left: `${left}px`,
                            width: `${Math.max(width, 24)}px`,
                            top: `${top}px`,
                          }}
                          className={`absolute h-5 rounded px-2 flex items-center justify-between gap-1 text-[10px] font-bold text-white shadow-xs cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-sm z-10 uppercase ${barColor}`}
                          title={`[${bar.record.estado || "Estado"}] ${bar.record.aplicativo || ""} - ${label} | Real: ${bar.record.fechaReal || "Pendiente"} (${comp.label})`}
                        >
                          <span className="truncate">
                            {label}
                          </span>
                          {comp.status === "delayed" && (
                            <span
                              className="shrink-0 bg-rose-950/80 text-rose-200 px-1 rounded text-[8px] font-black"
                              title={`Retraso de ${comp.diffDays} días`}
                            >
                              +{comp.diffDays}d
                            </span>
                          )}
                          {comp.status === "on_time" && comp.hasRealDate && (
                            <span
                              className="shrink-0 bg-emerald-950/70 text-emerald-200 px-1 rounded text-[8px] font-black"
                              title="A tiempo"
                            >
                              ✓
                            </span>
                          )}
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
