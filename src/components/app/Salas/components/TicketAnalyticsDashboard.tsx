import { useState, useMemo } from 'react';
import {
  X, Ticket, Activity, AlertCircle, TrendingUp, Users,
  MapPin, Building2, Percent, CheckCircle, Award,
} from 'lucide-react';
import type { AsignacionRecord, TicketRecord } from '../utils/types';

interface Props {
  asignaciones: AsignacionRecord[];
  tickets: TicketRecord[];
  onClose: () => void;
}

type SedeFilter = 'ALL' | 'TELARES' | 'ROYAL' | 'ELEMENTO';
type TicketEstadoFilter = 'ALL' | 'ABIERTO' | 'RESPONDIDO' | 'CERRADO';
type TicketEstado = 'ABIERTO' | 'RESPONDIDO' | 'CERRADO';

interface EnrichedTicket extends TicketRecord {
  sede: string;
  formador: string;
  estado: TicketEstado;
}

const TICKET_ESTADO_COLORS: Record<TicketEstado, string> = {
  ABIERTO: '#f97316',
  RESPONDIDO: '#3b82f6',
  CERRADO: '#64748b',
};

const TICKET_ESTADO_LABELS: Record<TicketEstado, string> = {
  ABIERTO: 'Abierto',
  RESPONDIDO: 'Respondido',
  CERRADO: 'Cerrado',
};

const SEDE_HEX: Record<string, string> = {
  TELARES: '#3b82f6',
  ROYAL: '#8b5cf6',
  ELEMENTO: '#10b981',
};

const PALETTE = [
  '#f97316', '#3b82f6', '#8b5cf6', '#10b981',
  '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899',
];

function getSedeHex(sede: string) {
  const upper = sede.toUpperCase();
  for (const key of Object.keys(SEDE_HEX)) {
    if (upper.includes(key)) return SEDE_HEX[key];
  }
  return '#64748b';
}

function resolveTicketEstado(t: TicketRecord): TicketEstado {
  if (t.fechaCierre) return 'CERRADO';
  if (t.respuesta?.trim()) return 'RESPONDIDO';
  return 'ABIERTO';
}

