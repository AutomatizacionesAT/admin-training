import { Users, Clock, AlertTriangle, UserX, CalendarDays, Database } from 'lucide-react';
import type { BiometricKpis } from '../utils/types';

interface KpiCardsProps {
  kpis: BiometricKpis;
}

export default function KpiCards({ kpis }: KpiCardsProps) {
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

      {/* Llegadas Tarde */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-4 border border-orange-300 shadow-orange-900/20 shadow-lg flex items-center gap-3 text-white transition-transform hover:-translate-y-1">
        <div className="w-11 h-11 rounded-xl bg-orange-300/30 flex items-center justify-center shrink-0 border border-orange-200/30">
          <AlertTriangle className="w-5 h-5 text-orange-50" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider mb-0.5">Llegadas Tarde</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black drop-shadow-sm">{kpis.totalLlegadasTarde}</span>
          </div>
        </div>
      </div>

      {/* Ausencias / Novedades */}
      <div className="bg-gradient-to-br from-red-500 to-rose-700 rounded-2xl p-4 border border-red-400 shadow-red-900/20 shadow-lg flex items-center gap-3 text-white transition-transform hover:-translate-y-1">
        <div className="w-11 h-11 rounded-xl bg-red-400/30 flex items-center justify-center shrink-0 border border-red-300/30">
          <UserX className="w-5 h-5 text-red-50" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-red-100 uppercase tracking-wider mb-0.5">Ausencias</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black drop-shadow-sm">{kpis.totalAusencias}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
