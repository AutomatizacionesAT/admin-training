import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Layers3,
} from "lucide-react";
import type { TrainingRecord } from "../../utils/utils";
import { parseDateString } from "../../utils/utils";

interface WebTrainingChartsProps {
  data: TrainingRecord[];
}

interface CampaignSummary {
  campaign: string;
  status: string;
  hasProjectedRecord: boolean;
  latestRecord: TrainingRecord;
  sourceIndex: number;
}

function getCampaignName(record: TrainingRecord): string {
  return (record.campana || record.cliente || "SIN CAMPAÑA").trim();
}

function isProjected(status: string | null): boolean {
  const normalized = (status || "").toLowerCase();
  return (
    normalized.includes("proyectad") ||
    normalized.includes("pendient") ||
    normalized.includes("sin iniciar")
  );
}

function getStatusLabel(status: string | null): string {
  const value = (status || "").trim();
  const normalized = value.toLowerCase();

  if (normalized.includes("proceso") || normalized.includes("curso")) {
    return "EN PROCESO";
  }
  if (
    normalized.includes("proyectad") ||
    normalized.includes("pendient") ||
    normalized.includes("sin iniciar")
  ) {
    return "PROYECTADO";
  }
  if (
    normalized.includes("entreg") ||
    normalized.includes("finaliz") ||
    normalized.includes("complet")
  ) {
    return "ENTREGADO";
  }
  return value ? value.toLocaleUpperCase("es-CO") : "SIN ESTADO";
}

function getStatusColor(status: string): string {
  if (status === "EN PROCESO") return "bg-orange-500";
  if (status === "PROYECTADO") return "bg-blue-600";
  if (status === "ENTREGADO") return "bg-emerald-500";
  return "bg-slate-400";
}

function isMoreRecent(
  candidate: TrainingRecord,
  candidateIndex: number,
  current: TrainingRecord,
  currentIndex: number,
): boolean {
  const candidateDate = parseDateString(candidate.fechaSolicitud);
  const currentDate = parseDateString(current.fechaSolicitud);

  if (candidateDate && currentDate) {
    if (candidateDate.getTime() !== currentDate.getTime()) {
      return candidateDate > currentDate;
    }
  } else if (candidateDate || currentDate) {
    return candidateDate !== null;
  }

  if (
    candidate.rowIndex !== undefined &&
    current.rowIndex !== undefined &&
    candidate.rowIndex !== current.rowIndex
  ) {
    return candidate.rowIndex > current.rowIndex;
  }

  return candidateIndex > currentIndex;
}

function formatRequestDate(value: string | null): string {
  const date = parseDateString(value);
  return date ? date.toLocaleDateString("es-CO") : value || "Sin fecha";
}

