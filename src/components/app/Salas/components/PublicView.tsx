import { useState } from 'react';
import { Building2, Users, Monitor, Tv2, Clock, MapPin, ClipboardList, Lock, RotateCcw, UserCheck, Sun, Moon } from 'lucide-react';
import type { SalaRecord, AsignacionRecord } from '../utils/types';

interface Props {
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
}

const SEDE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; bar: string }> = {
  TELARES: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', badge: 'bg-blue-600', bar: 'bg-blue-500' },
  ROYAL: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200', badge: 'bg-purple-600', bar: 'bg-purple-500' },
  ELEMENTO: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', badge: 'bg-emerald-600', bar: 'bg-emerald-500' },
};

const SEDE_COLORS_NIGHT: Record<string, { bg: string; text: string; border: string; badge: string; bar: string }> = {
  TELARES: { bg: 'bg-blue-950/60', text: 'text-blue-200', border: 'border-blue-800', badge: 'bg-blue-700', bar: 'bg-blue-400' },
  ROYAL: { bg: 'bg-purple-950/60', text: 'text-purple-200', border: 'border-purple-800', badge: 'bg-purple-700', bar: 'bg-purple-400' },
  ELEMENTO: { bg: 'bg-emerald-950/60', text: 'text-emerald-200', border: 'border-emerald-800', badge: 'bg-emerald-700', bar: 'bg-emerald-400' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200', badge: 'bg-slate-500', bar: 'bg-slate-400' };
const DEFAULT_COLOR_NIGHT = { bg: 'bg-slate-800/60', text: 'text-slate-200', border: 'border-slate-700', badge: 'bg-slate-600', bar: 'bg-slate-500' };

type Turno = 'AM' | 'PM' | 'ALL';

function getSedeColor(sede: string, night = false) {
  const upper = sede.toUpperCase();
  const map = night ? SEDE_COLORS_NIGHT : SEDE_COLORS;
  for (const key of Object.keys(map)) {
    if (upper.includes(key)) return map[key];
  }
  return night ? DEFAULT_COLOR_NIGHT : DEFAULT_COLOR;
}

function groupBySede(salas: SalaRecord[]): Record<string, SalaRecord[]> {
  return salas.reduce<Record<string, SalaRecord[]>>((acc, sala) => {
    const sede = sala.sede || 'SIN SEDE';
    if (!acc[sede]) acc[sede] = [];
    acc[sede].push(sala);
    return acc;
  }, {});
}

function filterByTurno(salas: SalaRecord[], turno: Turno): SalaRecord[] {
  if (turno === 'ALL') return salas;
  return salas.filter(s => {
    const h = (s.horario || '').toUpperCase();
    if (turno === 'AM') return !h.startsWith('14') && !h.startsWith('15');
    return h.startsWith('14') || h.startsWith('15');
  });
}

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  night?: boolean;
}

function KpiCard({ label, value, icon, color, sub, night }: KpiCardProps) {
  const bg = night ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
  const label_ = night ? 'text-slate-400' : 'text-slate-400';
  const sub_ = night ? 'text-slate-500' : 'text-slate-400';
  return (
    <div className={`${bg} border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold ${label_} uppercase tracking-wider mb-1`}>{label}</p>
          <p className={`text-3xl font-black ${color} leading-none`}>{value}</p>
          {sub && <p className={`text-xs ${sub_} mt-1.5`}>{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${night ? 'bg-slate-700' : color.replace('text-', 'bg-').replace('-600', '-50').replace('-700', '-50')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function PublicView({ salas, asignaciones }: Props) {
  const [turno, setTurno] = useState<Turno>('AM');

  const isNight = turno === 'PM';
  const isGlobal = turno === 'ALL';

  // Salas únicas (sin duplicar AM/PM) → para KPIs globales
  const salasUnicas = salas.filter((s, idx, arr) =>
    arr.findIndex(x => x.sala === s.sala) === idx
  );
  const groupedGlobal = groupBySede(salasUnicas);

  // Salas filtradas por turno → solo para el catálogo
  const salasFiltradas = filterByTurno(salas, turno);
  const grouped = groupBySede(salasFiltradas);

  // ── KPIs GLOBALES (dashboard siempre muestra el total real) ────────────────
  const totalSalas = salasUnicas.length;
  const exclusivas = salasUnicas.filter(s => s.tipo === 'EXCLUSIVA').length;
  const rotativas = salasUnicas.filter(s => s.tipo === 'ROTATIVA').length;
  const capacidadTotal = salasUnicas.reduce((sum, s) => sum + (parseInt(s.capacidad) || 0), 0);
  const equiposTotal = salasUnicas.reduce((sum, s) => sum + (parseInt(s.equipos) || 0), 0);
  const conTablero = salasUnicas.filter(s => s.tablero === 'SI').length;
  const conTv = salasUnicas.filter(s => s.tv === 'SI').length;
  const asigFiltradas = turno === 'ALL' ? asignaciones : asignaciones.filter(a => {
    const h = (a.horario || '').toUpperCase();
    if (turno === 'AM') return !h.startsWith('14') && !h.startsWith('15');
    return h.startsWith('14') || h.startsWith('15');
  });
  const totalAsig = asigFiltradas.length;
  const coordinadores = new Set(asigFiltradas.map(a => a.formador).filter(Boolean)).size;
  const sedesActivas = Object.keys(groupedGlobal).filter(s => s !== 'SIN SEDE').length;
  const sedeEntries = [...Object.entries(groupedGlobal)].sort((a, b) => b[1].length - a[1].length);

  // ── colores del tema ────────────────────────────────────────────────────────
  const cardBg = isNight ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
  const titleColor = isNight ? 'text-slate-100' : 'text-slate-700';
  const subColor = 'text-slate-400';
  const divColor = isNight ? 'bg-slate-700' : 'bg-slate-200';
  const divText = isNight ? 'text-slate-500' : 'text-slate-400';
  const barBg = isNight ? 'bg-slate-700' : 'bg-slate-100';

  return (
    <div className="space-y-10 transition-colors duration-500">

      {/* ── TOGGLE TURNO ──────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className={`flex items-center gap-1 p-1 rounded-2xl shadow-inner ${isNight ? 'bg-slate-800' : 'bg-slate-100'}`}>

          {/* General */}
          <button
            onClick={() => setTurno('ALL')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${turno === 'ALL'
              ? 'bg-slate-700 text-white shadow-md'
              : isNight ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Building2 className="w-4 h-4" />
            General
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${turno === 'ALL' ? 'bg-slate-600 text-slate-200' : isNight ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
              Todos los turnos
            </span>
          </button>

          {/* Mañana */}
          <button
            onClick={() => setTurno('AM')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${turno === 'AM'
              ? 'bg-amber-400 text-amber-900 shadow-md shadow-amber-200'
              : isNight ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
              }`}
          >
            <Sun className="w-4 h-4" />
            Mañana
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${turno === 'AM' ? 'bg-amber-200 text-amber-800' : isNight ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
              06:00 – 14:00
            </span>
          </button>

          {/* Tarde */}
          <button
            onClick={() => setTurno('PM')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${turno === 'PM'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300'
              : isNight ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
              }`}
          >
            <Moon className="w-4 h-4" />
            Tarde
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${turno === 'PM' ? 'bg-indigo-500 text-indigo-100' : isNight ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
              14:00 – 22:00
            </span>
          </button>

        </div>
      </div>

      {/* ── BANNER DE TURNO ───────────────────────────────────────────────── */}
      {isGlobal ? (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-700 via-slate-600 to-slate-700 px-8 py-5 flex items-center gap-5 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5">Vista General</p>
            <p className="text-xl font-extrabold text-white">Todos los turnos</p>
            <p className="text-xs text-slate-300 mt-0.5">{totalSalas} salas · AM + PM disponibles</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-4xl font-black text-white">{capacidadTotal}</p>
            <p className="text-xs text-slate-300 font-semibold">puestos totales</p>
          </div>
        </div>
      ) : isNight ? (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/50 px-8 py-5 flex items-center gap-5 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-indigo-700/50 flex items-center justify-center shrink-0">
            <Moon className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Turno Tarde</p>
            <p className="text-xl font-extrabold text-white">14:00 – 22:00</p>
            <p className="text-xs text-indigo-300 mt-0.5">{salasFiltradas.length} sala{salasFiltradas.length !== 1 ? 's' : ''} en este turno · {totalSalas} en total</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-4xl font-black text-indigo-400">{capacidadTotal}</p>
            <p className="text-xs text-indigo-500 font-semibold">puestos totales</p>
          </div>
          {/* stars decoration */}
          <div className="absolute right-6 top-3 text-indigo-800 text-xs select-none pointer-events-none">✦ ✦ ✦</div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-400 via-orange-400 to-yellow-300 px-8 py-5 flex items-center gap-5 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center shrink-0">
            <Sun className="w-6 h-6 text-amber-900" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-0.5">Turno Mañana</p>
            <p className="text-xl font-extrabold text-amber-900">06:00 – 14:00</p>
            <p className="text-xs text-amber-800 mt-0.5">{salasFiltradas.length} sala{salasFiltradas.length !== 1 ? 's' : ''} en este turno · {totalSalas} en total</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-4xl font-black text-amber-900">{capacidadTotal}</p>
            <p className="text-xs text-amber-800 font-semibold">puestos totales</p>
          </div>
          <div className="absolute right-6 top-3 text-amber-600/40 text-lg select-none pointer-events-none">☀ ☀ ☀</div>
        </div>
      )}

      {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard night={isNight} label="Total Salas" value={totalSalas} color={isNight ? 'text-indigo-400' : 'text-indigo-600'} icon={<Building2 className={`w-5 h-5 ${isNight ? 'text-indigo-400' : 'text-indigo-500'}`} />} sub={`${sedesActivas} sede${sedesActivas !== 1 ? 's' : ''}`} />
        <KpiCard night={isNight} label="Exclusivas" value={exclusivas} color={isNight ? 'text-amber-400' : 'text-amber-600'} icon={<Lock className={`w-5 h-5 ${isNight ? 'text-amber-400' : 'text-amber-500'}`} />} sub={totalSalas > 0 ? `${Math.round(exclusivas / totalSalas * 100)}% del total` : '—'} />
        <KpiCard night={isNight} label="Rotativas" value={rotativas} color={isNight ? 'text-sky-400' : 'text-sky-600'} icon={<RotateCcw className={`w-5 h-5 ${isNight ? 'text-sky-400' : 'text-sky-500'}`} />} sub={totalSalas > 0 ? `${Math.round(rotativas / totalSalas * 100)}% del total` : '—'} />
        <KpiCard night={isNight} label="Capacidad Total" value={capacidadTotal} color={isNight ? 'text-violet-400' : 'text-violet-600'} icon={<Users className={`w-5 h-5 ${isNight ? 'text-violet-400' : 'text-violet-500'}`} />} sub={`${equiposTotal} equipos disponibles`} />
        <KpiCard night={isNight} label="Asignaciones" value={totalAsig} color={isNight ? 'text-emerald-400' : 'text-emerald-600'} icon={<ClipboardList className={`w-5 h-5 ${isNight ? 'text-emerald-400' : 'text-emerald-500'}`} />} sub="formaciones activas" />
        <KpiCard night={isNight} label="Coordinadores" value={coordinadores} color={isNight ? 'text-rose-400' : 'text-rose-600'} icon={<UserCheck className={`w-5 h-5 ${isNight ? 'text-rose-400' : 'text-rose-500'}`} />} sub="con sala asignada" />
      </div>

      {/* ── DISTRIBUCIÓN + EQUIPAMIENTO ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className={`${cardBg} border rounded-2xl p-6 shadow-sm`}>
          <h3 className={`text-sm font-bold ${titleColor} mb-4 flex items-center gap-2`}>
            <MapPin className="w-4 h-4 text-slate-400" />
            Distribución por sede
          </h3>
          <div className="space-y-3">
            {sedeEntries.map(([sede, salasSede]) => {
              const color = getSedeColor(sede, isNight);
              const pct = totalSalas > 0 ? Math.round(salasSede.length / totalSalas * 100) : 0;
              return (
                <div key={sede}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color.bar}`} />
                      <span className={`text-xs font-semibold ${titleColor}`}>{sede}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${subColor}`}>{salasSede.length} sala{salasSede.length !== 1 ? 's' : ''}</span>
                      <span className={`text-xs font-bold ${titleColor} w-8 text-right`}>{pct}%</span>
                    </div>
                  </div>
                  <div className={`h-2 ${barBg} rounded-full overflow-hidden`}>
                    <div className={`h-full ${color.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${cardBg} border rounded-2xl p-6 shadow-sm`}>
          <h3 className={`text-sm font-bold ${titleColor} mb-4 flex items-center gap-2`}>
            <Monitor className="w-4 h-4 text-slate-400" />
            Equipamiento disponible
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Con Tablero', count: conTablero, icon: <Monitor className="w-3.5 h-3.5 text-indigo-400" />, bar: 'bg-indigo-400' },
              { label: 'Con TV', count: conTv, icon: <Tv2 className="w-3.5 h-3.5 text-teal-400" />, bar: 'bg-teal-400' },
            ].map(({ label, count, icon, bar }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">{icon}<span className={`text-xs font-semibold ${titleColor}`}>{label}</span></div>
                  <span className={`text-xs font-bold ${titleColor}`}>{count} / {totalSalas}</span>
                </div>
                <div className={`h-2 ${barBg} rounded-full overflow-hidden`}>
                  <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: totalSalas > 0 ? `${count / totalSalas * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className={`h-px flex-1 ${divColor}`} />
        <span className={`text-xs font-bold ${divText} uppercase tracking-widest`}>Catálogo de salas</span>
        <div className={`h-px flex-1 ${divColor}`} />
      </div>

      {/* ── CATÁLOGO POR SEDE ─────────────────────────────────────────────── */}
      {(Object.entries(grouped) as [string, SalaRecord[]][]).map(([sede, salasSede]) => {
        const color = getSedeColor(sede, isNight);
        return (
          <section key={sede}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${color.badge} rounded-xl flex items-center justify-center shadow-sm`}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-extrabold ${color.text} tracking-tight`}>{sede}</h2>
                <p className={`text-xs ${subColor} font-medium`}>{salasSede.length} sala{salasSede.length !== 1 ? 's' : ''} disponible{salasSede.length !== 1 ? 's' : ''}</p>
              </div>
              <div className={`ml-auto h-px flex-1 ${color.border} border-t`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {salasSede.map((sala, i) => (
                <div
                  key={`${sala.sala}-${i}`}
                  className={`${color.bg} ${color.border} border rounded-2xl p-5 hover:shadow-lg transition-all duration-200 group`}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${sala.tipo === 'EXCLUSIVA'
                      ? isNight ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-100 text-amber-700'
                      : isNight ? 'bg-sky-900/60 text-sky-300' : 'bg-sky-100 text-sky-700'
                      }`}>
                      {sala.tipo || '—'}
                    </span>
                    <div className="flex gap-1.5">
                      {sala.tablero === 'SI' && (
                        <span title="Tablero" className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${isNight ? 'bg-slate-700' : 'bg-white/80'}`}>
                          <Monitor className="w-3.5 h-3.5 text-slate-500" />
                        </span>
                      )}
                      {sala.tv === 'SI' && (
                        <span title="TV" className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${isNight ? 'bg-slate-700' : 'bg-white/80'}`}>
                          <Tv2 className="w-3.5 h-3.5 text-slate-500" />
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`font-bold text-sm ${color.text} leading-snug mb-3 group-hover:underline`}>
                    {sala.sala || '—'}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className={`text-xs ${color.text}`}>
                        <span className="font-bold">{sala.capacidad}</span> puestos
                        {sala.equipos && sala.equipos !== sala.capacidad && (
                          <span className="opacity-60"> · {sala.equipos} equipos</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-3.5 h-3.5 shrink-0 ${isNight ? 'text-indigo-400' : 'text-amber-400'}`} />
                      <span className={`text-xs font-medium ${isNight ? 'text-indigo-300' : 'text-amber-700'}`}>{sala.horario || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className={`text-xs ${color.text} opacity-70`}>{sede}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
