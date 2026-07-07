import { useState, useMemo } from 'react';
import {
  X, BarChart3, Users, Building2, Ticket, Clock,
  TrendingUp, Award, Activity, Sun, Moon, MapPin,
  CheckCircle, Percent,
} from 'lucide-react';
import type { SalaRecord, AsignacionRecord, TicketRecord } from '../utils/types';

interface Props {
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
  tickets: TicketRecord[];
  onClose: () => void;
}

type SedeFilter = 'ALL' | 'TELARES' | 'ROYAL' | 'ELEMENTO';
type TurnoFilter = 'ALL' | 'AM' | 'PM';
type EstadoFilter = 'ALL' | 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';

const SEDE_HEX: Record<string, string> = {
  TELARES: '#3b82f6',
  ROYAL: '#8b5cf6',
  ELEMENTO: '#10b981',
};

const PALETTE = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#0ea5e9', '#ec4899', '#f97316',
];

function getSedeHex(sede: string) {
  const upper = sede.toUpperCase();
  for (const key of Object.keys(SEDE_HEX)) {
    if (upper.includes(key)) return SEDE_HEX[key];
  }
  return '#64748b';
}

function isTurnoAM(horario: string) {
  const h = (horario || '').toUpperCase();
  return !h.startsWith('14') && !h.startsWith('15') && !h.startsWith('16');
}

function resolveTicketEstado(t: TicketRecord): 'ABIERTO' | 'RESPONDIDO' | 'CERRADO' {
  if (t.fechaCierre) return 'CERRADO';
  if (t.respuesta?.trim()) return 'RESPONDIDO';
  return 'ABIERTO';
}

