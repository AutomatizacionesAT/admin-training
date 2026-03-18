import { Target, Users, DollarSign, TrendingUp } from 'lucide-react';
import type { GlobalKpis } from '../utils/types';

interface KpiCardsProps {
  totalCampanas: number;
  kpis: GlobalKpis;
}

export default function KpiCards({ totalCampanas, kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Target className="w-16 h-16 text-blue-600" /></div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Campañas Activas</p>
        <h4 className="text-4xl font-extrabold text-slate-900 mt-2">{totalCampanas}</h4>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-16 h-16 text-indigo-600" /></div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total RACS (Global)</p>
        <h4 className="text-4xl font-extrabold text-indigo-600 mt-2">{kpis.racs}</h4>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16 text-emerald-600" /></div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ingresos Meta (Mes)</p>
        <h4 className="text-4xl font-extrabold text-emerald-600 mt-2">{kpis.ingresosMes}</h4>
      </div>

      <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16 text-white" /></div>
        <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Cumplimiento Global</p>
        <div className="flex items-end gap-3 mt-2">
          <h4 className="text-4xl font-extrabold">{kpis.globalPercentage}%</h4>
          <p className="text-sm text-slate-400 mb-1">{kpis.registros} / {kpis.ingresosSemana}</p>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              kpis.globalPercentage >= 100 ? 'bg-emerald-400' : kpis.globalPercentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${Math.min(kpis.globalPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
