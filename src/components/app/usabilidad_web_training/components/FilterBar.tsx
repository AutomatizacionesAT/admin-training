import { Calendar } from 'lucide-react';

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
  onRefresh: () => void;
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
  onRefresh,
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

      <button
        onClick={onRefresh}
        disabled={loading}
        className="ml-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Actualizando...' : '↻ Actualizar'}
      </button>

      <span className="text-xs text-slate-400 ml-auto">{totalRegistros} registros cargados</span>
    </div>
  );
}
