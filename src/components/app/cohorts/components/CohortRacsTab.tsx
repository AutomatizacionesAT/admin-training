import { semaforo } from "../utils/utils";
import type { RacPorCampana } from "../hooks/useCohortData";
import { Users } from "lucide-react";

interface Props {
  racPorCampana: RacPorCampana[];
}

export default function CohortRacsTab({ racPorCampana }: Props) {
  const totalRacs = racPorCampana.reduce((s, r) => s + r.racs, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-[#1B365D]/10 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-[#1B365D]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#1B365D]">RACs por campaña</h3>
          <p className="text-xs text-gray-400">Personas únicas identificadas por documento</p>
        </div>
        <span className="ml-auto text-xs font-semibold text-[#F37021] bg-orange-50 px-2.5 py-1 rounded-full">
          {totalRacs.toLocaleString("es-CO")} RACs totales
        </span>
      </div>

      {racPorCampana.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-14">Sin datos</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Campaña
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  RACs
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Registros
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Prom. cierre
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {racPorCampana.map((row) => {
                const color = semaforo(
                  row.promCierre !== null && row.promCierre > 1
                    ? row.promCierre / 100
                    : row.promCierre
                );
                return (
                  <tr key={row.campana} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800 max-w-[280px] truncate" title={row.campana}>
                      {row.campana}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 font-bold text-[#1B365D]">
                        <Users className="w-3 h-3 opacity-50" />
                        {row.racs.toLocaleString("es-CO")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400 text-xs">
                      {row.registros.toLocaleString("es-CO")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
                          color === "green"  ? "bg-green-100 text-green-700"  :
                          color === "yellow" ? "bg-amber-100 text-amber-700"  :
                          color === "red"    ? "bg-red-100   text-red-600"    :
                                              "bg-gray-100   text-gray-400"
                        }`}
                      >
                        {row.promCierre !== null ? `${row.promCierre}%` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