// â”€â”€ Mini chart components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HBar({
  label, value, max, color, total,
}: { label: string; value: number; max: number; color: string; total: number }) {
  const widthPct = max > 0 ? (value / max) * 100 : 0;
  const sharePct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="text-xs font-medium text-slate-600 truncate" title={label}>{label}</span>
        <span className="text-xs font-bold text-slate-800 shrink-0">
          {value} <span className="text-slate-400 font-normal">({sharePct}%)</span>
        </span>
      </div>
      <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${widthPct}%`, backgroundColor: color, minWidth: value > 0 ? '6px' : '0' }}
        />
      </div>
    </div>
  );
}

function DonutChart({
  segments, size = 110,
}: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  let cumPct = 0;
  const parts = segments.map(({ value, color }) => {
    const pct = total > 0 ? (value / total) * 100 : 0;
    const part = `${color} ${cumPct.toFixed(1)}% ${(cumPct + pct).toFixed(1)}%`;
    cumPct += pct;
    return part;
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div
          className="w-full h-full rounded-full"
          style={{
            background: total > 0
              ? `conic-gradient(${parts.join(', ')})`
              : '#f1f5f9',
          }}
        />
        <div className="absolute inset-[27%] rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
          <span className="text-lg font-black text-slate-800 leading-none">{total}</span>
        </div>
      </div>
      <div className="space-y-2 min-w-0">
        {segments.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500 truncate">{label}</span>
            <span className="text-xs font-bold text-slate-800 ml-1 shrink-0">{value}</span>
            {total > 0 && (
              <span className="text-[10px] text-slate-400 shrink-0">
                {Math.round((value / total) * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({
  label, value, sub, color, icon,
}: { label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className={`text-3xl font-black ${color} leading-none`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

// â”€â”€ Main dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AnalyticsDashboard({ salas, asignaciones, tickets, onClose }: Props) {
  const [sede, setSede] = useState<SedeFilter>('ALL');
  const [turno, setTurno] = useState<TurnoFilter>('ALL');
  const [estado, setEstado] = useState<EstadoFilter>('ALL');
  const [coordinador, setCoordinador] = useState<string>('ALL');

  // Salas únicas (sin duplicar AM/PM del catálogo)
  const salasUnicas = useMemo(
    () => salas.filter((s, idx, arr) => arr.findIndex(x => x.sala === s.sala) === idx),
    [salas],
  );

  const coordinadoresDisponibles = useMemo(() => {
    const map = new Map<string, number>();
    asignaciones.forEach(a => {
      const f = a.coordinador?.trim();
      if (f) map.set(f, (map.get(f) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [asignaciones]);

  // Asignaciones filtradas por los controles
  const asigsFiltradas = useMemo(() => asignaciones.filter(a => {
    if (sede !== 'ALL' && !a.sede.toUpperCase().includes(sede)) return false;
    if (turno === 'AM' && !isTurnoAM(a.horario)) return false;
    if (turno === 'PM' && isTurnoAM(a.horario)) return false;
    if (estado !== 'ALL' && a.estadoAsignacion !== estado) return false;
    if (coordinador !== 'ALL' && a.coordinador?.trim() !== coordinador) return false;
    return true;
  }), [asignaciones, sede, turno, estado, coordinador]);

  const aprobadas = useMemo(() => asigsFiltradas.filter(a => (a.estadoAsignacion || 'APROBADO') === 'APROBADO'), [asigsFiltradas]);
  const pendientes = useMemo(() => asigsFiltradas.filter(a => a.estadoAsignacion === 'PENDIENTE'), [asigsFiltradas]);

  // KPI values
  const totalPersonas = aprobadas.reduce((s, a) => s + (parseInt(a.dPersonas) || 0), 0);
  const coordinadoresActivos = new Set(aprobadas.map(a => a.coordinador).filter(Boolean)).size;
  const salasEnUso = new Set(aprobadas.map(a => a.sala)).size;
  const ticketsAbiertos = tickets.filter(t => resolveTicketEstado(t) === 'ABIERTO').length;
  const ticketsRespondidos = tickets.filter(t => resolveTicketEstado(t) === 'RESPONDIDO').length;
  const ticketsCerrados = tickets.filter(t => resolveTicketEstado(t) === 'CERRADO').length;

  // Distribución por sede (asignaciones aprobadas)
  const bySedeAsig = useMemo(() => {
    const map: Record<string, number> = {};
    aprobadas.forEach(a => { const s = a.sede || 'SIN SEDE'; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [aprobadas]);

  // Distribución por sede (catálogo)
  const bySedeSalas = useMemo(() => {
    const map: Record<string, number> = {};
    salasUnicas.forEach(s => { const sede = s.sede || 'SIN SEDE'; map[sede] = (map[sede] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [salasUnicas]);

  // Turno AM / PM
  const turnoAM = aprobadas.filter(a => isTurnoAM(a.horario)).length;
  const turnoPM = aprobadas.length - turnoAM;

  // Tipo de sala (catálogo)
  const excl = salasUnicas.filter(s => s.tipo === 'EXCLUSIVA').length;
  const rota = salasUnicas.filter(s => s.tipo === 'ROTATIVA').length;

  // Estado global de todas las asignaciones (ignora filtro de estado para mostrar distribuciÃ³n real)
  const estadoGlobal = useMemo(() => {
    const map: Record<string, number> = { APROBADO: 0, PENDIENTE: 0, RECHAZADO: 0 };
    asignaciones.forEach(a => { const e = a.estadoAsignacion || 'APROBADO'; map[e] = (map[e] || 0) + 1; });
    return map;
  }, [asignaciones]);

  // Top campañas
  const topCampanas = useMemo(() => {
    const map: Record<string, number> = {};
    aprobadas.forEach(a => { const c = a.campana || 'Sin campaña'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [aprobadas]);

  // Top salas
  const topSalas = useMemo(() => {
    const map: Record<string, number> = {};
    aprobadas.forEach(a => { const s = a.sala || 'Sin sala'; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [aprobadas]);

  // Asignaciones por coordinador (formador)
  const topCoordinadores = useMemo(() => {
    const map: Record<string, number> = {};
    aprobadas.forEach(a => {
      const f = a.coordinador?.trim() || 'Sin coordinador';
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [aprobadas]);

  const maxTopCoord = Math.max(...topCoordinadores.map(([, v]) => v), 1);

  // Ocupación de salas por sede
  const ocupacion = useMemo(() =>
    bySedeSalas.map(([s, total]) => {
      const enUso = new Set(
        aprobadas.filter(a => a.sede.toUpperCase().includes(s.toUpperCase())).map(a => a.sala),
      ).size;
      return { sede: s, total, enUso };
    }),
    [bySedeSalas, aprobadas],
  );

  const maxBySedeAsig = Math.max(...bySedeAsig.map(([, v]) => v), 1);
  const maxTopCampana = Math.max(...topCampanas.map(([, v]) => v), 1);
  const maxTopSala = Math.max(...topSalas.map(([, v]) => v), 1);

  const totalCapacidad = salasUnicas.reduce((s, sala) => s + (parseInt(sala.capacidad) || 0), 0);
  const ocupPct = totalCapacidad > 0 ? Math.round((totalPersonas / totalCapacidad) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Title */}
            <div className="flex items-center gap-3 mr-auto">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-800">Data Analytics · Salas</h1>
                <p className="text-xs text-slate-400">
                  {asigsFiltradas.length} asignaciones filtradas · {salasUnicas.length} salas · {tickets.length} tickets
                  {coordinador !== 'ALL' && (
                    <> · Coordinador: <span className="font-semibold text-amber-600">{coordinador}</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Filtro sede */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
              {(['ALL', 'TELARES', 'ROYAL', 'ELEMENTO'] as SedeFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSede(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sede === s
                    ? 'bg-white shadow text-slate-800'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {s === 'ALL' ? 'Todas las sedes' : s}
                </button>
              ))}
            </div>

            {/* Filtro turno */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
              <button onClick={() => setTurno('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${turno === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Todos</button>
              <button onClick={() => setTurno('AM')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${turno === 'AM' ? 'bg-amber-400 text-amber-900 shadow' : 'text-slate-400'}`}><Sun className="w-3 h-3" />AM</button>
              <button onClick={() => setTurno('PM')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${turno === 'PM' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}><Moon className="w-3 h-3" />PM</button>
            </div>

            {/* Filtro estado */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
              {(['ALL', 'APROBADO', 'PENDIENTE', 'RECHAZADO'] as EstadoFilter[]).map(e => {
                const active = estado === e;
                const activeClass =
                  e === 'APROBADO' ? 'bg-emerald-500 text-white shadow' :
                    e === 'PENDIENTE' ? 'bg-amber-400 text-amber-900 shadow' :
                      e === 'RECHAZADO' ? 'bg-red-500 text-white shadow' :
                        'bg-white shadow text-slate-800';
                return (
                  <button
                    key={e}
                    onClick={() => setEstado(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? activeClass : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {e === 'ALL' ? 'Todos' : e}
                  </button>
                );
              })}
            </div>

            {/* Filtro coordinador */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl pl-3 pr-2 py-1.5 max-w-[240px]">
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                value={coordinador}
                onChange={e => setCoordinador(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full truncate cursor-pointer"
                title={coordinador === 'ALL' ? 'Todos los coordinadores' : coordinador}
              >
                <option value="ALL">Todos los coordinadores</option>
                {coordinadoresDisponibles.map(([nombre, count]) => (
                  <option key={nombre} value={nombre}>
                    {nombre} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ SCROLLABLE BODY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">

          {/* â”€â”€ ROW 1: KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPI
              label="Asignaciones activas"
              value={aprobadas.length}
              sub={`${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''}`}
              color="text-violet-600"
              icon={<Activity className="w-5 h-5 text-violet-400" />}
            />
            <KPI
              label="Salas en uso"
              value={salasEnUso}
              sub={`de ${salasUnicas.length} en catálogo`}
              color="text-blue-600"
              icon={<Building2 className="w-5 h-5 text-blue-400" />}
            />
            <KPI
              label="Personas formación"
              value={totalPersonas}
              sub={`${ocupPct}% de capacidad total`}
              color="text-emerald-600"
              icon={<Users className="w-5 h-5 text-emerald-400" />}
            />
            <KPI
              label="Coordinadores"
              value={coordinadoresActivos}
              sub={coordinador !== 'ALL' ? 'filtrado' : 'con sala asignada'}
              color="text-amber-600"
              icon={<Award className="w-5 h-5 text-amber-400" />}
            />
            <KPI
              label="Tickets"
              value={tickets.length}
              sub={`${ticketsAbiertos} abiertos · ${ticketsRespondidos} respondidos · ${ticketsCerrados} cerrados`}
              color="text-orange-600"
              icon={<Ticket className="w-5 h-5 text-orange-400" />}
            />
            <KPI
              label="Capacidad total"
              value={totalCapacidad}
              sub={`${salasUnicas.reduce((s, x) => s + (parseInt(x.equipos) || 0), 0)} equipos`}
              color="text-rose-600"
              icon={<Users className="w-5 h-5 text-rose-400" />}
            />
          </div>

          {/* â”€â”€ ROW 2: 3 donuts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <Card title="Turno (asignaciones activas)" icon={<Clock className="w-4 h-4 text-slate-400" />}>
              <DonutChart segments={[
                { label: 'Mañana 06:00–14:00', value: turnoAM, color: '#f59e0b' },
                { label: 'Tarde 14:00–22:00', value: turnoPM, color: '#6366f1' },
              ]} />
            </Card>

            <Card title="Estado de todas las asignaciones" icon={<CheckCircle className="w-4 h-4 text-slate-400" />}>
              <DonutChart segments={[
                { label: 'Aprobado', value: estadoGlobal.APROBADO || 0, color: '#10b981' },
                { label: 'Pendiente', value: estadoGlobal.PENDIENTE || 0, color: '#f59e0b' },
                { label: 'Rechazado', value: estadoGlobal.RECHAZADO || 0, color: '#ef4444' },
              ]} />
            </Card>

            <Card title="Tipo de sala (catálogo)" icon={<Building2 className="w-4 h-4 text-slate-400" />}>
              <DonutChart segments={[
                { label: 'Exclusiva', value: excl, color: '#f59e0b' },
                { label: 'Rotativa', value: rota, color: '#0ea5e9' },
              ]} />
            </Card>

          </div>

          {/* â”€â”€ ROW 3: por sede + ocupaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <Card title="Asignaciones aprobadas por sede" icon={<MapPin className="w-4 h-4 text-slate-400" />}>
              {bySedeAsig.length === 0
                ? <p className="text-xs text-slate-400 text-center py-8">Sin asignaciones aprobadas</p>
                : <div className="space-y-3">
                  {bySedeAsig.map(([s, v]) => (
                    <HBar key={s} label={s} value={v} max={maxBySedeAsig} color={getSedeHex(s)} total={aprobadas.length} />
                  ))}
                </div>
              }
            </Card>

            <Card title="Ocupación de salas por sede" icon={<Percent className="w-4 h-4 text-slate-400" />}>
              <div className="space-y-5">
                {ocupacion.map(({ sede: s, total, enUso }) => {
                  const pct = total > 0 ? Math.round((enUso / total) * 100) : 0;
                  const color = getSedeHex(s);
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs font-semibold text-slate-700">{s}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {enUso}/{total} <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                          style={{ width: `${pct}%`, backgroundColor: color, minWidth: enUso > 0 ? '6px' : '0' }}
                        >
                          {pct > 20 && <span className="text-white text-[9px] font-bold">{pct}%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>

          {/* ROW 4: top campañas + top salas + coordinadores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <Card title="Top campañas con más asignaciones" icon={<TrendingUp className="w-4 h-4 text-slate-400" />}>
              {topCampanas.length === 0
                ? <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>
                : <div className="space-y-2.5">
                  {topCampanas.map(([c, v], i) => (
                    <HBar key={c} label={c} value={v} max={maxTopCampana} color={PALETTE[i % PALETTE.length]} total={aprobadas.length} />
                  ))}
                </div>
              }
            </Card>

            <Card title="Top salas más asignadas" icon={<Building2 className="w-4 h-4 text-slate-400" />}>
              {topSalas.length === 0
                ? <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>
                : <div className="space-y-2.5">
                  {topSalas.map(([s, v], i) => (
                    <HBar key={s} label={s} value={v} max={maxTopSala} color={PALETTE[i % PALETTE.length]} total={aprobadas.length} />
                  ))}
                </div>
              }
            </Card>

            <Card title="Reservas por coordinador" icon={<Award className="w-4 h-4 text-slate-400" />}>
              {topCoordinadores.length === 0
                ? <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>
                : <div className="space-y-2.5">
                  {topCoordinadores.map(([c, v], i) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoordinador(c === 'Sin coordinador' ? 'ALL' : c)}
                      className={`w-full text-left rounded-lg transition-colors ${coordinador === c ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                    >
                      <HBar
                        label={c}
                        value={v}
                        max={maxTopCoord}
                        color={coordinador === c ? '#f59e0b' : PALETTE[i % PALETTE.length]}
                        total={aprobadas.length}
                      />
                    </button>
                  ))}
                </div>
              }
            </Card>

          </div>


          {/* â”€â”€ ROW 6: detalle catálogo por sede â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <Card title="Detalle catálogo por sede" icon={<Building2 className="w-4 h-4 text-slate-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bySedeSalas.map(([s, totalSalas]) => {
                const color = getSedeHex(s);
                const exclS = salasUnicas.filter(x => x.sede.toUpperCase().includes(s.toUpperCase()) && x.tipo === 'EXCLUSIVA').length;
                const rotaS = salasUnicas.filter(x => x.sede.toUpperCase().includes(s.toUpperCase()) && x.tipo === 'ROTATIVA').length;
                const capS = salasUnicas.filter(x => x.sede.toUpperCase().includes(s.toUpperCase())).reduce((sum, x) => sum + (parseInt(x.capacidad) || 0), 0);
                const equipS = salasUnicas.filter(x => x.sede.toUpperCase().includes(s.toUpperCase())).reduce((sum, x) => sum + (parseInt(x.equipos) || 0), 0);
                const tableroS = salasUnicas.filter(x => x.sede.toUpperCase().includes(s.toUpperCase()) && x.tablero === 'SI').length;
                const tvS = salasUnicas.filter(x => x.sede.toUpperCase().includes(s.toUpperCase()) && x.tv === 'SI').length;
                return (
                  <div key={s} className="rounded-2xl border border-slate-100 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                        <Building2 className="w-4 h-4" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">{s}</p>
                        <p className="text-xs text-slate-400">{totalSalas} salas · {capS} puestos · {equipS} equipos</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-amber-50 rounded-xl py-2.5 text-center">
                        <p className="text-xl font-black text-amber-600">{exclS}</p>
                        <p className="text-[10px] text-amber-400 font-semibold">Exclusivas</p>
                      </div>
                      <div className="bg-sky-50 rounded-xl py-2.5 text-center">
                        <p className="text-xl font-black text-sky-600">{rotaS}</p>
                        <p className="text-[10px] text-sky-400 font-semibold">Rotativas</p>
                      </div>
                      <div className="bg-indigo-50 rounded-xl py-2 text-center">
                        <p className="text-lg font-black text-indigo-600">{tableroS}</p>
                        <p className="text-[10px] text-indigo-400 font-semibold">Con tablero</p>
                      </div>
                      <div className="bg-teal-50 rounded-xl py-2 text-center">
                        <p className="text-lg font-black text-teal-600">{tvS}</p>
                        <p className="text-[10px] text-teal-400 font-semibold">Con TV</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
