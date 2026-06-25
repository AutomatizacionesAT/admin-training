import { useState } from 'react';
import { Building2, Users, Monitor, Tv2, MapPin, ClipboardList, Lock, RotateCcw, UserCheck, Sun, Moon, Eye, Search, X } from 'lucide-react';
import type { SalaRecord, AsignacionRecord } from '../utils/types';
import { getSalaPhotos } from '../utils/salaMedia';
import { getSalaTurnos } from '../utils/salaUtils';
import SalaDetailModal from './SalaDetailModal';

interface Props {
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
  canSolicitar?: boolean;
  canGestionar?: boolean;
  onSolicitar?: () => void;
  onGestionar?: () => void;
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

/** Colores marca Atento (#005082 azul, #F7941D naranja) — filtros del catálogo */
function filtroInactive(isNight: boolean) {
  return isNight
    ? 'bg-slate-800 text-[#7eb8d4] border border-[#005082]/35 hover:bg-[#005082]/15'
    : 'bg-white text-[#005082] border border-[#005082]/20 hover:bg-[#005082]/5';
}

function filtroActiveBlue(isNight: boolean) {
  return isNight
    ? 'bg-[#005082] text-white border-transparent shadow-md shadow-[#005082]/35'
    : 'bg-[#005082] text-white border-transparent shadow-md shadow-[#005082]/20';
}

function filtroActiveOrange(isNight: boolean) {
  return isNight
    ? 'bg-[#F7941D] text-white border-transparent shadow-md shadow-[#F7941D]/35'
    : 'bg-[#F7941D] text-white border-transparent shadow-md shadow-[#F7941D]/25';
}

function filtroBadgeInactive(isNight: boolean) {
  return isNight ? 'bg-[#005082]/25 text-[#9ccde0]' : 'bg-[#005082]/10 text-[#005082]';
}

const FILTRO_BADGE_ACTIVE = 'bg-white/25 text-white';

type Turno = 'AM' | 'PM' | 'ALL';
type TipoFilter = 'ALL' | 'EXCLUSIVA' | 'ROTATIVA';

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

function filterByTipo(salas: SalaRecord[], tipo: TipoFilter): SalaRecord[] {
  if (tipo === 'ALL') return salas;
  return salas.filter(s => (s.tipo || '').toUpperCase() === tipo);
}

function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filterBySearch(salas: SalaRecord[], query: string): SalaRecord[] {
  const q = normalizeSearch(query);
  if (!q) return salas;
  return salas.filter(s => {
    const name = normalizeSearch(s.sala);
    const sede = normalizeSearch(s.sede);
    return name.includes(q) || sede.includes(q);
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

// ── Grilla de salas por sede ──────────────────────────────────────────────────
interface SedeSalasGridProps {
  sede: string;
  salasSede: SalaRecord[];
  allSalas: SalaRecord[];
  isNight: boolean;
  showHeading: boolean;
  onSelectSala: (sala: SalaRecord, sede: string) => void;
}

function SedeSalasGrid({ sede, salasSede, allSalas, isNight, showHeading, onSelectSala }: SedeSalasGridProps) {
  const color = getSedeColor(sede, isNight);
  const salasUnicasSede = salasSede.filter((s, idx, arr) =>
    arr.findIndex(x => x.sala === s.sala) === idx,
  );
  const subColor = 'text-slate-400';

  return (
    <section>
      {showHeading && (
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-1 h-5 rounded-full ${color.bar}`} />
          <h2 className={`text-sm font-extrabold ${color.text} tracking-tight`}>{sede}</h2>
          <span className={`text-xs ${subColor}`}>
            {salasUnicasSede.length} sala{salasUnicasSede.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {salasUnicasSede.map((sala, i) => (
          <SalaCard
            key={`${sala.sala}-${i}`}
            sala={sala}
            sede={sede}
            isNight={isNight}
            allSalas={allSalas}
            onSelect={() => onSelectSala(sala, sede)}
          />
        ))}
      </div>
    </section>
  );
}

// ── Tarjeta de sala ───────────────────────────────────────────────────────────
interface SalaCardProps {
  sala: SalaRecord;
  sede: string;
  isNight: boolean;
  allSalas: SalaRecord[];
  onSelect: () => void;
}

function SalaCard({ sala, sede, isNight, allSalas, onSelect }: SalaCardProps) {
  const color = getSedeColor(sede, isNight);
  const cardBg = isNight ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
  const fotos = getSalaPhotos(sala.sala);
  const preview = fotos[0];
  const turnos = getSalaTurnos(sala.sala, allSalas);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${cardBg} border rounded-2xl overflow-hidden hover:shadow-lg hover:ring-2 hover:ring-indigo-300/60 transition-all duration-200 group flex flex-col text-left w-full`}
    >
      {/* Preview foto */}
      {preview ? (
        <div className="relative aspect-16/10 overflow-hidden">
          <img
            src={preview}
            alt={sala.sala}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
          <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <Eye className="w-3 h-3" /> Ver detalle
          </span>
        </div>
      ) : (
        <div className={`aspect-16/10 flex items-center justify-center ${isNight ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
          <Building2 className={`w-8 h-8 ${isNight ? 'text-slate-600' : 'text-slate-300'}`} />
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Tipo + equipamiento */}
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${sala.tipo === 'EXCLUSIVA'
            ? isNight ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-100 text-amber-700'
            : isNight ? 'bg-sky-900/60 text-sky-300' : 'bg-sky-100 text-sky-700'
            }`}>
            {sala.tipo || '—'}
          </span>
          <div className="flex gap-1.5">
            {sala.tablero === 'SI' && (
              <span title="Tablero" className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${isNight ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              </span>
            )}
            {sala.tv === 'SI' && (
              <span title="TV" className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${isNight ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <Tv2 className="w-3.5 h-3.5 text-teal-400" />
              </span>
            )}
          </div>
        </div>

        {/* Nombre de sala */}
        <h3 className={`uppercase font-bold text-sm ${color.text} leading-snug group-hover:underline`}>
          {sala.sala || '—'}
        </h3>

        {/* Detalles */}
        <div className="space-y-1.5 mt-auto">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className={`text-xs ${color.text}`}>
              <span className="font-bold">{sala.capacidad}</span> puestos
              {sala.equipos && sala.equipos !== sala.capacidad && (
                <span className="opacity-60"> · {sala.equipos} equipos</span>
              )}
            </span>
          </div>
          <div className="space-y-1 mt-auto">
            {turnos.map(({ label, horario }) => {
              const isManana = label === 'Mañana';
              return (
                <div key={label} className="flex items-center gap-2">
                  {isManana
                    ? <Sun className={`w-3.5 h-3.5 shrink-0 ${isNight ? 'text-amber-400' : 'text-amber-500'}`} />
                    : <Moon className={`w-3.5 h-3.5 shrink-0 ${isNight ? 'text-indigo-400' : 'text-indigo-500'}`} />
                  }
                  <span className={`text-[11px] font-medium ${isNight ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="font-bold">{label}:</span> {horario}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className={`text-xs ${color.text} opacity-70`}>{sede}</span>
          </div>
        </div>

        {/* Barra decorativa de color sede */}
        <div className={`h-1 w-full rounded-full ${color.bar} opacity-30 group-hover:opacity-70 transition-opacity`} />
      </div>
    </button>
  );
}

export default function PublicView({ salas, asignaciones, canSolicitar = false, canGestionar = false, onSolicitar, onGestionar }: Props) {
  const [turno, setTurno] = useState<Turno>('AM');
  const [sedeFilter, setSedeFilter] = useState<string>('ALL');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSala, setSelectedSala] = useState<{ sala: SalaRecord; sede: string } | null>(null);

  const isNight = turno === 'PM';
  const isGlobal = turno === 'ALL';

  // Salas únicas (sin duplicar AM/PM) → capacidad física por sala
  const salasUnicas = salas.filter((s, idx, arr) =>
    arr.findIndex(x => x.sala === s.sala) === idx
  );
  const groupedGlobal = groupBySede(salasUnicas);

  // Salas filtradas por turno → catálogo y KPIs del turno activo
  const salasFiltradas = filterByTurno(salas, turno);
  const salasTurnoUnicas = salasFiltradas.filter((s, idx, arr) =>
    arr.findIndex(x => x.sala === s.sala) === idx
  );
  const grouped = groupBySede(salasFiltradas);
  const salasCatalogo = filterBySearch(filterByTipo(salasFiltradas, tipoFilter), searchQuery);
  const groupedCatalogo = groupBySede(salasCatalogo);

  const capacidadPorTurno = salasUnicas.reduce((sum, s) => sum + (parseInt(s.capacidad) || 0), 0);
  const equiposPorTurno = salasUnicas.reduce((sum, s) => sum + (parseInt(s.equipos) || 0), 0);
  // 543 puestos por turno; General = AM + PM (misma sala, dos turnos)
  const capacidadTotal = isGlobal ? capacidadPorTurno * 2 : capacidadPorTurno;
  const equiposTotal = isGlobal ? equiposPorTurno * 2 : equiposPorTurno;

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalSalas = salasUnicas.length;
  const salasEnTurno = salasTurnoUnicas.length;
  const exclusivas = salasUnicas.filter(s => s.tipo === 'EXCLUSIVA').length;
  const rotativas = salasUnicas.filter(s => s.tipo === 'ROTATIVA').length;
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
  const sedesEnTurno = Object.keys(grouped).filter(s => s !== 'SIN SEDE');
  const sedesEnTurnoSorted = [...sedesEnTurno].sort(
    (a, b) => (grouped[b]?.length ?? 0) - (grouped[a]?.length ?? 0),
  );
  const catalogoSedes = Object.keys(groupedCatalogo).filter(s => s !== 'SIN SEDE');
  const catalogoSedesSorted = [...catalogoSedes].sort(
    (a, b) => (groupedCatalogo[b]?.length ?? 0) - (groupedCatalogo[a]?.length ?? 0),
  );

  const countSalasUnicas = (list: SalaRecord[]) =>
    list.filter((s, idx, arr) => arr.findIndex(x => x.sala === s.sala) === idx).length;

  const salasParaConteoTipo = sedeFilter === 'ALL'
    ? salasFiltradas
    : salasFiltradas.filter(s => s.sede === sedeFilter);
  const countTodasTipo = countSalasUnicas(salasParaConteoTipo);
  const countExclusivasTipo = countSalasUnicas(salasParaConteoTipo.filter(s => s.tipo === 'EXCLUSIVA'));
  const countRotativasTipo = countSalasUnicas(salasParaConteoTipo.filter(s => s.tipo === 'ROTATIVA'));

  const catalogoEntries = (sedeFilter === 'ALL'
    ? catalogoSedesSorted
    : catalogoSedesSorted.filter(s => s === sedeFilter)
  )
    .filter(s => (groupedCatalogo[s]?.length ?? 0) > 0)
    .map(sede => [sede, groupedCatalogo[sede]] as [string, SalaRecord[]]);

  const totalCatalogoSalas = catalogoEntries.reduce(
    (sum, [, list]) => sum + countSalasUnicas(list),
    0,
  );

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
            <p className="text-xs text-slate-300 mt-0.5">{totalSalas} salas · {capacidadPorTurno} puestos × 2 turnos</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-4xl font-black text-white">{capacidadTotal}</p>
            <p className="text-xs text-slate-300 font-semibold">puestos (AM + PM)</p>
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
            <p className="text-xs text-indigo-300 mt-0.5">{salasEnTurno} sala{salasEnTurno !== 1 ? 's' : ''} · {capacidadPorTurno} puestos en este turno</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-4xl font-black text-indigo-400">{capacidadTotal}</p>
            <p className="text-xs text-indigo-500 font-semibold">puestos turno tarde</p>
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
            <p className="text-xs text-amber-800 mt-0.5">{salasEnTurno} sala{salasEnTurno !== 1 ? 's' : ''} · {capacidadPorTurno} puestos en este turno</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-4xl font-black text-amber-900">{capacidadTotal}</p>
            <p className="text-xs text-amber-800 font-semibold">puestos turno mañana</p>
          </div>
          <div className="absolute right-6 top-3 text-amber-600/40 text-lg select-none pointer-events-none">☀ ☀ ☀</div>
        </div>
      )}

      {(canSolicitar || canGestionar) && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Accesos según rol</p>
            <p className="mt-1 text-sm text-slate-600">
              {canSolicitar ? 'Entra a solicitar y gestionar tus asignaciones.' : 'Consulta general del catálogo de salas.'}
            </p>
          </div>
          {canSolicitar && onSolicitar && (
            <button
              type="button"
              onClick={onSolicitar}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005082] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#004066]"
            >
              <ClipboardList className="h-4 w-4" />
              Solicitar
            </button>
          )}
          {canGestionar && onGestionar && (
            <button
              type="button"
              onClick={onGestionar}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F7941D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#df850f]"
            >
              <Building2 className="h-4 w-4" />
              Gestionar
            </button>
          )}
        </div>
      )}

      {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard night={isNight} label="Total Salas" value={totalSalas} color={isNight ? 'text-indigo-400' : 'text-indigo-600'} icon={<Building2 className={`w-5 h-5 ${isNight ? 'text-indigo-400' : 'text-indigo-500'}`} />} sub={`${sedesActivas} sede${sedesActivas !== 1 ? 's' : ''}`} />
        <KpiCard night={isNight} label="Exclusivas" value={exclusivas} color={isNight ? 'text-amber-400' : 'text-amber-600'} icon={<Lock className={`w-5 h-5 ${isNight ? 'text-amber-400' : 'text-amber-500'}`} />} sub={totalSalas > 0 ? `${Math.round(exclusivas / totalSalas * 100)}% del total` : '—'} />
        <KpiCard night={isNight} label="Rotativas" value={rotativas} color={isNight ? 'text-sky-400' : 'text-sky-600'} icon={<RotateCcw className={`w-5 h-5 ${isNight ? 'text-sky-400' : 'text-sky-500'}`} />} sub={totalSalas > 0 ? `${Math.round(rotativas / totalSalas * 100)}% del total` : '—'} />
        <KpiCard night={isNight} label={isGlobal ? 'Capacidad Total' : 'Capacidad Turno'} value={capacidadTotal} color={isNight ? 'text-violet-400' : 'text-violet-600'} icon={<Users className={`w-5 h-5 ${isNight ? 'text-violet-400' : 'text-violet-500'}`} />} sub={isGlobal ? `${equiposTotal} equipos · AM + PM` : `${equiposTotal} equipos · ${turno === 'AM' ? 'mañana' : 'tarde'}`} />
        <KpiCard night={isNight} label="Asignaciones" value={totalAsig} color={isNight ? 'text-emerald-400' : 'text-emerald-600'} icon={<ClipboardList className={`w-5 h-5 ${isNight ? 'text-emerald-400' : 'text-emerald-500'}`} />} sub="formaciones activas" />
        <KpiCard night={isNight} label="Coordinadores" value={coordinadores} color={isNight ? 'text-rose-400' : 'text-rose-600'} icon={<UserCheck className={`w-5 h-5 ${isNight ? 'text-rose-400' : 'text-rose-500'}`} />} sub="con sala asignada" />
      </div>

      {/* ── DISTRIBUCIÓN + EQUIPAMIENTO ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className={`${cardBg} border rounded-2xl p-6 shadow-sm`}>
          <h3 className={`uppercase text-sm font-bold ${titleColor} mb-4 flex items-center gap-2`}>
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
          <h3 className={`text-sm font-bold uppercase ${titleColor} mb-4 flex items-center gap-2`}>
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

      {/* ── CATÁLOGO POR SEDE ─────────────────────────────────────────────── */}
      <div>
        {/* Header del catálogo + botones de control */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-px flex-1 ${divColor}`} />
          <span className={`text-xs font-bold ${divText} uppercase tracking-widest`}>Catálogo de salas</span>
          <div className={`h-px flex-1 ${divColor}`} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* Filtro por sede */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSedeFilter('ALL')}
                className={`uppercase flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${sedeFilter === 'ALL'
                  ? filtroActiveOrange(isNight)
                  : filtroInactive(isNight)
                  }`}
              >
                <Building2 className="w-4 h-4" />
                Todas
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sedeFilter === 'ALL'
                  ? FILTRO_BADGE_ACTIVE
                  : filtroBadgeInactive(isNight)
                  }`}>
                  {sedesEnTurnoSorted.reduce((n, s) => n + countSalasUnicas(grouped[s] ?? []), 0)}
                </span>
              </button>

              {sedesEnTurnoSorted.map(sede => {
                const count = countSalasUnicas(grouped[sede] ?? []);
                const active = sedeFilter === sede;
                return (
                  <button
                    key={sede}
                    type="button"
                    onClick={() => setSedeFilter(sede)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${active
                      ? filtroActiveBlue(isNight)
                      : filtroInactive(isNight)
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-white/80' : 'bg-[#005082]/50'}`} />
                    {sede}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${active
                      ? FILTRO_BADGE_ACTIVE
                      : filtroBadgeInactive(isNight)
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subfiltro por tipo */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${divText} mr-0.5`}>Tipo:</span>
              <button
                type="button"
                onClick={() => setTipoFilter('ALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${tipoFilter === 'ALL'
                  ? filtroActiveBlue(isNight)
                  : filtroInactive(isNight)
                  }`}
              >
                Todas
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tipoFilter === 'ALL'
                  ? FILTRO_BADGE_ACTIVE
                  : filtroBadgeInactive(isNight)
                  }`}>
                  {countTodasTipo}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTipoFilter('EXCLUSIVA')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${tipoFilter === 'EXCLUSIVA'
                  ? filtroActiveOrange(isNight)
                  : filtroInactive(isNight)
                  }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Exclusivas
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tipoFilter === 'EXCLUSIVA'
                  ? FILTRO_BADGE_ACTIVE
                  : filtroBadgeInactive(isNight)
                  }`}>
                  {countExclusivasTipo}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTipoFilter('ROTATIVA')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${tipoFilter === 'ROTATIVA'
                  ? filtroActiveBlue(isNight)
                  : filtroInactive(isNight)
                  }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rotativas
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tipoFilter === 'ROTATIVA'
                  ? FILTRO_BADGE_ACTIVE
                  : filtroBadgeInactive(isNight)
                  }`}>
                  {countRotativasTipo}
                </span>
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative w-full lg:w-72 shrink-0 lg:mt-0.5">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isNight ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar sala…"
              autoComplete="off"
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${isNight
                ? 'bg-slate-800 border-[#005082]/35 text-slate-100 placeholder:text-slate-500 focus:border-[#005082] focus:ring-2 focus:ring-[#005082]/30'
                : 'bg-white border-[#005082]/20 text-slate-800 placeholder:text-slate-400 focus:border-[#005082] focus:ring-2 focus:ring-[#005082]/15'
                }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isNight
                  ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className={`text-xs ${divText} mb-4`}>
          {totalCatalogoSalas} sala{totalCatalogoSalas !== 1 ? 's' : ''}
          {sedeFilter !== 'ALL' ? ` en ${sedeFilter}` : ` · ${catalogoEntries.length} sede${catalogoEntries.length !== 1 ? 's' : ''}`}
          {tipoFilter === 'EXCLUSIVA' ? ' · exclusivas' : tipoFilter === 'ROTATIVA' ? ' · rotativas' : ''}
          {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ''}
        </p>

        {/* Salas filtradas */}
        <div className="space-y-8">
          {catalogoEntries.map(([sede, salasSede]) => (
            <SedeSalasGrid
              key={sede}
              sede={sede}
              salasSede={salasSede}
              allSalas={salas}
              isNight={isNight}
              showHeading={sedeFilter === 'ALL'}
              onSelectSala={(sala, sedeKey) => setSelectedSala({ sala, sede: sedeKey })}
            />
          ))}
          {catalogoEntries.length === 0 && (
            <p className={`text-sm text-center py-8 ${divText}`}>
              {searchQuery.trim()
                ? `No hay salas que coincidan con “${searchQuery.trim()}”.`
                : <>No hay salas
                  {tipoFilter === 'EXCLUSIVA' ? ' exclusivas' : tipoFilter === 'ROTATIVA' ? ' rotativas' : ''}
                  {sedeFilter !== 'ALL' ? ` en ${sedeFilter}` : ''} para el turno seleccionado.</>}
            </p>
          )}
        </div>
      </div>

      {selectedSala && (
        <SalaDetailModal
          sala={selectedSala.sala}
          sede={selectedSala.sede}
          allSalas={salas}
          asignaciones={asignaciones}
          isNight={isNight}
          onClose={() => setSelectedSala(null)}
        />
      )}
    </div>
  );
}
