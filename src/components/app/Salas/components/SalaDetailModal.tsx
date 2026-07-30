import { useState } from 'react';
import {
  Users, Monitor, Tv2, MapPin,
  Lock, RotateCcw, ClipboardList, ChevronLeft, ChevronRight, ImageIcon, Sun, Moon,
} from 'lucide-react';
import type { SalaRecord, AsignacionRecord } from '../utils/types';
import { getSalaPhotos, getSalaDescripcion } from '../utils/salaMedia';
import { getSalaTurnos } from '../utils/salaUtils';

interface Props {
  sala: SalaRecord;
  sede: string;
  allSalas: SalaRecord[];
  asignaciones: AsignacionRecord[];
  isNight: boolean;
  onClose: () => void;
}

const SEDE_HEX: Record<string, string> = {
  TELARES: '#3b82f6',
  ROYAL: '#8b5cf6',
  ELEMENTO: '#10b981',
};

function getSedeHex(sede: string) {
  const upper = sede.toUpperCase();
  for (const key of Object.keys(SEDE_HEX)) {
    if (upper.includes(key)) return SEDE_HEX[key];
  }
  return '#64748b';
}

export default function SalaDetailModal({ sala, sede, allSalas, asignaciones, isNight, onClose }: Props) {
  const fotos = getSalaPhotos(sala.sala, sede);
  const descripcion = getSalaDescripcion(sala.sala, sede);
  const turnos = getSalaTurnos(sala.sala, allSalas);
  const [fotoIdx, setFotoIdx] = useState(0);

  const sedeColor = getSedeHex(sede);
  const asigsSala = asignaciones.filter(
    a => a.sala === sala.sala && (a.estadoAsignacion || 'APROBADO') === 'APROBADO',
  );
  const capacidadRef = turnos[0]?.capacidad || sala.capacidad;
  const equiposRef = turnos[0]?.equipos || sala.equipos;

  const overlay = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 lg:p-5';
  const panel = isNight
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-800';
  const muted = isNight ? 'text-slate-400' : 'text-slate-500';
  const cardInner = isNight ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100';

  const prevFoto = () => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length);
  const nextFoto = () => setFotoIdx(i => (i + 1) % fotos.length);

  return (
    <div className={overlay}>
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className={`relative w-full sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col md:flex-row md:items-stretch overflow-hidden rounded-t-3xl sm:rounded-3xl border shadow-2xl ${panel}`}>

        {/* Info — columna izquierda (más compacta) */}
        <div className="flex flex-col md:w-[38%] md:max-w-md md:shrink-0 min-h-0 min-w-0 order-2 md:order-1">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

            <header className="space-y-3">
              <h2 className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight">{sala.sala}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${sala.tipo === 'EXCLUSIVA'
                  ? isNight ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-100 text-amber-700'
                  : isNight ? 'bg-sky-900/60 text-sky-300' : 'bg-sky-100 text-sky-700'
                  }`}>
                  {sala.tipo === 'EXCLUSIVA' ? <Lock className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                  {sala.tipo || '—'}
                </span>
                {sala.tablero === 'SI' && (
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${isNight ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Monitor className="w-3 h-3" /> Tablero
                  </span>
                )}
                {sala.tv === 'SI' && (
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${isNight ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-50 text-teal-600'}`}>
                    <Tv2 className="w-3 h-3" /> TV
                  </span>
                )}
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 text-white"
                  style={{ backgroundColor: sedeColor }}
                >
                  <MapPin className="w-3 h-3" />
                  {sede}
                </span>
              </div>
              {descripcion && (
                <p className={`text-sm leading-relaxed ${muted}`}>{descripcion}</p>
              )}
            </header>

            <div className={`grid grid-cols-2 rounded-2xl border overflow-hidden ${cardInner}`}>
              {[
                { icon: Users, label: 'Capacidad', value: `${capacidadRef} puestos`, color: 'text-violet-500', bg: isNight ? 'bg-violet-950/40' : 'bg-violet-50' },
                { icon: Monitor, label: 'Equipos', value: equiposRef || '—', color: 'text-indigo-500', bg: isNight ? 'bg-indigo-950/40' : 'bg-indigo-50' },
              ].map(({ icon: Icon, label, value, color, bg }, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-3.5 ${i === 0 ? `border-r ${isNight ? 'border-slate-700' : 'border-slate-200'}` : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>{label}</p>
                    <p className="text-sm font-bold truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {turnos.map(({ label, horario, capacidad, equipos }) => {
                const isManana = label === 'Mañana';
                const accentBg = isManana
                  ? isNight ? 'bg-amber-950/50' : 'bg-amber-100'
                  : isNight ? 'bg-indigo-950/50' : 'bg-indigo-100';
                const accentText = isManana
                  ? isNight ? 'text-amber-300' : 'text-amber-700'
                  : isNight ? 'text-indigo-300' : 'text-indigo-700';
                const borderAccent = isManana
                  ? isNight ? 'border-amber-800/60' : 'border-amber-200'
                  : isNight ? 'border-indigo-800/60' : 'border-indigo-200';

                return (
                  <div
                    key={label}
                    className={`rounded-2xl border p-3 ${cardInner} ${borderAccent}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accentBg}`}>
                        {isManana
                          ? <Sun className={`w-3.5 h-3.5 ${accentText}`} />
                          : <Moon className={`w-3.5 h-3.5 ${accentText}`} />
                        }
                      </div>
                      <p className={`text-[10px] font-bold uppercase ${accentText}`}>{label}</p>
                    </div>
                    <p className="text-xs font-extrabold leading-tight">{horario}</p>
                    <p className={`text-[10px] mt-1 ${muted}`}>{capacidad} p · {equipos} eq.</p>
                  </div>
                );
              })}
            </div>

            <section className={`rounded-2xl border p-4 ${cardInner}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${muted}`}>
                <ClipboardList className="w-3.5 h-3.5" />
                Formaciones en esta sala
              </p>
              {asigsSala.length === 0 ? (
                <p className={`text-sm ${muted}`}>Sin asignaciones activas en este momento.</p>
              ) : (
                <div className="space-y-2">
                  {asigsSala.map((a, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border px-3 py-2.5 ${isNight ? 'bg-slate-900/50 border-slate-600' : 'bg-white border-slate-200'}`}
                    >
                      <p className="font-bold text-sm">{a.campana}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>
                        {a.formador} · {a.dPersonas} personas · {a.horario}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className={`shrink-0 px-5 sm:px-6 py-4 border-t ${isNight ? 'border-slate-700 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'}`}>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/25"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Imagen — columna derecha ancha, misma altura que la info */}
        <div className="relative flex-1 md:min-w-0 bg-slate-900 order-1 md:order-2 h-[58vh] md:h-auto overflow-hidden">
          {fotos.length > 0 ? (
            <>
              <img
                src={fotos[fotoIdx]}
                alt={`${sala.sala} — foto ${fotoIdx + 1}`}
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              {fotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevFoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextFoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 px-3 flex gap-2 overflow-x-auto justify-center z-10">
                    {fotos.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setFotoIdx(i)}
                        className={`shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${i === fotoIdx ? 'border-orange-500 ring-2 ring-orange-400/50' : 'border-white/20 opacity-70 hover:opacity-100'
                          }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-br from-slate-700 to-slate-900">
              <ImageIcon className="w-12 h-12 text-slate-500" />
              <p className="text-sm text-slate-400">Sin fotos disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
