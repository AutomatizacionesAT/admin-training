import { BarChart3, DollarSign, Eye, UserCircle, Users } from 'lucide-react';
import type { CampaignReport } from '../utils/types';
import { getPercentage } from '../utils/calculations';
import { useAuth } from '@/context/AuthContext';

interface CampaignCardProps {
  report: CampaignReport;
  coordinadoresList: string[];
  isCollapsed: boolean;
  onUpdate: (id: string, field: keyof CampaignReport, value: string | number) => void;
  onViewDetail: (campana: string) => void;
}

export default function CampaignCard({ report, coordinadoresList, isCollapsed, onUpdate, onViewDetail }: CampaignCardProps) {
  const { isAdmin } = useAuth();
  const totalIngresosMes = report.totalRacs * report.diasHabilesMes;
  const totalIngresosSemana = report.totalRacs * report.diasHabilesSemana;
  const porcentaje = getPercentage(report.totalIngresosRegistros, totalIngresosSemana);
  const colorTier = porcentaje >= 80 ? 'green' : porcentaje >= 60 ? 'yellow' : porcentaje >= 40 ? 'orange' : 'red';

  const badgeClass = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }[colorTier];

  const barClass = { green: 'bg-emerald-500', yellow: 'bg-yellow-400', orange: 'bg-orange-400', red: 'bg-red-400' }[colorTier];
  const textClass = { green: 'text-emerald-600', yellow: 'text-yellow-600', orange: 'text-orange-600', red: 'text-red-500' }[colorTier];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
            <h3 className="font-bold text-slate-800 text-base leading-tight line-clamp-2" title={report.campana}>
              {report.campana}
            </h3>
          </div>
          {isCollapsed && report.coordinador && (
            <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-1 pl-4" title={report.coordinador}>
              <UserCircle className="w-3 h-3 shrink-0" />
              {report.coordinador}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${badgeClass}`}>
          {porcentaje}%
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-3.5 flex-1 flex flex-col gap-3">

          {/* Coordinador */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              className={`w-full bg-transparent outline-none text-xs font-medium placeholder:text-slate-400 ${
                isAdmin ? 'text-slate-700 cursor-pointer' : 'text-slate-500 cursor-not-allowed'
              }`}
              value={report.coordinador}
              disabled={!isAdmin}
              onChange={(e) => onUpdate(report.id, 'coordinador', e.target.value)}
            >
              <option value="">Seleccionar Coordinador</option>
              {coordinadoresList.map((coord) => (
                <option key={coord} value={coord}>
                  {coord}
                </option>
              ))}
            </select>
          </div>

          {/* Editor Grid: RACS + Registros */}
          <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Total RACS</label>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-slate-200 focus-within:border-blue-400">
                  <Users className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                  <input
                    type="number"
                    disabled={!isAdmin}
                    className={`w-full bg-transparent outline-none text-sm font-bold ${
                      isAdmin ? 'text-slate-800' : 'text-slate-500 cursor-not-allowed'
                    }`}
                    value={report.totalRacs || ''}
                    onChange={(e) => onUpdate(report.id, 'totalRacs', Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1 block">Registros Logrados</label>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-blue-200 focus-within:border-blue-500 ring-2 ring-transparent focus-within:ring-blue-100">
                  <BarChart3 className="w-4 h-4 text-blue-500 ml-1 shrink-0" />
                  <input
                    type="number"
                    disabled={!isAdmin}
                    className={`w-full bg-transparent outline-none text-sm font-bold ${
                      isAdmin ? 'text-blue-700' : 'text-blue-400 cursor-not-allowed'
                    }`}
                    value={report.totalIngresosRegistros || ''}
                    onChange={(e) => onUpdate(report.id, 'totalIngresosRegistros', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Metas</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mes: <b className="text-slate-800">{totalIngresosMes}</b></span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>Semana: <b className="text-slate-800">{totalIngresosSemana}</b></span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Estado</p>
                <span className={`text-sm font-bold ${textClass}`}>
                  {report.totalIngresosRegistros} / {totalIngresosSemana}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${barClass}`}
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
              />
            </div>

            <button
              onClick={() => onViewDetail(report.campana)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Ver Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
