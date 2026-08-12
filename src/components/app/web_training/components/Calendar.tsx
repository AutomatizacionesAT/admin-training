import React, { useState, useMemo, useRef, useEffect } from "react";
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

export interface CalendarProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDay: Date | null;
  setSelectedDay: (date: Date | null) => void;
  onEdit?: (record: TrainingRecord) => void;
  onUpdateRecord?: (record: TrainingRecord) => Promise<void>;
  onBatchUpdate?: (
    records: TrainingRecord[],
    deletedIds?: number[],
  ) => Promise<void>;
  estados?: string[];
  onAddRecord?: (record: TrainingRecord) => Promise<void>;
  tiposDesarrollo?: string[];
}

export interface GroupedEvent {
  campana: string;
  coordinador: string | null;
  desarrollador: string | null;
  cliente: string | null;
  segmento: string | null;
  segmentoMenu: string | null;
  formador: string | null;
  fechaMaterial: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  desarrollos: Array<{
    desarrollo: string | null;
    nombre: string | null;
    segmento: string | null;
    cantidad: string | null;
    estado: string | null;
    observaciones: string | null;
    originalRecord?: TrainingRecord;
  }>;
}

// Ancho fijo de cada columna de día (px). Al ser fijo (no 1fr) el timeline
// obliga a scroll horizontal en vez de comprimir todos los días del mes.
const DAY_COLUMN_WIDTH = 96;
const LEFT_COLUMN_WIDTH = 280;
// Cuántos días de "aire" queremos ver alrededor del día actual al abrir el mes.
const VISIBLE_DAYS_AROUND_TODAY = 10;

// Utilidad para parsear string de fecha a Date local.
// La API entrega fechas como "D/M/YYYY" (ej: "23/7/2026", "31/3/2026"),
// por lo que NO se puede delegar en `new Date(str)` (ambiguo/rompe con
// formato día/mes). También soporta "YYYY-MM-DD" por si acaso llega así.
function parseLocalDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Formato D/M/YYYY o DD/MM/YYYY (el real de la API)
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Formato YYYY-MM-DD (ISO)
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Último recurso
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHeaderDay(date: Date): { day: string; weekday: string } {
  const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(
    date,
  );
  return {
    day: String(date.getDate()).padStart(2, "0"),
    weekday: weekday.slice(0, 3),
  };
}

// Mapa de colores según el estado indicado
function getEstadoColor(estado: string | null): string {
  if (!estado) return "bg-slate-500 hover:bg-slate-600";
  const est = estado.toLowerCase();
  if (est.includes("proceso") || est.includes("curso"))
    return "bg-orange-500 hover:bg-orange-600";
  if (est.includes("proyectad") || est.includes("pendient"))
    return "bg-blue-600 hover:bg-blue-700";
  if (
    est.includes("finaliza") ||
    est.includes("completa") ||
    est.includes("entrega")
  )
    return "bg-emerald-600 hover:bg-emerald-700";
  return "bg-slate-500 hover:bg-slate-600";
}

