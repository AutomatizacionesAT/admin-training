import type { TrainingRecord } from "../utils/utils";

interface WTCoordinatorDetailTableProps {
  data: TrainingRecord[];
  selectedCoordinador: string;
}

function getEstadoBadgeClass(estado?: string): string {
  const s = estado?.trim().toUpperCase() ?? "";
  if (s === "FINALIZADA" || s === "COMPLETADO" || s === "FINALIZADO")
    return "bg-emerald-50 text-emerald-700";
  if (s === "EN PROCESO" || s === "EN CURSO")
    return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function getEstadoDotClass(estado?: string): string {
  const s = estado?.trim().toUpperCase() ?? "";
  if (s === "FINALIZADA" || s === "COMPLETADO" || s === "FINALIZADO")
    return "bg-emerald-500";
  if (s === "EN PROCESO" || s === "EN CURSO") return "bg-amber-500";
  return "bg-slate-400";
}

export function WTCoordinatorDetailTable({
  data,
  selectedCoordinador,
}: WTCoordinatorDetailTableProps) {
  const filteredData = data.filter(
    (r) => (r.coordinador || "Sin Asignar") === selectedCoordinador
  );

  return (
    <div className="mt-8 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-2 rounded-xl">📋</span>
          Detalle de Entrenamientos Web
        </h3>
        <p className="text-sm text-gray-500 mt-1 ml-10">
          Desglose de campañas y direcciones para{" "}
          <b>{selectedCoordinador}</b>
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 rounded-tl-2xl">Nombre / Desarrollo</th>
              <th className="px-6 py-4">Campaña</th>
              <th className="px-6 py-4">Dirección / Industria</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 rounded-tr-2xl">Desarrollador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-400"
                >
                  Sin registros para este coordinador
                </td>
              </tr>
            )}
            {filteredData.map((rec, i) => (
              <tr
                key={i}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {rec.nombre || rec.desarrollo || "-"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {rec.campana || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {rec.direccion || "-"}
                  </span>
                  {rec.industria && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ml-2">
                      {rec.industria}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getEstadoBadgeClass(
                      rec.estado ?? undefined
                    )}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${getEstadoDotClass(
                        rec.estado ?? undefined
                      )}`}
                    />
                    {rec.estado || "SIN INICIAR"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 group-hover:text-blue-600 transition-colors">
                  {rec.desarrollador || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
