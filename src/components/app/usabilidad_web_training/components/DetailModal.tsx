import { Calendar, X } from 'lucide-react';
import type { DailyBreakdown } from '../utils/types';

interface DetailModalProps {
  campana: string;
  breakdown: DailyBreakdown[];
  onClose: () => void;
}

export default function DetailModal({ campana, breakdown, onClose }: DetailModalProps) {
  const totalUnicos = breakdown.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{campana}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {breakdown.length} día(s) &middot; {totalUnicos} registros únicos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {breakdown.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No hay registros en el rango seleccionado.</p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((day) => (
                <div key={day.date} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/80 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-slate-800">{day.date}</span>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {day.count} usuario{day.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                    {day.usuarios.map((user) => (
                      <span
                        key={user}
                        className="bg-white border border-slate-200 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md"
                      >
                        {user}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
