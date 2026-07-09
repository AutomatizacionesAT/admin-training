import { useState } from 'react';
import { Users, MapPin, Clock, ClipboardList, ImageIcon, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import type { AsignacionRecord, SalaRecord } from '../utils/types';
import { getSalaPhotos } from '../utils/salaMedia';
import { parseAsignacionDate, formatAsignacionRango } from '../utils/asignacionUtils';

interface Props {
  asignacion: AsignacionRecord;
  sala: SalaRecord;
  onClose: () => void;
  isNight: boolean;
}

function getTurnoLabel(horario: string): 'AM' | 'PM' {
  const h = (horario || '').toUpperCase();
  return h.startsWith('14') || h.startsWith('15') || h.startsWith('16') ? 'PM' : 'AM';
}

export default function TimelineAssignmentModal({ asignacion, sala, onClose, isNight }: Props) {
  const photos = getSalaPhotos(sala.sala);
  const [photoIdx, setPhotoIdx] = useState(0);
  const start = parseAsignacionDate(asignacion.fechaInicial);
  const end = parseAsignacionDate(asignacion.fechaFin);
  const turno = getTurnoLabel(asignacion.horario);
  const overlay = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 lg:p-5';
  const panel = isNight
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-800';
  const muted = isNight ? 'text-slate-400' : 'text-slate-500';

  const prevPhoto = () => setPhotoIdx(i => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setPhotoIdx(i => (i + 1) % photos.length);

  return (
    <div className={overlay}>
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Cerrar" onClick={onClose} />

      <div className={`relative w-full sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col md:flex-row overflow-hidden rounded-t-3xl sm:rounded-3xl border shadow-2xl ${panel}`}>
        <div className="flex flex-col md:w-[38%] md:max-w-md md:shrink-0 min-h-0 order-2 md:order-1">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white ${turno === 'AM' ? 'bg-orange-500' : 'bg-blue-600'}`}>{turno}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${isNight ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                  <MapPin className="w-3 h-3" /> {sala.sede}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight">{asignacion.campana}</h2>
              <p className={`text-sm leading-relaxed ${muted}`}>{formatAsignacionRango(asignacion.fechaInicial, asignacion.fechaFin)}</p>
            </header>

            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users, label: 'Formador', value: asignacion.formador || '—' },
                { icon: UserCheck, label: 'Coordinador', value: asignacion.coordinador || '—' },
                { icon: ClipboardList, label: 'Tipo de uso', value: asignacion.tipoDeUso || '—' },
                { icon: ClipboardList, label: 'REQ', value: asignacion.req || '—' },
                { icon: Clock, label: 'Horario', value: asignacion.horario || '—' },
                { icon: Users, label: 'Personas', value: asignacion.dPersonas || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className={`rounded-2xl border p-3 ${isNight ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isNight ? 'bg-slate-700' : 'bg-white'}`}>
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>{label}</p>
                  </div>
                  <p className="text-sm font-bold leading-tight break-words">{value}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl border p-4 ${isNight ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>Detalle de fecha</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3"><span className={muted}>Inicio</span><span className="font-semibold">{start ? start.toLocaleDateString('es-CO') : '—'}</span></div>
                <div className="flex items-center justify-between gap-3"><span className={muted}>Fin</span><span className="font-semibold">{end ? end.toLocaleDateString('es-CO') : '—'}</span></div>
                <div className="flex items-center justify-between gap-3"><span className={muted}>Sala</span><span className="font-semibold">{sala.sala}</span></div>
                <div className="flex items-center justify-between gap-3"><span className={muted}>Capacidad</span><span className="font-semibold">{sala.capacidad || '—'}</span></div>
              </div>
            </div>
          </div>

          <div className={`shrink-0 px-5 sm:px-6 py-4 border-t ${isNight ? 'border-slate-700 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'}`}>
            <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/25">
              Cerrar
            </button>
          </div>
        </div>

        <div className="relative flex-1 md:min-w-0 bg-slate-900 order-1 md:order-2 h-[58vh] md:h-auto overflow-hidden">
          {photos.length > 0 ? (
            <>
              <img src={photos[photoIdx]} alt={`${sala.sala} — foto ${photoIdx + 1}`} decoding="async" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover object-center" />
              {photos.length > 1 && (
                <>
                  <button type="button" onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 px-3 flex gap-2 overflow-x-auto justify-center z-10">
                    {photos.map((url, i) => (
                      <button key={url} type="button" onClick={() => setPhotoIdx(i)} className={`shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-orange-500 ring-2 ring-orange-400/50' : 'border-white/20 opacity-70 hover:opacity-100'}`}>
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
