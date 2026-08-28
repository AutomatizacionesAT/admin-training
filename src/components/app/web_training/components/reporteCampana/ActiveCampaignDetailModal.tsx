import { getCampanaInfo, IMAGEN_POR_DEFECTO } from "../campanas-info";
import type { UnifiedCampana } from "./types";
import { X } from "lucide-react";

interface ActiveCampaignDetailModalProps {
  campaign: UnifiedCampana | null;
  onClose: () => void;
}

export function ActiveCampaignDetailModal({
  campaign,
  onClose,
}: ActiveCampaignDetailModalProps) {
  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header del Dialog */}
        <div className="relative overflow-hidden bg-[#12243d] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-white/20 bg-white/10 p-0.5">
                <img
                  src={
                    getCampanaInfo(campaign.nombre).imagen ||
                    IMAGEN_POR_DEFECTO
                  }
                  alt={campaign.nombre}
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-white">
                  {campaign.nombre}
                </h3>
                <p className="text-xs text-slate-300">
                  Coordinador:{" "}
                  <b className="text-amber-400">
                    {campaign.coordinadorPrincipal}
                  </b>{" "}
                  | Sector:{" "}
                  <b className="text-sky-300">
                    {campaign.industriaPrincipal}
                  </b>{" "}
                  | Estado:{" "}
                  <b
                    className={
                      campaign.isActiva
                        ? "text-emerald-400"
                        : "text-slate-300"
                    }
                  >
                    {campaign.isActiva ? "ACTIVA" : "INACTIVA"}
                  </b>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-3.5 py-2 ring-1 ring-inset ring-white/15">
                <span className="text-xl font-bold text-amber-400">
                  {campaign.desarrollos.length}
                </span>
                <span className="text-[10px] font-semibold uppercase text-slate-300 leading-tight">
                  desarrollos
                  <br />
                  asociados
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido del Dialog */}
        <div className="overflow-y-auto bg-slate-50 p-6 space-y-4 max-h-[70vh]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Finalizados
              </p>
              <p className="mt-1 text-2xl font-black">
                {campaign.finalizados}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                En Proceso
              </p>
              <p className="mt-1 text-2xl font-black">
                {campaign.enProceso}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-100 p-3.5 text-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                Proyectados
              </p>
              <p className="mt-1 text-2xl font-black">
                {campaign.proyectados}
              </p>
            </div>
          </div>

          {/* Tabla de registros de entrenamiento */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Desglose de Desarrollos Registrados
              </h4>
            </div>
            <div className="max-h-[40vh] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Desarrollo / Nombre</th>
                    <th className="px-4 py-2.5 font-bold">Fecha Inicio</th>
                    <th className="px-4 py-2.5 font-bold">Fecha Fin</th>
                    <th className="px-4 py-2.5 font-bold">Estado</th>
                    <th className="px-4 py-2.5 font-bold">Desarrollador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaign.desarrollos.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {rec.nombre || rec.desarrollo || "Sin nombre"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {rec.fechaInicio || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {rec.fechaFin || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            rec.estado?.toUpperCase().includes("FINAL") ||
                            rec.estado?.toUpperCase().includes("COMPLET")
                              ? "bg-emerald-100 text-emerald-800"
                              : rec.estado?.toUpperCase().includes("PROCESO") ||
                                rec.estado?.toUpperCase().includes("CURSO")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {rec.estado || "SIN INICIAR"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {rec.desarrollador || "-"}
                      </td>
                    </tr>
                  ))}
                  {campaign.desarrollos.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-xs text-slate-400"
                      >
                        Esta campaña proviene de Servidores y aún no tiene registros de desarrollo asociados en Base WT25.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
