import { useState, useEffect } from 'react';
import { ArrowDownUp, SortAsc, SortDesc, AlertTriangle, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ColaboradorSummary, SortOrder } from '../utils/types';

interface SummaryTableProps {
  data: ColaboradorSummary[];
  sortField: keyof ColaboradorSummary;
  sortOrder: SortOrder;
  onSort: (field: keyof ColaboradorSummary) => void;
}

export default function SummaryTable({ data, sortField, sortOrder, onSort }: SummaryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [data, sortField, sortOrder]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const renderSortIcon = (field: keyof ColaboradorSummary) => {
    if (sortField !== field) return <ArrowDownUp className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' ? <SortAsc className="w-3 h-3 text-white" /> : <SortDesc className="w-3 h-3 text-white" />;
  };

  const getSortClass = (field: keyof ColaboradorSummary) => `cursor-pointer hover:bg-indigo-800 transition-colors group select-none text-left py-3 px-4 ${sortField === field ? 'bg-indigo-800' : ''}`;

  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] uppercase text-slate-100 bg-indigo-900 border-b border-indigo-800">
            <tr>
              <th className={getSortClass('colaborador')} onClick={() => onSort('colaborador')}>
                <div className="flex items-center gap-1.5">Colaborador {renderSortIcon('colaborador')}</div>
              </th>
              <th className={getSortClass('cc')} onClick={() => onSort('cc')}>
                <div className="flex items-center gap-1.5">CC {renderSortIcon('cc')}</div>
              </th>
              <th className={getSortClass('diasRegistrados')} onClick={() => onSort('diasRegistrados')}>
                <div className="flex items-center gap-1.5">Días Muestra {renderSortIcon('diasRegistrados')}</div>
              </th>
              <th className={getSortClass('diasTrabajados')} onClick={() => onSort('diasTrabajados')}>
                <div className="flex items-center gap-1.5">Días Trab. {renderSortIcon('diasTrabajados')}</div>
              </th>
              <th className={getSortClass('totalHoras')} onClick={() => onSort('totalHoras')}>
                <div className="flex items-center gap-1.5">Total Horas {renderSortIcon('totalHoras')}</div>
              </th>
              <th className={getSortClass('promedioHoras')} onClick={() => onSort('promedioHoras')}>
                <div className="flex items-center gap-1.5">Promedio/Día {renderSortIcon('promedioHoras')}</div>
              </th>
              <th className={getSortClass('llegadasTarde')} onClick={() => onSort('llegadasTarde')}>
                <div className="flex items-center gap-1.5">Tardanzas {renderSortIcon('llegadasTarde')}</div>
              </th>
              <th className={getSortClass('ausencias')} onClick={() => onSort('ausencias')}>
                  <div className="flex items-center gap-1.5">Ausenc./Nov. {renderSortIcon('ausencias')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No se encontraron resúmenes
                </td>
              </tr>
            ) : (
              currentData.map((row) => (
                <tr key={row.cc} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{row.colaborador}</td>
                  <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">{row.cc}</td>
                  <td className="py-3 px-4 font-medium text-slate-500 whitespace-nowrap">{row.diasRegistrados} días</td>
                  <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{row.diasTrabajados} días</td>
                  <td className="py-3 px-4 font-bold text-indigo-600 whitespace-nowrap">{row.totalHoras.toFixed(1)} h</td>
                  <td className="py-3 px-4 font-medium text-emerald-600 whitespace-nowrap">{row.promedioHoras.toFixed(1)} h</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {row.llegadasTarde > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {row.llegadasTarde}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {row.ausencias > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                        <UserX className="w-3.5 h-3.5" />
                        {row.ausencias}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500 font-medium">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, data.length)} de {data.length} resúmenes
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
