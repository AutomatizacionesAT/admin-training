import { Fragment, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Eye,
  FilterX,
  Layers3,
  Megaphone,
  UserRound,
} from "lucide-react";
import type { TrainingRecord } from "../../utils/utils";
import { parseDateString } from "../../utils/utils";
import { getCampanaInfo, IMAGEN_POR_DEFECTO } from "../../components/campanas-info";

interface ProjectedCampaignsTableProps {
  data: TrainingRecord[];
}

interface ProjectedGroup {
  key: string;
  campaign: string;
  client: string;
  segment: string;
  records: TrainingRecord[];
}

function getCampaignName(record: TrainingRecord): string {
  return (record.campana || record.cliente || "SIN CAMPAÑA").trim();
}

function isProjectedStatus(status: string | null): boolean {
  const normalizedStatus = (status || "").toLowerCase();
  return (
    normalizedStatus.includes("proyectad") ||
    normalizedStatus.includes("pendient") ||
    normalizedStatus.includes("sin iniciar")
  );
}

function isInProgressStatus(status: string | null): boolean {
  const normalizedStatus = (status || "").toLowerCase();
  return normalizedStatus.includes("proceso") || normalizedStatus.includes("curso");
}

function getWeekKey(date: Date): string {
  const week = Math.min(4, Math.ceil(date.getDate() / 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-W${week}`;
}

function formatWeek(date: Date): string {
  const monthAndYear = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(date);
  const monthAndYearCapitalized =
    monthAndYear.charAt(0).toLocaleUpperCase("es-CO") + monthAndYear.slice(1);
  const week = Math.min(4, Math.ceil(date.getDate() / 7));
  const firstDay = (week - 1) * 7 + 1;
  const lastDay =
    week === 4
      ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      : week * 7;
  return `${monthAndYearCapitalized} - Semana ${week} (${firstDay}-${lastDay})`;
}

function ProjectedGroupDetails({ group }: { group: ProjectedGroup }) {
  const { campaign, records } = group;
  const campaignImage = getCampanaInfo(campaign).imagen || IMAGEN_POR_DEFECTO;
  const developers = Array.from(
    new Set(
      records
        .map((record) => record.desarrollador?.trim())
        .filter((developer): developer is string => Boolean(developer)),
    ),
  );

  return (
    <div className="space-y-5 p-4 md:p-5">
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="flex flex-col gap-4 border-y-2 border-t-orange-400 p-3 sm:flex-row sm:items-center">
          <img
            src={campaignImage}
            alt={`Vista de la campaña ${campaign}`}
            className="w-full rounded-lg bg-orange-200 object-contain p-2 sm:w-96"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-orange-800">
              <Megaphone className="h-6 w-6 text-orange-500" />
              Vista de la campaña
            </p>
            <p className="mt-1 truncate text-base font-bold text-slate-800" title={campaign}>
              {campaign}
            </p>
            <p
              className="mt-1 text-xs font-medium text-slate-600"
              title={developers.join(", ") || "Sin desarrollador asignado"}
            >
              <span className="font-bold text-slate-700">Desarrollador{developers.length === 1 ? "" : "es"}:</span>{" "}
              {developers.length > 0 ? developers.join(", ") : "Sin asignar"}
            </p>
            <p className="mt-1 text-sm font-semibold text-orange-800">
              {records.length} {records.length === 1 ? "desarrollo proyectado" : "desarrollos proyectados"}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-800">
          <Layers3 className="h-6 w-6 text-blue-500" />
          Lista de desarrollos proyectados
        </h4>
        <div className={`grid grid-cols-1 gap-3 ${records.length > 1 ? "md:grid-cols-2" : ""}`}>
          {records.map((record, index) => (
            <article
              key={`${record.rowIndex ?? index}-${record.nombre ?? "desarrollo"}`}
              className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-blue-100 bg-blue-50"
            >
              <div className="min-w-0 flex-1 border-l-4 border-l-blue-400 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-700">
                  Desarrollo {index + 1}
                </p>
                <h5 className="mt-1 wrep-break-words text-sm font-black leading-snug text-slate-900">
                  {record.nombre || "Sin nombre"}
                </h5>
                <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Observaciones
                </p>
                <p className="mt-1 flex w-full flex-wrap items-center justify-between gap-2 whitespace-pre-wrap wrep-break-words text-xs leading-relaxed text-slate-700">
                  {record.observaciones || "Sin observaciones"}                  
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold tabular-nums text-slate-600">
                    <CalendarDays className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
                    Entrega: {record.fechaFin || "Sin fecha"}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ProjectedCampaignsTable({
  data,
}: ProjectedCampaignsTableProps) {
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedCoordinator, setSelectedCoordinator] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const projectedRecords = useMemo(() => {
    const recordsByCampaign = new Map<string, TrainingRecord[]>();
    data.forEach((record) => {
      const campaign = getCampaignName(record);
      const records = recordsByCampaign.get(campaign);
      if (records) records.push(record);
      else recordsByCampaign.set(campaign, [record]);
    });

    const projectedCampaigns = new Set<string>();
    recordsByCampaign.forEach((records, campaign) => {
      const hasInProgress = records.some((record) =>
        isInProgressStatus(record.estado),
      );
      const hasProjected = records.some((record) =>
        isProjectedStatus(record.estado),
      );
      if (!hasInProgress && hasProjected) projectedCampaigns.add(campaign);
    });

    return data.filter(
      (record) =>
        projectedCampaigns.has(getCampaignName(record)) &&
        isProjectedStatus(record.estado),
    );
  }, [data]);

  const campaigns = useMemo(
    () =>
      Array.from(new Set(projectedRecords.map(getCampaignName))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [projectedRecords],
  );
  const coordinators = useMemo(
    () =>
      Array.from(
        new Set(
          projectedRecords
            .map((record) => record.coordinador?.trim())
            .filter((coordinator): coordinator is string => Boolean(coordinator)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [projectedRecords],
  );
  const weeks = useMemo(() => {
    const weekLabels = new Map<string, string>();
    projectedRecords.forEach((record) => {
      const date = parseDateString(record.fechaInicio);
      if (!date) return;
      weekLabels.set(getWeekKey(date), formatWeek(date));
    });
    return Array.from(weekLabels.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [projectedRecords]);

  const filteredRecords = useMemo(
    () =>
      projectedRecords
        .filter((record) => {
          if (selectedCampaign && getCampaignName(record) !== selectedCampaign) {
            return false;
          }
          if (
            selectedCoordinator &&
            (record.coordinador || "").trim() !== selectedCoordinator
          ) {
            return false;
          }
          if (selectedWeek) {
            const date = parseDateString(record.fechaInicio);
            if (!date) return false;
            if (getWeekKey(date) !== selectedWeek) return false;
          }
          return true;
        })
        .sort(
          (a, b) =>
            (parseDateString(a.fechaInicio)?.getTime() ?? Infinity) -
            (parseDateString(b.fechaInicio)?.getTime() ?? Infinity),
        ),
    [projectedRecords, selectedCampaign, selectedCoordinator, selectedWeek],
  );

  const filteredGroups = useMemo(() => {
    const groups = new Map<string, ProjectedGroup>();
    filteredRecords.forEach((record) => {
      const campaign = getCampaignName(record);
      const client = record.cliente?.trim() || "Sin cliente";
      const segment = record.segmento?.trim() || "Sin segmento";
      const key = JSON.stringify([campaign, client, segment]);
      const group = groups.get(key);
      if (group) group.records.push(record);
      else groups.set(key, { key, campaign, client, segment, records: [record] });
    });

    return Array.from(groups.values()).sort((a, b) => {
      const start = (group: ProjectedGroup) =>
        Math.min(
          ...group.records.map(
            (record) =>
              parseDateString(record.fechaInicio)?.getTime() ?? Infinity,
          ),
        );
      return start(a) - start(b) || a.client.localeCompare(b.client);
    });
  }, [filteredRecords]);

  const columns = [
    { label: "Cliente", icon: Building2, width: "16%" },
    { label: "Segmento", icon: Layers3, width: "14%" },
    { label: "Campaña", icon: Megaphone, width: "17%" },
    { label: "Coordinador", icon: UserRound, width: "15%" },
    { label: "Desarrollos", icon: ClipboardList, width: "10%" },
    { label: "Periodo", icon: CalendarDays, width: "15%" },
  ];
  const filterClassName =
    "mt-1 w-full appearance-none rounded-md border border-blue-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-orange-200";
  const hasActiveFilters = Boolean(
    selectedCampaign || selectedCoordinator || selectedWeek,
  );

  const resetFilters = () => {
    setSelectedCampaign("");
    setSelectedCoordinator("");
    setSelectedWeek("");
    setExpandedRecord(null);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-[#12243d] px-6 py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            color: "#93c5fd",
            maskImage: "linear-gradient(to right, black, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to right, black, transparent 70%)",
          }}
        />
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-white">
              Proyección de desarrollos pendientes
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Desarrollos próximos de campañas proyectadas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-inset ring-orange-300">
              {filteredRecords.length} {filteredRecords.length === 1 ? "desarrollo" : "desarrollos"}
              <span className="mx-1.5 text-orange-200">·</span>
              {filteredGroups.length} {filteredGroups.length === 1 ? "grupo" : "grupos"}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white px-3 py-2 text-xs font-bold text-blue-900 transition hover:bg-orange-50 hover:text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FilterX className="h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="min-w-0 text-xs font-bold uppercase tracking-wide text-white">
            Campaña
            <span className="relative block">
              <Megaphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-600" aria-hidden="true" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" aria-hidden="true" />
              <select className={filterClassName} value={selectedCampaign} onChange={(event) => setSelectedCampaign(event.target.value)}>
                <option value="">Todas las campañas</option>
                {campaigns.map((campaign) => <option key={campaign} value={campaign}>{campaign}</option>)}
              </select>
            </span>
          </label>
          <label className="min-w-0 text-xs font-bold uppercase tracking-wide text-white">
            Coordinador
            <span className="relative block">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-600" aria-hidden="true" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" aria-hidden="true" />
              <select className={filterClassName} value={selectedCoordinator} onChange={(event) => setSelectedCoordinator(event.target.value)}>
                <option value="">Todos los coordinadores</option>
                {coordinators.map((coordinator) => <option key={coordinator} value={coordinator}>{coordinator}</option>)}
              </select>
            </span>
          </label>
          <label className="min-w-0 text-xs font-bold uppercase tracking-wide text-white">
            Semana
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-600" aria-hidden="true" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" aria-hidden="true" />
              <select className={filterClassName} value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)}>
                <option value="">Todas las semanas</option>
                {weeks.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </span>
          </label>
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[920px] table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            {columns.map((column) => <col key={column.label} style={{ width: column.width }} />)}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#d2d7e8] text-[10px] uppercase tracking-wider text-blue-900">
            <tr>
              <th className="px-3 py-3 font-black"><span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />Detalle</span></th>
              <th className="px-2 py-3 font-black"><span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />#</span></th>
              {columns.map((column) => (
                <th key={column.label} className="px-3 py-3 font-black">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <column.icon className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden="true" />
                    <span className="truncate">{column.label}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGroups.map((group, index) => {
              const isExpanded = expandedRecord === group.key;
              const groupCoordinators = Array.from(new Set(group.records.map((record) => record.coordinador?.trim()).filter((value): value is string => Boolean(value))));
              const starts = group.records.map((record) => parseDateString(record.fechaInicio)).filter((date): date is Date => date !== null).sort((a, b) => a.getTime() - b.getTime());
              const ends = group.records.map((record) => parseDateString(record.fechaFin)).filter((date): date is Date => date !== null).sort((a, b) => a.getTime() - b.getTime());
              const start = starts[0];
              const end = ends[ends.length - 1];
              const period = start
                ? `${start.toLocaleDateString("es-CO")}${end && end.getTime() !== start.getTime() ? ` – ${end.toLocaleDateString("es-CO")}` : ""}`
                : "Sin fecha";

              return (
                <Fragment key={group.key}>
                  <tr className={`group border-l-2 transition-colors duration-150 ${isExpanded ? "border-l-orange-500 bg-orange-50 font-semibold text-slate-900" : index % 2 === 0 ? "border-l-transparent bg-white hover:bg-blue-100 hover:font-semibold" : "border-l-transparent bg-blue-50/60 hover:bg-blue-100 hover:font-semibold"}`}>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedRecord(isExpanded ? null : group.key)}
                        aria-expanded={isExpanded}
                        aria-controls={`projected-detail-${index}`}
                        aria-label={`${isExpanded ? "Ocultar" : "Ver"} ${group.records.length} desarrollos de ${group.client} / ${group.segment}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-100 bg-white px-2 text-xs font-bold text-blue-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-slate-500">{index + 1}</td>
                    <td className="min-w-0 px-3 py-3"><span className="block truncate" title={group.client}>{group.client}</span></td>
                    <td className="min-w-0 px-3 py-3"><span className="block truncate" title={group.segment}>{group.segment}</span></td>
                    <td className="min-w-0 px-3 py-3"><span className="block truncate" title={group.campaign}>{group.campaign}</span></td>
                    <td className="min-w-0 px-3 py-3"><span className="block truncate" title={groupCoordinators.join(", ") || "Sin asignar"}>{groupCoordinators[0] || "Sin asignar"}{groupCoordinators.length > 1 ? ` +${groupCoordinators.length - 1}` : ""}</span></td>
                    <td className="px-3 py-3"><span className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800"><ClipboardList className="h-3 w-3 shrink-0" aria-hidden="true" />{group.records.length}</span></td>
                    <td className="min-w-0 px-3 py-3"><span className="block truncate" title={period}>{period}</span></td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-l-2 border-orange-400 bg-blue-50/40">
                      <td id={`projected-detail-${index}`} colSpan={columns.length + 2} className="p-0">
                        <ProjectedGroupDetails group={group} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filteredGroups.length === 0 && (
              <tr><td colSpan={columns.length + 2} className="px-4 py-12 text-center text-sm text-slate-500">No hay pendientes proyectados para los filtros seleccionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
