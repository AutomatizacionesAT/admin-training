import { Calendar, ArrowDownUp, SortAsc, SortDesc, Minimize2, Maximize2 } from 'lucide-react';
import type { SortField, SortOrder } from '../UsabilidadWebTraining';
import { useAuth } from '@/context/AuthContext';

interface FilterBarProps {
  fechaInicio: string;
  fechaFin: string;
  globalDiasMes: number;
  globalDiasSemana: number;
  totalRegistros: number;
  loading: boolean;
  onFechaInicioChange: (v: string) => void;
  onFechaFinChange: (v: string) => void;
  onDiasMesChange: (v: number) => void;
  onDiasSemanaChange: (v: number) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (v: SortField) => void;
  onSortOrderChange: (v: SortOrder) => void;
  sortEnabled: boolean;
  onSortEnabledChange: (v: boolean) => void;
  onRefresh: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function FilterBar({
  fechaInicio,
  fechaFin,
  globalDiasMes,
  globalDiasSemana,
  totalRegistros,
  loading,
  onFechaInicioChange,
  onFechaFinChange,
  onDiasMesChange,
  onDiasSemanaChange,
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange,
  sortEnabled,
  onSortEnabledChange,
  onRefresh,
  isCollapsed,
  onToggleCollapse,
}: FilterBarProps) {
  const { isAdmin } = useAuth();

  return (
    <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col 2xl:flex-row gap-4 justify-between items-start 2xl:items-center">
      
      {/* Left side: Filters */}
      <div className="flex flex-wrap items-center gap-4 xl:gap-6 w-full 2xl:w-auto">
        
        {/* Fechas */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Rango de Fechas:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              disabled={!isAdmin}
              onChange={(e) => onFechaInicioChange(e.target.value)}
              className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none ${
                isAdmin ? 'text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100' : 'text-slate-500 cursor-not-allowed bg-slate-50'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              disabled={!isAdmin}
              onChange={(e) => onFechaFinChange(e.target.value)}
              className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none ${
                isAdmin ? 'text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100' : 'text-slate-500 cursor-not-allowed bg-slate-50'
              }`}
            />
          </div>
        </div>

        <div className="hidden lg:block w-px h-6 bg-slate-200" />

        {/* Días */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Días Mes</label>
            <input
              type="number"
              value={globalDiasMes}
              disabled={!isAdmin}
              onChange={(e) => onDiasMesChange(Number(e.target.value))}
              className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none w-16 text-center font-bold ${
                isAdmin ? 'text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100' : 'text-slate-500 cursor-not-allowed bg-slate-50'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Días Sem</label>
            <input
              type="number"
              value={globalDiasSemana}
              disabled={!isAdmin}
              onChange={(e) => onDiasSemanaChange(Number(e.target.value))}
              className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none w-16 text-center font-bold ${
                isAdmin ? 'text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100' : 'text-slate-500 cursor-not-allowed bg-slate-50'
              }`}
            />
          </div>
        </div>

        <div className="hidden xl:block w-px h-6 bg-slate-200" />

        {/* Orden */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSortEnabledChange(!sortEnabled)}
            className={`relative w-9 h-5 rounded-full transition-colors ${sortEnabled ? 'bg-blue-500' : 'bg-slate-300'} shrink-0`}
            title={sortEnabled ? 'Desactivar orden' : 'Activar orden'}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sortEnabled ? 'translate-x-4' : ''}`} />
          </button>
          <ArrowDownUp className={`w-4 h-4 shrink-0 ${sortEnabled ? 'text-blue-500' : 'text-slate-300'}`} />
          <select
            value={sortField}
            disabled={!sortEnabled}
            onChange={(e) => onSortFieldChange(e.target.value as SortField)}
            className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white ${sortEnabled ? 'text-slate-700' : 'text-slate-400 cursor-not-allowed'}`}
          >
            <option value="porcentaje">Porcentaje</option>
            <option value="campana">Título Campaña</option>
            <option value="coordinador">Coordinador</option>
          </select>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            disabled={!sortEnabled}
            className={`p-1.5 rounded-lg border border-slate-200 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 shrink-0 ${sortEnabled ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
            title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full 2xl:w-auto justify-end border-t 2xl:border-none pt-4 2xl:pt-0 border-slate-100 mt-2 2xl:mt-0">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <span>{loading ? 'Actualizando...' : '↻ Actualizar'}</span>
        </button>

        <button
          onClick={onToggleCollapse}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-colors flex items-center gap-2 focus:ring-2 focus:ring-slate-100"
          title={isCollapsed ? 'Expandir tarjetas' : 'Contraer tarjetas'}
        >
          {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          <span>{isCollapsed ? 'Expandir' : 'Contraer'}</span>
        </button>

        <div className="w-full sm:w-auto text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {totalRegistros} registros cargados
          </span>
        </div>
      </div>

    </div>
  );
}
