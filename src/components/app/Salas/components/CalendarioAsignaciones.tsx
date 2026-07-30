import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Sun, Moon, LayoutGrid, Calendar, MapPin,
} from 'lucide-react';
import type { SalaRecord, AsignacionRecord } from '../utils/types';

type Turno = 'GENERAL' | 'MAÑANA' | 'TARDE';

const HEADER_SEDES = new Set(['SEDE', 'SALA', 'TIPO']);

interface Props {
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
  /** Día seleccionado controlado desde el padre */
  selectedDay: number | null;
  /** Sede seleccionada — null = todas */
  selectedSede: string | null;
  /** Notifica al padre: (día, mes, año) — null para deseleccionar */
  onDaySelect: (day: number | null, month: number, year: number) => void;
  onSedeSelect: (sede: string | null) => void;
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const gs = raw.match(/Date\((\d{4}),(\d+),(\d+)\)/);
  if (gs) { const d = new Date(+gs[1], +gs[2], +gs[3]); d.setHours(0,0,0,0); return d; }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw + 'T00:00:00');
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const ymd = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  const fb = new Date(raw);
  return isNaN(fb.getTime()) ? null : fb;
}

function isMañana(h: string) { return !!h && (h.startsWith('06') || h.toLowerCase().includes('mañana')); }
function isTarde(h: string)  { return !!h && (h.startsWith('14') || h.toLowerCase().includes('tarde')); }

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// ── Componente principal ──────────────────────────────────────────────────────

