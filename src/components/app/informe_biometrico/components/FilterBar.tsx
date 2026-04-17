import { Calendar, Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
  fechaInicio: string;
  fechaFin: string;
  semana: string;
  semanasDisponibles: string[];
  colaboradorSearch: string;
  colaboradoresList: string[];
  colaboradorSeleccionado: string;
  observacionFiltro: string;
  observacionesDisponibles: string[];
  totalRegistros: number;
  totalFiltrados: number;
  loading: boolean;
  onFechaInicioChange: (v: string) => void;
  onFechaFinChange: (v: string) => void;
  onSemanaChange: (v: string) => void;
  onColaboradorSearchChange: (v: string) => void;
  onColaboradorSeleccionadoChange: (v: string) => void;
  onObservacionFiltroChange: (v: string) => void;
  onLimpiarFiltros: () => void;
  onRefresh: () => void;
}

export default function FilterBar({
  fechaInicio,
  fechaFin,
  semana,
  semanasDisponibles,
  colaboradorSearch,
  colaboradoresList,
  colaboradorSeleccionado,
  observacionFiltro,
  observacionesDisponibles,
  totalRegistros,
  totalFiltrados,
  loading,
  onFechaInicioChange,
  onFechaFinChange,
  onSemanaChange,
  onColaboradorSearchChange,
  onColaboradorSeleccionadoChange,
  onObservacionFiltroChange,
  onLimpiarFiltros,
  onRefresh,
}: FilterBarProps) {

  const hasFilters = semana || colaboradorSeleccionado || colaboradorSearch || observacionFiltro;

  return (
    <div className="mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* Row 1: Dates + Search */}
      <div className="p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center">

        {/* Date Range */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Periodo</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => onFechaInicioChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-slate-400 text-xs font-medium">→</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => onFechaFinChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="hidden lg:block w-px h-8 bg-slate-200" />

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o CC..."
            value={colaboradorSearch}
            onChange={(e) => onColaboradorSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
          />
        </div>

        <div className="hidden lg:block w-px h-8 bg-slate-200" />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Cargando...' : '↻ Actualizar'}
          </button>
        </div>
      </div>

      {/* Row 2: Dropdowns + badge */}
      <div className="px-4 pb-4 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Semana */}
        <select
          value={semana}
          onChange={(e) => onSemanaChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white text-slate-700"
        >
          <option value="">Todas las semanas</option>
          {semanasDisponibles.map((sem) => (
            <option key={sem} value={sem}>Semana {sem}</option>
          ))}
        </select>

        {/* Colaborador select */}
        <select
          value={colaboradorSeleccionado}
          onChange={(e) => onColaboradorSeleccionadoChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white text-slate-700 max-w-[240px] truncate"
        >
          <option value="">Todos los colaboradores</option>
          {colaboradoresList.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Observación */}
        <select
          value={observacionFiltro}
          onChange={(e) => onObservacionFiltroChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white text-slate-700"
        >
          <option value="">Todas las observaciones</option>
          <option value="__SIN_NOVEDAD__">Sin novedad</option>
          {observacionesDisponibles.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={onLimpiarFiltros}
             className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors border border-red-200"
           >
             <X className="w-3 h-3" />
             Limpiar filtros
           </button>
         )}

         {/* Count badge */}
         <div className="ml-auto">
           <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {totalFiltrados === totalRegistros
              ? `${totalRegistros} registros`
              : `${totalFiltrados} de ${totalRegistros} registros`
            }
          </span>
        </div>
      </div>
    </div>
  );
}
