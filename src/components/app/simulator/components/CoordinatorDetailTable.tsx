import type { TrainingRecord } from "../utils/utils";

interface CoordinatorDetailTableProps {
  data: TrainingRecord[];
  selectedCoordinador: string;
}

function getEstadoBadgeClass(estado?: string): string {
  const normalized = estado?.toUpperCase();
  if (normalized === "FINALIZADA") return "bg-emerald-50 text-emerald-700";
  if (normalized === "EN PROCESO") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function getEstadoDotClass(estado?: string): string {
  const normalized = estado?.toUpperCase();
  if (normalized === "FINALIZADA") return "bg-emerald-500";
  if (normalized === "EN PROCESO") return "bg-amber-500";
  return "bg-slate-400";
}

export function CoordinatorDetailTable({ data, selectedCoordinador }: CoordinatorDetailTableProps) {
  const filteredData = data.filter(
    (r) => (r.coordinador || "Sin Asignar") === selectedCoordinador
  );

  return (
    <div className="mt-8 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">📋</span>
          Detalle de Simuladores
        </h3>
        <p className="text-sm text-gray-500 mt-1 ml-10">
          Desglose de campañas y direcciones para <b>{selectedCoordinador}</b>
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 rounded-tl-2xl">Nombre del Proceso</th>
              <th className="px-6 py-4">Campaña</th>
              <th className="px-6 py-4">Dirección / Industria</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 rounded-tr-2xl">Desarrollador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.map((sim, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-medium text-gray-900">{sim.nombreProceso || "-"}</td>
                <td className="px-6 py-4 text-gray-600">{sim.campana || "-"}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {sim.direccion || "-"}
                  </span>
                  {sim.industria && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ml-2">
                      {sim.industria}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getEstadoBadgeClass(sim.estado ?? undefined)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${getEstadoDotClass(sim.estado ?? undefined)}`} />
                    {sim.estado || "SIN INICIAR"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 group-hover:text-indigo-600 transition-colors">
                  {sim.desarrollador || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
