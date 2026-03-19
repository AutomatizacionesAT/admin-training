import type { CampaignReport } from '../utils/types';
import { getPercentage } from '../utils/calculations';

interface SummaryTableProps {
  reports: CampaignReport[];
}

export default function SummaryTable({ reports }: SummaryTableProps) {
  // Agrupar por coordinador
  const grouped: Record<string, CampaignReport[]> = {};
  reports.forEach((r) => {
    const coord = r.coordinador || '(Sin asignar)';
    if (!grouped[coord]) grouped[coord] = [];
    grouped[coord].push(r);
  });

  const sortedCoords = Object.keys(grouped).sort((a, b) => {
    if (a === '(Sin asignar)') return 1;
    if (b === '(Sin asignar)') return -1;
    return a.localeCompare(b);
  });

  // Totales globales
  let gTotalRacs = 0, gIngresosMes = 0, gIngresosSemana = 0, gRegistros = 0;
  reports.forEach((r) => {
    gTotalRacs += r.totalRacs;
    gIngresosMes += r.totalRacs * r.diasHabilesMes;
    gIngresosSemana += r.totalRacs * r.diasHabilesSemana;
    gRegistros += r.totalIngresosRegistros;
  });

  const getBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-yellow-400';
    if (pct >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getTextColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-700';
    if (pct >= 60) return 'text-yellow-700';
    if (pct >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  const getBgColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-50';
    if (pct >= 60) return 'bg-yellow-50';
    if (pct >= 40) return 'bg-orange-50';
    return 'bg-red-50';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-3 py-1.5 text-left font-semibold uppercase tracking-wider whitespace-nowrap">Coordinador</th>
              <th className="px-3 py-1.5 text-left font-semibold uppercase tracking-wider whitespace-nowrap">Campaña</th>
              <th className="px-3 py-1.5 text-center font-semibold uppercase tracking-wider whitespace-nowrap">Total RACS</th>
              <th className="px-3 py-1.5 text-center font-semibold uppercase tracking-wider whitespace-nowrap">Días Mes</th>
              <th className="px-3 py-1.5 text-center font-semibold uppercase tracking-wider whitespace-nowrap">Ingresos Mes</th>
              <th className="px-3 py-1.5 text-center font-semibold uppercase tracking-wider whitespace-nowrap">Días Semana</th>
              <th className="px-3 py-1.5 text-center font-semibold uppercase tracking-wider whitespace-nowrap">Ingresos Semana</th>
              <th className="px-3 py-1.5 text-center font-semibold uppercase tracking-wider whitespace-nowrap">Registros</th>
              <th className="px-3 py-1.5 text-center font-semibold uppercase tracking-wider whitespace-nowrap w-32">% Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {sortedCoords.map((coord) => {
              const rows = grouped[coord];
              return rows.map((r, idx) => {
                const ingresosMes = r.totalRacs * r.diasHabilesMes;
                const ingresosSemana = r.totalRacs * r.diasHabilesSemana;
                const pct = getPercentage(r.totalIngresosRegistros, ingresosSemana);

                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Coordinador - solo en la primera fila del grupo */}
                    {idx === 0 ? (
                      <td
                        rowSpan={rows.length}
                        className="px-3 py-0.5 font-bold text-slate-800 align-top border-r border-slate-200 bg-slate-50/80 whitespace-nowrap"
                      >
                        {coord}
                      </td>
                    ) : null}
                    <td className="px-3 py-0.5 text-slate-700 font-medium whitespace-nowrap">{r.campana}</td>
                    <td className="px-3 py-0.5 text-center font-bold text-slate-800">{r.totalRacs}</td>
                    <td className="px-3 py-0.5 text-center text-slate-600">{r.diasHabilesMes}</td>
                    <td className="px-3 py-0.5 text-center font-semibold text-slate-700">{ingresosMes}</td>
                    <td className="px-3 py-0.5 text-center text-slate-600">{r.diasHabilesSemana}</td>
                    <td className="px-3 py-0.5 text-center font-semibold text-slate-700">{ingresosSemana}</td>
                    <td className="px-3 py-0.5 text-center font-bold text-slate-800">{r.totalIngresosRegistros}</td>
                    <td className="px-2 py-0.5">
                      <div className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1 ${getBgColor(pct)}`}>
                        <div className="w-12 h-2 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getBarColor(pct)}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className={`font-bold ${getTextColor(pct)} min-w-[36px] text-right`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              });
            })}

            {/* Totals row */}
            <tr className="bg-slate-800 text-white font-bold">
              <td className="px-3 py-1" colSpan={2}>TOTALES</td>
              <td className="px-3 py-1 text-center">{gTotalRacs}</td>
              <td className="px-3 py-1 text-center">—</td>
              <td className="px-3 py-1 text-center">{gIngresosMes}</td>
              <td className="px-3 py-1 text-center">—</td>
              <td className="px-3 py-1 text-center">{gIngresosSemana}</td>
              <td className="px-3 py-1 text-center">{gRegistros}</td>
              <td className="px-3 py-1">
                <div className="flex items-center justify-center">
                  <span className={`font-bold ${getTextColor(getPercentage(gRegistros, gIngresosSemana))} bg-white/90 rounded px-2 py-0.5`}>
                    {getPercentage(gRegistros, gIngresosSemana)}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
