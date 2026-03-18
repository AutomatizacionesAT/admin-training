import { Calendar, ArrowDownUp, SortAsc, SortDesc, Minimize2, Maximize2 } from 'lucide-react';
import type { SortField, SortOrder } from '../UsabilidadWebTraining';

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
  onRefresh,
  isCollapsed,
  onToggleCollapse,
}: FilterBarProps) {
  return (
    <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
      <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
      <span className="text-sm font-semibold text-slate-700">Rango de Fechas:</span>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 font-medium">Desde</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => onFechaInicioChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 font-medium">Hasta</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => onFechaFinChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 font-medium">Días Mes</label>
        <input
          type="number"
          value={globalDiasMes}
          onChange={(e) => onDiasMesChange(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-16 text-center font-bold"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 font-medium">Días Semana</label>
        <input
          type="number"
          value={globalDiasSemana}
          onChange={(e) => onDiasSemanaChange(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-16 text-center font-bold"
        />
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block" />

      <div className="flex items-center gap-2">
        <ArrowDownUp className="w-4 h-4 text-slate-400" />
        <select
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value as SortField)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
        >
          <option value="porcentaje">Porcentaje</option>
          <option value="campana">Título Campaña</option>
          <option value="coordinador">Coordinador</option>
        </select>
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
          title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
        >
          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
        </button>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Actualizando...' : '↻ Actualizar'}
      </button>

      <button
        onClick={onToggleCollapse}
        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-slate-100"
        title={isCollapsed ? 'Expandir tarjetas' : 'Contraer tarjetas'}
      >
        {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        {isCollapsed ? 'Expandir' : 'Contraer'}
      </button>

      <div className="w-full sm:w-auto text-right">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          {totalRegistros} registros cargados
        </span>
      </div>
    </div>
  );
}