export default function Calendar({
  data,
  festivos,
  novedades,
  currentMonth,
  setCurrentMonth,
  onEdit,
  estados = [],
}: CalendarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 1. Días del mes activo
  const monthStart = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    [currentMonth],
  );
  const monthEnd = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    [currentMonth],
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        month: "long",
        year: "numeric",
      }).format(monthStart),
    [monthStart],
  );

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
    [timelineDays, currentDayKey],
  );

  // Normalizar la lista de festivos a un Set de keys `YYYY-MM-DD` para
  // comparaciones rápidas. Las filas de `festivos` vienen con la propiedad
  // `festivo` en formato `DD/MM/YYYY` o `YYYY-MM-DD` según la fuente, por
  // eso la parseamos con `parseLocalDate` y la convertimos con `toDayKey`.
  const festivoKeys = useMemo(() => {
    const s = new Set<string>();
    festivos.forEach((f) => {
      // `FestivoRecord` usa la propiedad `festivo` (no `fecha`). También
      // toleramos `fecha` por compatibilidad si aparece en otros orígenes.
      const raw = (f as any)?.festivo ?? (f as any)?.fecha ?? null;
      const d = parseLocalDate(raw);
      if (d) s.add(toDayKey(d));
    });
    return s;
  }, [festivos]);

  // 2. Obtener la lista de Campañas / Clientes ordenada y agrupada por Jerarquía de Estado
  const campanasUnicas = useMemo(() => {
    const set = new Set<string>();

    data.forEach((item) => {
      const name = (item.campana || item.cliente || "SIN CAMPAÑA").trim();
      if (
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        set.add(name);
      }
    });

    const list = Array.from(set);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const getCampanaInfo = (campanaName: string) => {
      const records = data.filter(
        (d) => (d.campana || d.cliente || "SIN CAMPAÑA").trim() === campanaName,
      );

      let tieneProceso = false;
      let tieneProyectado = false;

      let minFutureStart: number | null = null;
      let maxPastStart: number | null = null;

      // Contar SOLO los desarrollos que están EN PROCESO o PROYECTADOS
      let desarrollosActivos = 0;

      records.forEach((rec) => {
        const est = (rec.estado || "").toLowerCase();

        const esProceso = est.includes("proceso") || est.includes("curso");
        const esProyectado =
          est.includes("proyectad") ||
          est.includes("pendient") ||
          est.includes("sin iniciar");

        if (esProceso) {
          tieneProceso = true;
          desarrollosActivos++;
        } else if (esProyectado) {
          tieneProyectado = true;
          desarrollosActivos++;
        }

        const startDate = parseLocalDate(rec.fechaInicio);
        if (startDate) {
          const time = startDate.getTime();
          if (time >= now.getTime()) {
            if (minFutureStart === null || time < minFutureStart) {
              minFutureStart = time;
            }
          } else {
            if (maxPastStart === null || time > maxPastStart) {
              maxPastStart = time;
            }
          }
        }
      });

      // Definir estado jerárquico final de la campaña
      let estadoCampana = "ENTREGADO";
      if (tieneProceso) {
        estadoCampana = "EN PROCESO";
      } else if (tieneProyectado) {
        estadoCampana = "PROYECTADO";
      }

      return {
        estadoCampana,
        tieneProceso,
        tieneProyectado,
        minFutureStart,
        maxPastStart,
        desarrollosActivos,
      };
    };

    const sorted = list.sort((a, b) => {
      const infoA = getCampanaInfo(a);
      const infoB = getCampanaInfo(b);

      // 1. Prioridad "EN PROCESO"
      if (infoA.tieneProceso && !infoB.tieneProceso) return -1;
      if (!infoA.tieneProceso && infoB.tieneProceso) return 1;

      // 2. Prioridad "PROYECTADO"
      if (infoA.tieneProyectado && !infoB.tieneProyectado) return -1;
      if (!infoA.tieneProyectado && infoB.tieneProyectado) return 1;

      // 3. Cronológico ascendente para fechas futuras/próximas
      if (infoA.minFutureStart !== null && infoB.minFutureStart !== null) {
        return infoA.minFutureStart - infoB.minFutureStart;
      }
      if (infoA.minFutureStart !== null) return -1;
      if (infoB.minFutureStart !== null) return 1;

      // 4. Cronológico descendente para campañas pasadas
      if (infoA.maxPastStart !== null && infoB.maxPastStart !== null) {
        return infoB.maxPastStart - infoA.maxPastStart;
      }
      if (infoA.maxPastStart !== null) return -1;
      if (infoB.maxPastStart !== null) return 1;

      return a.localeCompare(b);
    });

    return sorted.map((campana) => ({
      nombre: campana,
      info: getCampanaInfo(campana),
    }));
  }, [data, searchTerm]);

  // 3. Agrupar registros por campaña y, dentro de cada campaña, por rango de
  // fechas EXACTO (mismo inicio + mismo fin). Registros con el mismo rango
  // colapsan en una sola barra; rangos distintos generan barras distintas.
  const barsByCampana = useMemo(() => {
    type RawGroup = {
      start: Date;
      end: Date;
      records: TrainingRecord[];
    };

    type Bar = {
      lane: number;
      startIndex: number;
      endIndex: number;
      fechaInicio: string | null;
      fechaFin: string | null;
      desarrollos: TrainingRecord[];
    };

    // 3.1 Agrupar por campaña -> rango de fechas
    const groupsByCampana = new Map<string, Map<string, RawGroup>>();

    data.forEach((record) => {
      const campanaKey = (
        record.campana ||
        record.cliente ||
        "SIN CAMPAÑA"
      ).trim();
      const start = parseLocalDate(record.fechaInicio);
      const end = parseLocalDate(record.fechaFin) || start;

      if (!start || !end) return;

      // Clave del grupo = mismas fechas exactas de inicio y fin
      const rangeKey = `${toDayKey(start)}_${toDayKey(end)}`;

      if (!groupsByCampana.has(campanaKey))
        groupsByCampana.set(campanaKey, new Map());
      const campanaGroups = groupsByCampana.get(campanaKey)!;

      const existing = campanaGroups.get(rangeKey);
      if (existing) {
        existing.records.push(record);
      } else {
        campanaGroups.set(rangeKey, { start, end, records: [record] });
      }
    });

    // 3.2 Convertir cada grupo en una barra posicionada (usando SUS propias
    // fechas, no las de otros grupos) y asignar carriles (lanes) solo entre
    // grupos que se solapan dentro de la misma campaña.
    const map = new Map<string, Bar[]>();

    groupsByCampana.forEach((campanaGroups, campanaKey) => {
      const bars: Bar[] = [];

      const sortedGroups = Array.from(campanaGroups.values()).sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );

      sortedGroups.forEach((group) => {
        // Recortar al mes visible
        const clippedStart = new Date(
          Math.max(group.start.getTime(), monthStart.getTime()),
        );
        const clippedEnd = new Date(
          Math.min(group.end.getTime(), monthEnd.getTime()),
        );
        clippedStart.setHours(0, 0, 0, 0);
        clippedEnd.setHours(0, 0, 0, 0);

        if (clippedStart > clippedEnd) return; // El grupo no cae en el mes visible

        const dayMs = 24 * 60 * 60 * 1000;
        const startIndex = Math.round(
          (clippedStart.getTime() - monthStart.getTime()) / dayMs,
        );
        const endIndex = Math.round(
          (clippedEnd.getTime() - monthStart.getTime()) / dayMs,
        );

        if (startIndex < 0 || endIndex >= timelineDays.length) return;

        let lane = 0;
        while (
          bars.some(
            (b) =>
              b.lane === lane &&
              !(endIndex < b.startIndex || startIndex > b.endIndex),
          )
        ) {
          lane++;
        }

        bars.push({
          lane,
          startIndex,
          endIndex,
          fechaInicio: group.records[0].fechaInicio,
          fechaFin: group.records[0].fechaFin,
          desarrollos: group.records,
        });
      });

      map.set(campanaKey, bars);
    });

    return map;
  }, [data, monthStart, monthEnd, timelineDays.length]);

  // Navegación de meses
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const timelineLaneHeight = 30;
  const timelineBarInset = 4;

  // Al cambiar de mes, centra el scroll horizontal alrededor del día actual
  // (si el mes visible lo contiene) o, si no, deja el inicio del mes visible.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (todayIndex >= 0) {
      const targetLeft =
        todayIndex * DAY_COLUMN_WIDTH -
        (VISIBLE_DAYS_AROUND_TODAY / 2) * DAY_COLUMN_WIDTH +
        DAY_COLUMN_WIDTH / 2;
      el.scrollLeft = Math.max(0, targetLeft);
    } else {
      el.scrollLeft = 0;
    }
  }, [todayIndex, currentMonth]);

  const gridTemplate = `${LEFT_COLUMN_WIDTH}px repeat(${timelineDays.length}, ${DAY_COLUMN_WIDTH}px)`;
  const totalTimelineWidth =
    LEFT_COLUMN_WIDTH + timelineDays.length * DAY_COLUMN_WIDTH;

  return (
    <div className="flex 2xl:h-[530px] h-[400px] flex-col overflow-hidden rounded-xl ring-2 ring-sky-800/20 bg-white shadow-sm">
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
            className="flex h-8 w-8 items-center justify-center rounded-full hover:ring-2 ring-amber-600 bg-slate-200 hover:bg-amber-200 text-amber-600 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="rounded-full ring-2 ring-slate-300 bg-white px-4 py-2 pb-3 text-sm font-extrabold capitalize text-slate-800">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:ring-2 ring-amber-600 bg-slate-200 hover:bg-amber-200 text-amber-600 transition"
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
            className="w-full rounded-sm ring-2 ring-slate-300 text-[#1b365d] bg-[#1b365d]/30 py-2 pl-9 pr-8 text-xs font-medium outline-none focus:ring-[#1b365d]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-900 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla Timeline: scroll en X (días) y en Y (campañas) */}
      <div ref={scrollRef} className="flex-1 overflow-auto m-4 rounded-2xl ring-1 ring-sky-800/20">
        <div style={{ minWidth: totalTimelineWidth }}>
          {/* Cabecera de Días */}
          <div
            className="sticky top-0 z-40 grid border-b border-slate-200 bg-slate-300 text-slate-900 text-[10px] font-bold uppercase "
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="sticky left-0 z-50 flex items-center gap-2 border-r border-slate-200 bg-[#254a80] px-4 py-3 text-xs font-bold uppercase text-background">
              <CalendarIcon className="h-4 w-4 text-amber-600" />
              <span>Campaña / Cliente</span>
            </div>
            {timelineDays.map((day) => {
              const { day: dayNum, weekday } = formatHeaderDay(day);
              const key = toDayKey(day);
              const isToday = key === currentDayKey;
              const isFestivo = festivoKeys.has(key);
              const dayOfWeek = day.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado

              return (
                <div
                  key={key}
                  className={`border-r border-slate-200 py-2 text-center text-[10px] font-bold ${
                    isToday
                      ? "bg-amber-300 text-amber-950 font-black"
                      : isFestivo
                        ? "bg-red-100 text-red-700 ring-1 ring-inset ring-red-300"
                        : isWeekend
                          ? "bg-slate-200/60 text-slate-400"
                          : "text-slate-600"
                  }`}
                >
                  <div>{weekday}</div>
                  <div
                    className={`text-xs ${isFestivo ? "font-black text-red-700" : "font-extrabold"}`}
                  >
                    {dayNum}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filas de Campañas */}
          {campanasUnicas.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No hay campañas registradas para este periodo.
            </div>
          ) : (
            campanasUnicas.map(({ nombre: campana, info }) => {
              const bars = barsByCampana.get(campana) ?? [];
              const laneCount = Math.max(...bars.map((b) => b.lane), -1) + 1;
              const rowHeight = Math.max(
                laneCount * timelineLaneHeight + 12,
                48,
              );

              const colorBadge = getEstadoColor(info.estadoCampana);
              const mostrarCantidad =
                info.estadoCampana !== "ENTREGADO" &&
                info.desarrollosActivos > 0;

              return (
                <div
                  key={campana}
                  className="grid border-b border-slate-200 transition hover:bg-slate-50/50"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {/* Columna Izquierda Fija: Badge + Nombre Campaña */}
                  <div
                    className="sticky left-0 z-10 flex flex-col justify-center border-r border-slate-200 bg-white px-3 py-2"
                    style={{ minHeight: rowHeight }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase text-white ${colorBadge}`}
                      >
                        {info.estadoCampana}
                      </span>
                      {mostrarCantidad && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {info.desarrollosActivos}{" "}
                          {info.desarrollosActivos === 1 ? "Pendientes" : "Pendientes"}
                        </span>
                      )}
                    </div>

                    <div
                      className="truncate text-xs font-black text-slate-800"
                      title={campana}
                    >
                      {campana}
                    </div>
                  </div>

                  {/* Área del Timeline de la fila */}
                  <div
                    className="relative z-0 border-b border-slate-100"
                    style={{
                      gridColumn: `2 / -1`,
                      minHeight: rowHeight,
                    }}
                  >
                    {/* Celdas de fondo por día */}
                    <div
                      className="absolute inset-0 grid"
                      style={{
                        gridTemplateColumns: `repeat(${timelineDays.length}, ${DAY_COLUMN_WIDTH}px)`,
                      }}
                    >
                      {timelineDays.map((day) => {
                        const key = toDayKey(day);
                        const isToday = key === currentDayKey;
                        const isFestivo = festivoKeys.has(key);
                        const dayOfWeek = day.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        return (
                          <div
                            key={key}
                            className={`border-r border-slate-100 ${
                              isToday
                                ? "bg-amber-50/40"
                                : isFestivo
                                  ? "bg-red-50/80 ring-1 ring-inset ring-red-200/60"
                                  : isWeekend
                                    ? "bg-slate-100/70"
                                    : ""
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Barras agrupadas por rango de fechas */}
                    {bars.map((bar) => {
                      const barGap = 3;
                      const left = bar.startIndex * DAY_COLUMN_WIDTH + barGap;
                      const width =
                        (bar.endIndex - bar.startIndex + 1) * DAY_COLUMN_WIDTH -
                        barGap * 2;
                      const top =
                        bar.lane * timelineLaneHeight + timelineBarInset;

                      const primerRegistro = bar.desarrollos[0];
                      const colorClass = getEstadoColor(primerRegistro.estado);
                      const cantidad = bar.desarrollos.length;
                      const nombrePrincipal =
                        primerRegistro.desarrollador || "Sin desarrollador";
                      const etiqueta =
                        cantidad > 1
                          ? `${nombrePrincipal} +${cantidad - 1}`
                          : nombrePrincipal;

                      const detalleDesarrollos = bar.desarrollos
                        .map(
                          (d) =>
                            `• ${d.desarrollador || "Sin desarrollador"} (${d.estado || "Sin estado"})`,
                        )
                        .join("\n");

                      return (
                        <button
                          key={`${bar.startIndex}-${bar.endIndex}-${bar.lane}`}
                          type="button"
                          onClick={() => {
                            setSelectedRecord(primerRegistro);
                            if (onEdit) onEdit(primerRegistro);
                          }}
                          className={`absolute z-20 flex h-6 items-center truncate rounded-md px-2 text-left text-[10px] font-bold text-white shadow-sm ring-1 ring-white/30 transition hover:z-30 hover:shadow-md ${colorClass}`}
                          style={{
                            left,
                            width: Math.max(width, 18),
                            top,
                          }}
                          title={`Campaña: ${campana}\nInicio: ${bar.fechaInicio} - Fin: ${bar.fechaFin}\n${detalleDesarrollos}`}
                        >
                          {etiqueta}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
