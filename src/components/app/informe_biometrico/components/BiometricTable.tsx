import { useState, useEffect } from 'react';
import { ArrowDownUp, SortAsc, SortDesc, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BiometricRow, SortField, SortOrder } from '../utils/types';

interface BiometricTableProps {
  data: BiometricRow[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export default function BiometricTable({ data, sortField, sortOrder, onSort }: BiometricTableProps) {
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

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowDownUp className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' ? <SortAsc className="w-3 h-3 text-blue-400" /> : <SortDesc className="w-3 h-3 text-blue-400" />;
  };

  const getSortClass = (field: SortField) => `cursor-pointer hover:bg-slate-700 transition-colors group select-none text-left py-3 px-4 ${sortField === field ? 'bg-slate-700' : ''}`;

  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] uppercase text-white bg-slate-800 border-b border-slate-700">
            <tr>
              <th className={getSortClass('dateISO')} onClick={() => onSort('dateISO')}>
                <div className="flex items-center gap-1.5">
                  Fecha {renderSortIcon('dateISO')}
                </div>
              </th>
              <th className={getSortClass('semana')} onClick={() => onSort('semana')}>
                <div className="flex items-center gap-1.5">
                  Sem. {renderSortIcon('semana')}
                </div>
              </th>
              <th className={getSortClass('cc')} onClick={() => onSort('cc')}>
                <div className="flex items-center gap-1.5">
                  CC {renderSortIcon('cc')}
                </div>
              </th>
              <th className={getSortClass('colaborador')} onClick={() => onSort('colaborador')}>
                <div className="flex items-center gap-1.5">
                  Colaborador {renderSortIcon('colaborador')}
                </div>
              </th>
              <th className={getSortClass('ingreso')} onClick={() => onSort('ingreso')}>
                <div className="flex items-center gap-1.5">
                  Ingreso {renderSortIcon('ingreso')}
                </div>
              </th>
              <th className={getSortClass('salida')} onClick={() => onSort('salida')}>
                <div className="flex items-center gap-1.5">
                  Salida {renderSortIcon('salida')}
                </div>
              </th>
              <th className={getSortClass('horasDecimal')} onClick={() => onSort('horasDecimal')}>
                <div className="flex items-center gap-1.5">
                  Total Horas {renderSortIcon('horasDecimal')}
                </div>
              </th>
              <th className={getSortClass('observacion')} onClick={() => onSort('observacion')}>
                <div className="flex items-center gap-1.5">
                  Observación {renderSortIcon('observacion')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No se encontraron registros para los filtros seleccionados
                </td>
              </tr>
            ) : (
              currentData.map((row, i) => (
                <tr key={`${row.cc}-${row.dateISO}-${i}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-medium whitespace-nowrap">{row.dia}</td>
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-400 whitespace-nowrap">{row.semana}</td>
                  <td className="py-2.5 px-4 text-xs font-mono whitespace-nowrap">{row.cc}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">{row.colaborador}</td>
                  <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap">{row.ingreso || '--:--'}</td>
                  <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap">{row.salida || '--:--'}</td>
                  <td className="py-2.5 px-4 font-bold whitespace-nowrap">
                    {row.horasDecimal > 0 ? (
                      <span className="text-blue-600">{row.horasDiarias}</span>
                    ) : (
                      <span className="text-slate-400">0:00</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 min-w-[150px]">
                    {row.observacion && row.observacion.toUpperCase() !== 'NINGUNO' && row.observacion.toUpperCase() !== 'NO' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase leading-none
                        ${row.observacion.toUpperCase().includes('TARDE') ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-600 border border-red-100'}
                      `}>
                        <AlertCircle className="w-3 h-3" />
                        {row.observacion}
                      </span>
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
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, data.length)} de {data.length} registros
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
