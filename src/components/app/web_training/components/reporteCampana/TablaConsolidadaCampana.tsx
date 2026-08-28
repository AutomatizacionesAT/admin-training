import { getCampanaInfo, IMAGEN_POR_DEFECTO } from "../campanas-info";
import type { UnifiedCampana, ActividadFilter } from "./types";
import {
  Layers,
  Monitor,
  Search,
  Megaphone,
  ExternalLink,
  Eye,
} from "lucide-react";

interface TablaConsolidadaCampanaProps {
  tableFilteredCampanas: UnifiedCampana[];
  tableSearch: string;
  setTableSearch: (val: string) => void;
  selectedCoordinador: string | null;
  selectedIndustria: string | null;
  selectedActividad: ActividadFilter;
  setSelectedIndustria: (ind: string | null) => void;
  onOpenEnviosReport: () => void;
  onSelectCampaignDetail: (camp: UnifiedCampana) => void;
}

export function TablaConsolidadaCampana({
  tableFilteredCampanas,
  tableSearch,
  setTableSearch,
  selectedCoordinador,
  selectedIndustria,
  selectedActividad,
  setSelectedIndustria,
  onOpenEnviosReport,
  onSelectCampaignDetail,
}: TablaConsolidadaCampanaProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100/70 bg-white shadow-[0_10px_34px_rgb(15,23,42,0.07)]">
      <div className="relative overflow-hidden bg-[#12243d] px-6 py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            color: "#93c5fd",
            maskImage: "linear-gradient(to right, black, transparent 70%)",
            WebkitMaskImage:
              "linear-gradient(to right, black, transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
              <Layers className="text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Listado Consolidado de Campañas
                </h3>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                Visualización unificada por campaña{" "}
                {selectedCoordinador && (
                  <>
                    para el líder{" "}
                    <b className="font-semibold text-amber-400">
                      {selectedCoordinador}
                    </b>{" "}
                  </>
                )}
                {selectedIndustria && (
                  <>
                    en el sector{" "}
                    <b className="font-semibold text-sky-300">
                      {selectedIndustria}
                    </b>{" "}
                  </>
                )}
                {selectedActividad !== "ALL" && (
                  <>
                    (
                    <b
                      className={`font-semibold ${
                        selectedActividad === "ACTIVAS"
                          ? "text-emerald-400"
                          : "text-slate-300"
                      }`}
                    >
                      {selectedActividad === "ACTIVAS" ? "Solo Activas" : "Solo Inactivas"}
                    </b>
                    )
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-inset ring-white/15">
              <span className="text-2xl font-bold leading-none text-amber-400">
                {tableFilteredCampanas.length}
              </span>
              <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-300">
                campañas
                <br />
                listadas
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenEnviosReport}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500/20 px-3.5 py-2.5 text-xs font-bold text-blue-300 ring-1 ring-inset ring-blue-400/30 transition hover:bg-blue-500/30 cursor-pointer"
            > 
              <span className="text-2xl font-bold leading-none text-blue-400">
                 <Monitor className="h-7 w-7 mr-1" />
              </span>
              <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-300">
                Informe 
                <br />
                Servidores
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda rápida en tabla */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-slate-50/70 px-6 py-3">
        <div className="relative flex-1 sm:max-w-2xl focus:sm:max-w-3xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
          <input
            type="text"
            placeholder="Buscar por campaña, coordinador o industria..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full rounded-lg ring-2 ring-blue-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 shadow-xs outline-none transition focus:bg-blue-50 focus:ring-blue-400 focus:sm:w-3xl"
          />
        </div>
        {tableSearch && (
          <button
            type="button"
            onClick={() => setTableSearch("")}
            className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full cursor-pointer ring-2 ring-amber-200"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {[
                "#",
                "Campaña",
                "Estado Actividad",
                "Coordinador(es)",
                "Industria",
                "Estado Servidor",
                "URL Servidor",
                "Acciones",
              ].map((h) => (
                <th
                  key={h}
                  className="border-b border-slate-200 bg-slate-100/90 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableFilteredCampanas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    <Megaphone className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    No se encontraron campañas para los filtros seleccionados
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Prueba ajustando los filtros superiores o el término de búsqueda
                  </p>
                </td>
              </tr>
            )}
            {tableFilteredCampanas.map((camp, index) => {
              const info = getCampanaInfo(camp.nombre);
              const campLogo = info.imagen || IMAGEN_POR_DEFECTO;
              const estadoTone =
                camp.estadoServidor === "SI"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : camp.estadoServidor === "MIGRACION"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

              const estadoLabel =
                camp.estadoServidor === "SI"
                  ? "EN SERVIDOR"
                  : camp.estadoServidor === "MIGRACION"
                    ? "EN MIGRACION"
                    : "SIN SERVIDOR";

              return (
                <tr
                  key={camp.normalizedKey}
                  className="group transition-colors hover:bg-blue-50/40"
                >
                  {/* Index */}
                  <td className="border-b border-slate-200/60 px-4 py-3 text-xs font-bold text-slate-400">
                    {index + 1}
                  </td>

                  {/* Campaña con Logo */}
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-xs">
                        <img
                          src={campLogo}
                          alt={camp.nombre}
                          className="h-full w-full object-cover rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              IMAGEN_POR_DEFECTO;
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-bold text-slate-900 leading-tight uppercase tracking-tight"
                          title={camp.nombre}
                        >
                          {camp.nombre}
                        </p>
                        {camp.direccionPrincipal &&
                          camp.direccionPrincipal !== "Sin Asignar" && (
                            <span className="text-[10px] font-medium text-slate-400">
                              {camp.direccionPrincipal}
                            </span>
                          )}
                      </div>
                    </div>
                  </td>

                  {/* Estado Actividad */}
                  <td className="border-b border-slate-200/60 px-4 py-3 text-xs">
                    {camp.isActiva ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        INACTIVA
                      </span>
                    )}
                  </td>

                  {/* Coordinadores */}
                  <td className="border-b border-slate-200/60 px-4 py-3 text-xs">
                    {camp.coordinadores.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {camp.coordinadores.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-900"
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-[9px] font-bold text-blue-800">
                              {c.charAt(0)}
                            </span>
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        Sin asignar
                      </span>
                    )}
                  </td>

                  {/* Industria */}
                  <td className="border-b border-slate-200/60 px-4 py-3 text-xs font-semibold text-slate-600">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIndustria(
                          selectedIndustria === camp.industriaPrincipal
                            ? null
                            : camp.industriaPrincipal,
                        )
                      }
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                        selectedIndustria === camp.industriaPrincipal
                          ? "bg-[#1a355b] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-900"
                      }`}
                      title="Filtrar por esta industria"
                    >
                      {camp.industriaPrincipal || "Sin Asignar"}
                    </button>
                  </td>

                  {/* Estado Servidor */}
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${estadoTone}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          camp.estadoServidor === "SI"
                            ? "bg-emerald-500"
                            : camp.estadoServidor === "MIGRACION"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                      />
                      {estadoLabel}
                    </span>
                  </td>

                  {/* URL Servidor */}
                  <td className="border-b border-slate-200/60 px-4 py-3 text-xs">
                    {camp.url ? (
                      <a
                        href={camp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-700 transition hover:bg-sky-100 hover:text-sky-900"
                        title={camp.url}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Abrir enlace</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">-</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectCampaignDetail(camp)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1a355b] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#12243d] cursor-pointer"
                      title="Ver desarrollos de esta campaña"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver detalle</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