export default function WebTrainingCharts({ data }: WebTrainingChartsProps) {
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  const { campaigns, statusGroups } = useMemo(() => {
    const latestByCampaign = new Map<string, CampaignSummary>();

    data.forEach((record, sourceIndex) => {
      const campaign = getCampaignName(record);
      const current = latestByCampaign.get(campaign);

      if (
        !current ||
        isMoreRecent(record, sourceIndex, current.latestRecord, current.sourceIndex)
      ) {
        latestByCampaign.set(campaign, {
          campaign,
          status: getStatusLabel(record.estado),
          hasProjectedRecord:
            isProjected(record.estado) || current?.hasProjectedRecord === true,
          latestRecord: record,
          sourceIndex,
        });
      } else if (isProjected(record.estado)) {
        current.hasProjectedRecord = true;
      }
    });

    const groups = new Map<string, CampaignSummary[]>();
    latestByCampaign.forEach((summary) => {
      const addToGroup = (status: string) => {
        const group = groups.get(status);
        if (group) group.push(summary);
        else groups.set(status, [summary]);
      };

      addToGroup(summary.status);
      if (summary.hasProjectedRecord && summary.status !== "PROYECTADO") {
        addToGroup("PROYECTADO");
      }
    });

    const knownOrder = ["EN PROCESO", "PROYECTADO", "ENTREGADO"];
    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      const indexA = knownOrder.indexOf(a);
      const indexB = knownOrder.indexOf(b);
      if (indexA !== -1 || indexB !== -1) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }
      return a.localeCompare(b);
    });

    sortedGroups.forEach(([, summaries]) =>
      summaries.sort((a, b) => a.campaign.localeCompare(b.campaign)),
    );

    return {
      campaigns: Array.from(latestByCampaign.values()),
      statusGroups: sortedGroups,
    };
  }, [data]);

  const maxStatusCount = Math.max(
    1,
    ...statusGroups.map(([, summaries]) => summaries.length),
  );

  return (
    <section className="space-y-4" aria-label="Gráficas de Web Training">
      <div className="flex items-center gap-2 px-1">
        <BarChart3 className="h-7 w-7 text-orange-500" aria-hidden="true" />
        <div>
          <h2 className="text-base font-black uppercase tracking-wide text-slate-800">
            Indicadores de Web Training
          </h2>
        </div>
      </div>

      <article className="rounded-xl ring-2 ring-sky-800/20 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg text-blue-700">
              <Layers3 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Campañas por estado
              </h3>
              <p className="text-xs text-slate-500">
                El estado se determina por la fecha de solicitud más reciente.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold tabular-nums text-blue-700">
            {campaigns.length} {campaigns.length === 1 ? "campaña" : "campañas"}
          </span>
        </div>

        {statusGroups.length > 0 ? (
          <div className="space-y-3">
            {statusGroups.map(([status, summaries]) => {
              const isExpanded = expandedStatus === status;
              const width = (summaries.length / maxStatusCount) * 100;
              const panelId = `campaign-status-${status.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;

              return (
                <div
                  key={status}
                  className="overflow-hidden rounded-lg border-b-2 *:border-slate-100 bg-slate-50 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-white p-3">
                    <div className="min-w-32 flex-1">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-700">
                          {status}
                        </span>
                        <span className="font-black tabular-nums text-slate-900">
                          {summaries.length}
                        </span>
                      </div>
                      <div
                        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                        role="img"
                        aria-label={`${status}: ${summaries.length} campañas`}
                      >
                        <div
                          className={`h-full rounded-full transition-[width] duration-300 ${getStatusColor(status)}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      onClick={() =>
                        setExpandedStatus(isExpanded ? null : status)
                      }
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-blue-100 border-blue-100 px-3 py-2 text-xs font-bold text-blue-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {isExpanded ? "Ocultar campañas" : "Ver campañas"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  {isExpanded && (                  
                    <div id={panelId} className={`border-t ${status === "EN PROCESO" ? "bg-orange-50" : status === "PROYECTADO" ? "bg-blue-50" : status === "ENTREGADO" ? "bg-green-50" : "bg-slate-50"}`}>
                      <div className={`grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(100px,0.7fr)] gap-3 border-b px-4 py-2 text-[10px] font-black uppercase tracking-wider ${status === "EN PROCESO" ? "border-orange-100 bg-orange-200 text-orange-900" : status === "PROYECTADO" ? "border-blue-100 bg-blue-200 text-blue-900" : status === "ENTREGADO" ? "border-green-100 bg-green-200 text-green-900" : "border-slate-100 bg-slate-200 text-slate-900"}`}>
                        <span>Campaña</span>
                        <span>Coordinador</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" />
                          Última solicitud
                        </span>
                      </div>
                      <ul className="divide-y divide-blue-100">
                        {summaries.map((summary) => (
                          <li
                            key={summary.campaign}
                            className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(100px,0.7fr)] gap-3 px-4 py-2.5 text-xs"
                          >
                            <span
                              className="truncate font-semibold text-slate-800"
                              title={summary.campaign}
                            >
                              {summary.campaign}
                            </span>
                            <span
                              className="truncate text-slate-600"
                              title={summary.latestRecord.coordinador || "Sin asignar"}
                            >
                              {summary.latestRecord.coordinador || "Sin asignar"}
                            </span>
                            <span className="tabular-nums text-slate-600">
                              {formatRequestDate(summary.latestRecord.fechaSolicitud)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No hay campañas para mostrar.
          </p>
        )}
      </article>
    </section>
  );
}