export default function CalendarioAsignaciones({ salas, asignaciones, selectedDay, selectedSede, onDaySelect, onSedeSelect }: Props) {
  const today      = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [turno, setTurno] = useState<Turno>('GENERAL');

  const prevMonth = () => {
    const nm = month === 0 ? 11 : month - 1;
    const ny = month === 0 ? year - 1 : year;
    setMonth(nm); setYear(ny);
    onDaySelect(null, nm, ny); // limpia selección al cambiar mes
  };
  const nextMonth = () => {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    setMonth(nm); setYear(ny);
    onDaySelect(null, nm, ny);
  };

  // ── Sedes desde el catálogo (orden de primera aparición) ────────────────────
  // Usando salas en lugar de asignaciones para mostrar todas las sedes
  // aunque aún no tengan asignaciones aprobadas.
  const sedesActivas = useMemo(() => {
    const seen: string[] = [];
    salas.forEach(s => {
      if (s.sede && !HEADER_SEDES.has(s.sede.toUpperCase()) && !seen.includes(s.sede))
        seen.push(s.sede);
    });
    return seen;
  }, [salas]);

  // ── Filtrar por turno + sede ─────────────────────────────────────────────────
  const filtradas = useMemo(() =>
    asignaciones.filter(a => {
      if (selectedSede && a.sede !== selectedSede) return false;
      if (turno === 'MAÑANA') return isMañana(a.horario);
      if (turno === 'TARDE')  return isTarde(a.horario);
      return true;
    }),
    [asignaciones, turno, selectedSede]
  );

  // ── Mapa de días → asignaciones ──────────────────────────────────────────────
  const dayMap = useMemo(() => {
    const map = new Map<number, { manana: AsignacionRecord[]; tarde: AsignacionRecord[] }>();
    const dias = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= dias; d++) {
      const cur = new Date(year, month, d);
      cur.setHours(0, 0, 0, 0);
      const manana: AsignacionRecord[] = [];
      const tarde:  AsignacionRecord[] = [];

      for (const a of filtradas) {
        const s = parseDate(a.fechaInicial);
        const e = parseDate(a.fechaFin);
        if (!s || !e) continue;
        s.setHours(0,0,0,0); e.setHours(0,0,0,0);
        if (cur >= s && cur <= e) {
          if (isMañana(a.horario)) manana.push(a);
          else if (isTarde(a.horario)) tarde.push(a);
          else manana.push(a);
        }
      }
      if (manana.length || tarde.length) map.set(d, { manana, tarde });
    }
    return map;
  }, [filtradas, year, month]);

  // ── Grid ─────────────────────────────────────────────────────────────────────
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay(); // 0=Dom
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // lunes primero
  const todayD      = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  // ── Resumen del mes ───────────────────────────────────────────────────────────
  const totalDias    = dayMap.size;
  const totalManana  = [...dayMap.values()].reduce((n, v) => n + v.manana.length, 0);
  const totalTarde   = [...dayMap.values()].reduce((n, v) => n + v.tarde.length, 0);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden sticky top-6">

      {/* Header compacto */}
      <div className="bg-linear-to-br from-violet-600 to-indigo-700 px-3 py-2 flex items-center gap-2 text-white">
        <Calendar className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="text-xs font-bold">Calendario de ocupación</span>
      </div>

      <div className="p-3 flex flex-col gap-2">

        {/* Turno filter */}
        <div className="flex gap-1 bg-slate-50 rounded-lg p-0.5">
          {([
            { id: 'GENERAL', label: 'General', Icon: LayoutGrid, active: 'bg-violet-600 text-white shadow-sm' },
            { id: 'MAÑANA',  label: 'Mañana',  Icon: Sun,        active: 'bg-amber-400 text-white shadow-sm' },
            { id: 'TARDE',   label: 'Tarde',   Icon: Moon,       active: 'bg-sky-500 text-white shadow-sm' },
          ] as const).map(({ id, label, Icon, active }) => (
            <button
              key={id}
              onClick={() => { setTurno(id as Turno); onDaySelect(null, month, year); }}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all ${turno === id ? active : 'text-slate-400 hover:bg-white'}`}
            >
              <Icon className="w-2.5 h-2.5" />{label}
            </button>
          ))}
        </div>

        {/* Filtro por sede */}
        {sedesActivas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => { onSedeSelect(null); onDaySelect(null, month, year); }}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${!selectedSede ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
              Todas
            </button>
            {sedesActivas.map(sede => (
              <button
                key={sede}
                onClick={() => { onSedeSelect(sede); onDaySelect(null, month, year); }}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${selectedSede === sede ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
              >
                <MapPin className="w-2.5 h-2.5" />{sede}
              </button>
            ))}
          </div>
        )}

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <p className="text-xs font-bold text-slate-700">{MONTH_NAMES[month]} {year}</p>
          <button onClick={nextMonth} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-0.5">
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} className="text-center text-[9px] font-bold text-slate-400 pb-0.5">{d}</div>
          ))}

          {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const info    = dayMap.get(day);
            const isToday = day === todayD;
            const isSel   = day === selectedDay;
            const hasM    = !!info?.manana.length;
            const hasT    = !!info?.tarde.length;
            const hasBoth = hasM && hasT;

            let cellCls = 'text-slate-300 cursor-default';
            if (isSel)        cellCls = 'bg-violet-600 text-white cursor-pointer';
            else if (hasBoth) cellCls = 'bg-violet-100 text-violet-700 cursor-pointer hover:bg-violet-200';
            else if (hasM)    cellCls = 'bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200';
            else if (hasT)    cellCls = 'bg-sky-100 text-sky-700 cursor-pointer hover:bg-sky-200';

            return (
              <button
                key={day}
                disabled={!info}
                onClick={() => onDaySelect(isSel ? null : day, month, year)}
                className={`relative flex flex-col items-center justify-center h-7 rounded-md text-[10px] font-semibold transition-all ${cellCls} ${isToday ? 'ring-2 ring-violet-400 ring-offset-0' : ''}`}
              >
                {day}
                {info && !isSel && (
                  <div className="flex gap-px absolute bottom-0.5">
                    {hasM && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                    {hasT && <div className="w-1 h-1 rounded-full bg-sky-500" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda + Resumen en una sola fila */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-1.5">
          <div className="flex gap-2 text-[9px] text-slate-500">
            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-amber-200 inline-block" />Mañana</span>
            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-sky-200 inline-block" />Tarde</span>
            <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-violet-200 inline-block" />Ambos</span>
          </div>
          <div className="flex gap-1.5 text-[9px] font-bold">
            <span className="bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-md">{totalDias}d</span>
            <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md">{totalManana}m</span>
            <span className="bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded-md">{totalTarde}t</span>
          </div>
        </div>

        {/* Hint cuando hay filtros activos */}
        {(selectedDay || selectedSede) && (
          <p className="text-[9px] text-center text-violet-500 font-semibold">
            {selectedSede && <span>Sede {selectedSede}</span>}
            {selectedSede && selectedDay && ' · '}
            {selectedDay && <span>Día {selectedDay} de {MONTH_NAMES[month]}</span>}
            {' · '}clic en Todas o ✕ para limpiar
          </p>
        )}
      </div>
    </div>
  );
}
