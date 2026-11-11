import { Users, Clock, MessageSquareText, CalendarDays, Database } from 'lucide-react';
import type { BiometricKpis } from '../utils/types';

interface KpiCardsProps {
  kpis: BiometricKpis;
  observaciones: { observacion: string; cantidad: number }[];
  onVerObservacion: (observacion: string) => void;
}

const observationColors = [
  'from-orange-500 to-orange-700 border-orange-400',
  'from-violet-500 to-violet-700 border-violet-400',
  'from-cyan-600 to-cyan-800 border-cyan-500',
  'from-rose-500 to-rose-700 border-rose-400',
  'from-teal-600 to-teal-800 border-teal-500',
  'from-fuchsia-600 to-fuchsia-800 border-fuchsia-500',
];

export default function KpiCards({ kpis, observaciones, onVerObservacion }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {/* Total Registros */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 border border-slate-600 shadow flex items-center gap-3 text-white transition-transform hover:-translate-y-1">
        <div className="w-11 h-11 rounded-xl bg-slate-600/50 flex items-center justify-center shrink-0 border border-slate-500/50">
          <Database className="w-5 h-5 text-slate-100" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">Líneas de Log</p>
          <div className="text-2xl font-black drop-shadow-sm">{kpis.totalRegistros}</div>
        </div>
      </div>

      {/* Total Colaboradores */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-4 border border-blue-400 shadow-blue-900/20 shadow-lg flex items-center gap-3 text-white transition-transform hover:-translate-y-1">
        <div className="w-11 h-11 rounded-xl bg-blue-400/30 flex items-center justify-center shrink-0 border border-blue-300/30">
          <Users className="w-5 h-5 text-blue-50" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider mb-0.5">Colaboradores</p>
          <div className="text-2xl font-black drop-shadow-sm">{kpis.totalColaboradores}</div>
        </div>
      </div>

      {/* Promedio Horas Diarias */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 border border-emerald-400 shadow-emerald-900/20 shadow-lg flex items-center gap-3 text-white transition-transform hover:-translate-y-1">
        <div className="w-11 h-11 rounded-xl bg-emerald-400/30 flex items-center justify-center shrink-0 border border-emerald-300/30">
          <Clock className="w-5 h-5 text-emerald-50" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-0.5">Prome Horas/Día</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black drop-shadow-sm">{kpis.promedioHorasDiarias.toFixed(2)}</span>
            <span className="text-xs font-bold text-emerald-200">h</span>
          </div>
        </div>
      </div>

      {/* Horas Totales Muestra */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 border border-indigo-400 shadow-indigo-900/20 shadow-lg flex items-center gap-3 text-white transition-transform hover:-translate-y-1">
        <div className="w-11 h-11 rounded-xl bg-indigo-400/30 flex items-center justify-center shrink-0 border border-indigo-300/30">
          <CalendarDays className="w-5 h-5 text-indigo-50" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider mb-0.5">Total Horas</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black drop-shadow-sm">{kpis.totalHorasTrabajadas.toFixed(0)}</span>
            <span className="text-xs font-bold text-indigo-200">h</span>
          </div>
        </div>
      </div>

      {/* Tarjetas dinámicas: el color distingue categorías, no su gravedad. */}
      {observaciones.map(({ observacion, cantidad }, index) => (
        <button
          key={observacion}
          type="button"
          onClick={() => onVerObservacion(observacion)}
          aria-haspopup="dialog"
          aria-label={`Ver colaboradores con ${observacion}: ${cantidad} registros`}
          className={`bg-gradient-to-br ${observationColors[index % observationColors.length]} rounded-2xl p-4 border shadow-lg flex items-center gap-3 text-left text-white transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
        >
          <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/25">
            <MessageSquareText className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider mb-0.5 wrap-break-word">{observacion}</span>
            <span className="block text-2xl font-black drop-shadow-sm tabular-nums">{cantidad}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