function StackedHBar({
  label, segments, max,
}: {
  label: string;
  segments: { key: TicketEstado; value: number }[];
  max: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const widthPct = max > 0 ? (total / max) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="text-xs font-medium text-slate-600 truncate" title={label}>{label}</span>
        <span className="text-xs font-bold text-slate-800 shrink-0">{total}</span>
      </div>
      <div className="h-5 bg-slate-100 rounded-full overflow-hidden flex">
        {total === 0 ? null : segments.map(({ key, value }) =>
          value > 0 ? (
            <div
              key={key}
              className="h-full transition-all duration-700"
              style={{
                width: `${(value / total) * widthPct}%`,
                backgroundColor: TICKET_ESTADO_COLORS[key],
                minWidth: '4px',
              }}
              title={`${TICKET_ESTADO_LABELS[key]}: ${value}`}
            />
          ) : null,
        )}
      </div>
      {total > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {segments.filter(s => s.value > 0).map(({ key, value }) => (
            <span key={key} className="text-[10px] text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: TICKET_ESTADO_COLORS[key] }} />
              {TICKET_ESTADO_LABELS[key]} {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
          style={{ background: total > 0 ? `conic-gradient(${parts.join(', ')})` : '#f1f5f9' }}
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

export default function TicketAnalyticsDashboard({ asignaciones, tickets, onClose }: Props) {
  const [sede, setSede] = useState<SedeFilter>('ALL');
  const [campana, setCampana] = useState<string>('ALL');
  const [coordinador, setCoordinador] = useState<string>('ALL');
  const [ticketEstado, setTicketEstado] = useState<TicketEstadoFilter>('ALL');

  const ticketsEnriquecidos = useMemo(() => {
    const asigByTicket = new Map<string, AsignacionRecord>();
    asignaciones.forEach(a => {
      const num = a.ticket?.trim();
      if (num) asigByTicket.set(num, a);
    });
    return tickets.map(t => {
      const asig = asigByTicket.get(t.numeroTicket?.trim() || '');
      return {
        ...t,
        sede: asig?.sede?.trim() || 'Sin sede',
        formador: asig?.formador?.trim() || 'Sin coordinador',
        estado: resolveTicketEstado(t),
      } satisfies EnrichedTicket;
    });
  }, [tickets, asignaciones]);

  const campanasDisponibles = useMemo(() => {
    const map = new Map<string, number>();
    ticketsEnriquecidos.forEach(t => {
      const c = t.campana?.trim();
      if (c) map.set(c, (map.get(c) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [ticketsEnriquecidos]);

  const coordinadoresDisponibles = useMemo(() => {
    const map = new Map<string, number>();
    ticketsEnriquecidos.forEach(t => {
      const f = t.formador?.trim();
      if (f && f !== 'Sin coordinador') map.set(f, (map.get(f) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [ticketsEnriquecidos]);

  const ticketsFiltrados = useMemo(() => ticketsEnriquecidos.filter(t => {
    if (sede !== 'ALL' && !t.sede.toUpperCase().includes(sede)) return false;
    if (campana !== 'ALL' && t.campana !== campana) return false;
    if (coordinador !== 'ALL' && t.formador !== coordinador) return false;
    if (ticketEstado !== 'ALL' && t.estado !== ticketEstado) return false;
    return true;
  }), [ticketsEnriquecidos, sede, campana, coordinador, ticketEstado]);

  const ticketsAbiertos = ticketsFiltrados.filter(t => t.estado === 'ABIERTO').length;
  const ticketsRespondidos = ticketsFiltrados.filter(t => t.estado === 'RESPONDIDO').length;
  const ticketsCerrados = ticketsFiltrados.filter(t => t.estado === 'CERRADO').length;
  const tasaRespuesta = ticketsFiltrados.length > 0
    ? Math.round(((ticketsRespondidos + ticketsCerrados) / ticketsFiltrados.length) * 100)
    : 0;

  const topFallas = useMemo(() => {
    const map: Record<string, number> = {};
    ticketsFiltrados.forEach(t => { const f = t.fallaPuntual || 'Sin descripción'; map[f] = (map[f] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [ticketsFiltrados]);

  const ticketsPorCampana = useMemo(() => {
    const map: Record<string, number> = {};
    ticketsFiltrados.forEach(t => { const c = t.campana || 'Sin campaña'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [ticketsFiltrados]);

  const ticketsPorSede = useMemo(() => {
    const map: Record<string, number> = {};
    ticketsFiltrados.forEach(t => { const s = t.sede || 'Sin sede'; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [ticketsFiltrados]);

  const ticketsPorSedeEstado = useMemo(() => {
    const map: Record<string, Record<TicketEstado, number>> = {};
    ticketsFiltrados.forEach(t => {
      const s = t.sede || 'Sin sede';
      if (!map[s]) map[s] = { ABIERTO: 0, RESPONDIDO: 0, CERRADO: 0 };
      map[s][t.estado]++;
    });
    return Object.entries(map)
      .map(([sedeKey, counts]) => ({
        sede: sedeKey,
        counts,
        total: counts.ABIERTO + counts.RESPONDIDO + counts.CERRADO,
      }))
      .sort((a, b) => b.total - a.total);
  }, [ticketsFiltrados]);

  const ticketsPorCampanaEstado = useMemo(() => {
    const map: Record<string, Record<TicketEstado, number>> = {};
    ticketsFiltrados.forEach(t => {
      const c = t.campana || 'Sin campaña';
      if (!map[c]) map[c] = { ABIERTO: 0, RESPONDIDO: 0, CERRADO: 0 };
      map[c][t.estado]++;
    });
    return Object.entries(map)
      .map(([campanaKey, counts]) => ({
        campana: campanaKey,
        counts,
        total: counts.ABIERTO + counts.RESPONDIDO + counts.CERRADO,
      }))
      .sort((a, b) => b.total - a.total);
  }, [ticketsFiltrados]);

  const ticketsPorReportador = useMemo(() => {
    const map: Record<string, number> = {};
    ticketsFiltrados.forEach(t => { const p = t.personaReporta || 'Sin nombre'; map[p] = (map[p] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [ticketsFiltrados]);

  const ticketsPorCoordinador = useMemo(() => {
    const map: Record<string, number> = {};
    ticketsFiltrados.forEach(t => {
      const f = t.formador || 'Sin coordinador';
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [ticketsFiltrados]);

  const tiposFalla = new Set(ticketsFiltrados.map(t => t.fallaPuntual).filter(Boolean)).size;

  const maxFalla = Math.max(...topFallas.map(([, v]) => v), 1);
  const maxTicketCamp = Math.max(...ticketsPorCampana.map(([, v]) => v), 1);
  const maxTicketSede = Math.max(...ticketsPorSede.map(([, v]) => v), 1);
  const maxSedeEstado = Math.max(...ticketsPorSedeEstado.map(r => r.total), 1);
  const maxReportador = Math.max(...ticketsPorReportador.map(([, v]) => v), 1);
  const maxCoord = Math.max(...ticketsPorCoordinador.map(([, v]) => v), 1);

  const sedeDonutSegments = ticketsPorSede.map(([s, v]) => ({
    label: s,
    value: v,
    color: getSedeHex(s),
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-3 mr-auto">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-800">Data Analytics · Tickets</h1>
                <p className="text-xs text-slate-400">
                  {ticketsFiltrados.length} tickets
                  {ticketsFiltrados.length > 0 && (
                    <> · {ticketsAbiertos} abiertos · {ticketsRespondidos} respondidos · {ticketsCerrados} cerrados</>
                  )}
                  {coordinador !== 'ALL' && (
                    <> · Coordinador: <span className="font-semibold text-amber-600">{coordinador}</span></>
                  )}
                  {campana !== 'ALL' && (
                    <> · Campaña: <span className="font-semibold text-orange-600">{campana}</span></>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sede === s ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {s === 'ALL' ? 'Todas las sedes' : s}
                </button>
              ))}
            </div>

            {/* Filtro campaña */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl pl-3 pr-2 py-1.5 max-w-[220px]">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <select
                value={campana}
                onChange={e => setCampana(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full truncate cursor-pointer"
                title={campana === 'ALL' ? 'Todas las campañas' : campana}
              >
                <option value="ALL">Todas las campañas</option>
                {campanasDisponibles.map(([nombre, count]) => (
                  <option key={nombre} value={nombre}>
                    {nombre} ({count})
                  </option>
                ))}
              </select>
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

            {/* Filtro estado */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
              {(['ALL', 'ABIERTO', 'RESPONDIDO', 'CERRADO'] as TicketEstadoFilter[]).map(e => {
                const active = ticketEstado === e;
                const activeClass =
                  e === 'ABIERTO' ? 'bg-orange-500 text-white shadow' :
                    e === 'RESPONDIDO' ? 'bg-blue-500 text-white shadow' :
                      e === 'CERRADO' ? 'bg-slate-500 text-white shadow' :
                        'bg-white shadow text-slate-800';
                return (
                  <button
                    key={e}
                    onClick={() => setTicketEstado(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? activeClass : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {e === 'ALL' ? 'Todos' : TICKET_ESTADO_LABELS[e]}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPI label="Total tickets" value={ticketsFiltrados.length} color="text-orange-600" icon={<Ticket className="w-5 h-5 text-orange-400" />} />
            <KPI label="Abiertos" value={ticketsAbiertos} sub="sin respuesta admin" color="text-orange-500" icon={<AlertCircle className="w-5 h-5 text-orange-300" />} />
            <KPI label="Respondidos" value={ticketsRespondidos} sub="con respuesta admin" color="text-blue-600" icon={<CheckCircle className="w-5 h-5 text-blue-400" />} />
            <KPI label="Cerrados" value={ticketsCerrados} sub="con fecha de cierre" color="text-slate-600" icon={<Activity className="w-5 h-5 text-slate-400" />} />
            <KPI label="Tasa de atención" value={`${tasaRespuesta}%`} sub={`${ticketsRespondidos + ticketsCerrados} atendidos`} color="text-violet-600" icon={<Percent className="w-5 h-5 text-violet-400" />} />
            <KPI label="Tipos de falla" value={tiposFalla} sub="fallas distintas" color="text-rose-600" icon={<AlertCircle className="w-5 h-5 text-rose-400" />} />
          </div>

          {/* 3 donuts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Estado de tickets" icon={<Activity className="w-4 h-4 text-slate-400" />}>
              {ticketsFiltrados.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <DonutChart segments={[
                  { label: 'Abierto', value: ticketsAbiertos, color: TICKET_ESTADO_COLORS.ABIERTO },
                  { label: 'Respondido (admin)', value: ticketsRespondidos, color: TICKET_ESTADO_COLORS.RESPONDIDO },
                  { label: 'Cerrado', value: ticketsCerrados, color: TICKET_ESTADO_COLORS.CERRADO },
                ]} />
              )}
            </Card>

            <Card title="Tickets por sede" icon={<MapPin className="w-4 h-4 text-slate-400" />}>
              {sedeDonutSegments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <DonutChart segments={sedeDonutSegments} />
              )}
            </Card>

            <Card title="Top fallas reportadas" icon={<AlertCircle className="w-4 h-4 text-slate-400" />}>
              {topFallas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="space-y-2.5">
                  {topFallas.slice(0, 5).map(([f, v], i) => (
                    <HBar
                      key={f}
                      label={f}
                      value={v}
                      max={maxFalla}
                      color={['#ef4444', '#f97316', '#f59e0b', '#ec4899', '#8b5cf6'][i]}
                      total={ticketsFiltrados.length}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Por sede */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Tickets por sede y estado" icon={<MapPin className="w-4 h-4 text-slate-400" />}>
              {ticketsPorSedeEstado.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="space-y-4">
                  {ticketsPorSedeEstado.map(({ sede: s, counts }) => (
                    <StackedHBar
                      key={s}
                      label={s}
                      max={maxSedeEstado}
                      segments={[
                        { key: 'ABIERTO', value: counts.ABIERTO },
                        { key: 'RESPONDIDO', value: counts.RESPONDIDO },
                        { key: 'CERRADO', value: counts.CERRADO },
                      ]}
                    />
                  ))}
                  <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
                    {(['ABIERTO', 'RESPONDIDO', 'CERRADO'] as TicketEstado[]).map(e => (
                      <span key={e} className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TICKET_ESTADO_COLORS[e] }} />
                        {TICKET_ESTADO_LABELS[e]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="Total tickets por sede" icon={<Building2 className="w-4 h-4 text-slate-400" />}>
              {ticketsPorSede.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="space-y-2.5">
                  {ticketsPorSede.map(([s, v]) => (
                    <HBar key={s} label={s} value={v} max={maxTicketSede} color={getSedeHex(s)} total={ticketsFiltrados.length} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Por campaña + coordinador + reportadores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Tickets por campaña" icon={<TrendingUp className="w-4 h-4 text-slate-400" />}>
              {ticketsPorCampana.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="space-y-2.5">
                  {ticketsPorCampana.map(([c, v], i) => (
                    <HBar key={c} label={c} value={v} max={maxTicketCamp} color={PALETTE[i % PALETTE.length]} total={ticketsFiltrados.length} />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Tickets por coordinador" icon={<Award className="w-4 h-4 text-slate-400" />}>
              {ticketsPorCoordinador.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="space-y-2.5">
                  {ticketsPorCoordinador.map(([c, v], i) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoordinador(c === 'Sin coordinador' ? 'ALL' : c)}
                      className={`w-full text-left rounded-lg transition-colors ${coordinador === c ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                    >
                      <HBar
                        label={c}
                        value={v}
                        max={maxCoord}
                        color={coordinador === c ? '#f59e0b' : PALETTE[i % PALETTE.length]}
                        total={ticketsFiltrados.length}
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Top reportadores" icon={<Users className="w-4 h-4 text-slate-400" />}>
              {ticketsPorReportador.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="space-y-2.5">
                  {ticketsPorReportador.map(([p, v], i) => (
                    <HBar key={p} label={p} value={v} max={maxReportador} color={PALETTE[i % PALETTE.length]} total={ticketsFiltrados.length} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Tablas cruzadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Resumen por campaña y estado" icon={<TrendingUp className="w-4 h-4 text-slate-400" />}>
              {ticketsPorCampanaEstado.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Campaña', 'Total', 'Abierto', 'Respondido', 'Cerrado', '% Atención'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ticketsPorCampanaEstado.map(({ campana: c, counts, total }) => {
                        const atendidos = counts.RESPONDIDO + counts.CERRADO;
                        const pct = total > 0 ? Math.round((atendidos / total) * 100) : 0;
                        return (
                          <tr key={c} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2.5 font-semibold text-slate-700">{c}</td>
                            <td className="px-3 py-2.5 font-bold text-orange-600">{total}</td>
                            <td className="px-3 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-100 text-orange-600">{counts.ABIERTO}</span></td>
                            <td className="px-3 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700">{counts.RESPONDIDO}</span></td>
                            <td className="px-3 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">{counts.CERRADO}</span></td>
                            <td className="px-3 py-2.5 font-semibold text-slate-600">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Resumen por sede y estado" icon={<MapPin className="w-4 h-4 text-slate-400" />}>
              {ticketsPorSedeEstado.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Sede', 'Total', 'Abierto', 'Respondido', 'Cerrado', '% Atención'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ticketsPorSedeEstado.map(({ sede: s, counts, total }) => {
                        const atendidos = counts.RESPONDIDO + counts.CERRADO;
                        const pct = total > 0 ? Math.round((atendidos / total) * 100) : 0;
                        return (
                          <tr key={s} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2.5 font-semibold text-slate-700">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSedeHex(s) }} />
                                {s}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-orange-600">{total}</td>
                            <td className="px-3 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-100 text-orange-600">{counts.ABIERTO}</span></td>
                            <td className="px-3 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700">{counts.RESPONDIDO}</span></td>
                            <td className="px-3 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">{counts.CERRADO}</span></td>
                            <td className="px-3 py-2.5 font-semibold text-slate-600">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Detalle */}
          <Card title="Detalle de tickets" icon={<Ticket className="w-4 h-4 text-slate-400" />}>
            {ticketsFiltrados.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Sin tickets con estos filtros</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['N° Ticket', 'Sede', 'Coordinador', 'Campaña', 'Falla', 'Reportado por', 'Estado', 'Respuesta admin'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ticketsFiltrados.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 font-mono font-bold text-orange-600">{t.numeroTicket}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getSedeHex(t.sede) }} />
                            {t.sede}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate" title={t.formador}>{t.formador}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700">{t.campana}</td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[140px] truncate" title={t.fallaPuntual}>{t.fallaPuntual}</td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-[120px] truncate" title={t.personaReporta}>{t.personaReporta}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${t.estado === 'CERRADO' ? 'bg-slate-100 text-slate-500' :
                            t.estado === 'RESPONDIDO' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                            {TICKET_ESTADO_LABELS[t.estado]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-[180px] truncate italic" title={t.respuesta}>
                          {t.respuesta?.trim() || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
