import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  ServerCog,
  History,
  FolderInput,
  FolderTree,
  Link2,
  UserRound,
} from "lucide-react";
import type { EnviosServidoresRecord, TrainingRecord } from "../utils/utils";
import { parseDateString } from "../utils/utils";
import {
  CAMPANAS_INFO,
  getCampanaInfo,
  IMAGEN_POR_DEFECTO,
} from "./campanas-info";
import {
  normalizeEstadoServidor,
  normalizarCampana,
} from "./reporteCampana/utils";
import migrationHistory from "./migracionHistorial.json";

interface MigracionProps {
  enviosServidores: EnviosServidoresRecord[];
  data: TrainingRecord[];
}

interface MigrationHistoryRecord {
  Campaña: string;
  Cliente: string;
  Segmento: string;
  "Fecha Inicio": string;
  "Fecha Entrega": string;
  Desarrollador: string;
  Color: string;
}

interface ActiveCampaign {
  name: string;
  development?: TrainingRecord;
}

const historyRecords: MigrationHistoryRecord[] = migrationHistory;

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";
  const date = parseDateString(value);
  return date
    ? date.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : value;
}

function getCampaignImage(name: string): string {
  const exactImage = getCampanaInfo(name).imagen;
  if (exactImage) return exactImage;

  const campaignKey = normalizarCampana(name);
  const catalogKey = Object.keys(CAMPANAS_INFO)
    .map((key) => ({ key, normalized: normalizarCampana(key) }))
    .filter(
      ({ normalized }) =>
        campaignKey.startsWith(`${normalized} `) ||
        normalized.startsWith(`${campaignKey} `),
    )
    .sort((a, b) => b.normalized.length - a.normalized.length)[0]?.key;

  return (
    (catalogKey ? CAMPANAS_INFO[catalogKey].imagen : undefined) ||
    IMAGEN_POR_DEFECTO
  );
}

function getMigrationResources(
  record: MigrationHistoryRecord,
  enviosServidores: EnviosServidoresRecord[],
) {
  const campaignKey = normalizarCampana(record.Campaña);
  const campaignSegmentKey = normalizarCampana(
    `${record.Campaña} ${record.Segmento}`,
  );
  const exactMatch = enviosServidores.find(
    (item) => normalizarCampana(item.campana) === campaignSegmentKey,
  );
  const campaignMatch =
    exactMatch ??
    enviosServidores.find(
      (item) => normalizarCampana(item.campana) === campaignKey,
    );
  const prefixMatches = campaignMatch
    ? []
    : enviosServidores.filter((item) =>
        normalizarCampana(item.campana).startsWith(`${campaignKey} `),
      );
  const envio =
    campaignMatch ??
    (prefixMatches.length === 1 ? prefixMatches[0] : undefined);
  const campaignInfo = getCampanaInfo(record.Campaña);

  return {
    link: envio?.url.trim() || campaignInfo.enlace?.trim() || "",
    folderPath: envio?.bases.trim() || campaignInfo.rutaCarpetas?.trim() || "",
  };
}

function isInProgress(record: TrainingRecord): boolean {
  const status = (record.estado || "").toLocaleLowerCase("es-CO");
  return status.includes("proceso") || status.includes("curso");
}

function isMoreRecent(
  candidate: TrainingRecord,
  current: TrainingRecord,
): boolean {
  const candidateDate = parseDateString(candidate.fechaSolicitud);
  const currentDate = parseDateString(current.fechaSolicitud);

  if (
    candidateDate &&
    currentDate &&
    candidateDate.getTime() !== currentDate.getTime()
  ) {
    return candidateDate > currentDate;
  }
  if (candidateDate && !currentDate) return true;
  if (!candidateDate && currentDate) return false;

  return (candidate.rowIndex ?? -1) > (current.rowIndex ?? -1);
}

function getRelevantDevelopment(
  records: TrainingRecord[],
): TrainingRecord | undefined {
  const inProgressRecords = records.filter(isInProgress);
  const candidates = inProgressRecords.length > 0 ? inProgressRecords : records;
  return candidates.reduce<TrainingRecord | undefined>(
    (latest, record) =>
      !latest || isMoreRecent(record, latest) ? record : latest,
    undefined,
  );
}

function ActiveCampaignCard({ campaign }: { campaign: ActiveCampaign }) {
  const { name, development } = campaign;
  const image = getCampaignImage(name);
  const observation = development?.observaciones?.trim();

  return (
    <article className="overflow-hidden rounded-xl bg-orange-200/40 transition-colors">
      <div className="min-w-0 gap-4 p-2 flex  sm:gap-5 sm:p-4">
        <div className="overflow-hidden rounded-xl w-sm">
          <img
            src={image}
            alt={`Imagen de ${name}`}
            className="rounded-lg bg-orange-300 object-contain p-2 w-full h-full"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <h4 className="wrap-break-words text-lg font-bold leading-snug text-slate-900">
            {name}
          </h4>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-800">
            <span className="inline-flex items-center gap-1.5">
              <UserRound
                className="h-3.5 w-3.5 text-blue-700"
                aria-hidden="true"
              />
              <span className="font-semibold text-slate-700">
                Desarrollador:
              </span>
              {development?.desarrollador?.trim() || "Sin asignar"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays
                className="h-3.5 w-3.5 text-blue-700"
                aria-hidden="true"
              />
              <span className="font-semibold text-slate-700">Entrega:</span>
              {formatDate(development?.fechaFin)}
            </span>
          </div>

          <div className="mt-4 rounded-xl border-l-4 border-amber-500 bg-white px-3.5 py-3 2xl:w-[140%] w-full">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-900/70">
              Seguimiento del desarrollo · Observación
            </p>
            <p className="mt-1.5 whitespace-pre-wrap wrap-break-words text-sm leading-relaxed text-slate-700 font-bold">
              {observation ||
                "No hay observaciones registradas para este desarrollo."}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Migracion({ enviosServidores, data }: MigracionProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const activeCampaigns = useMemo(() => {
    const trainingByCampaign = new Map<string, TrainingRecord[]>();
    data.forEach((record) => {
      const key = normalizarCampana(record.campana);
      if (!key) return;
      const records = trainingByCampaign.get(key);
      if (records) records.push(record);
      else trainingByCampaign.set(key, [record]);
    });

    const campaigns = new Map<string, string>();
    enviosServidores.forEach((record) => {
      if (normalizeEstadoServidor(record.estadoServidor) !== "MIGRACION")
        return;

      const campaign = record.campana.trim();
      const key = normalizarCampana(campaign);
      if (key && !campaigns.has(key)) campaigns.set(key, campaign);
    });

    return Array.from(campaigns, ([key, name]) => ({
      name,
      development: getRelevantDevelopment(
        Array.from(trainingByCampaign.entries())
          .filter(
            ([trainingKey]) =>
              key === trainingKey ||
              key.startsWith(`${trainingKey} `) ||
              trainingKey.startsWith(`${key} `),
          )
          .sort(([a], [b]) => b.length - a.length)[0]?.[1] ?? [],
      ),
    })).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [data, enviosServidores]);

  return (
    <section className="overflow-hidden space-y-4">
      <div className="flex items-center gap-2 px-1">
        <FolderInput className="h-7 w-7 text-orange-500" />
        <h2 className="text-base font-black uppercase tracking-wide text-slate-800">
          Migración de campañas
        </h2>
      </div>

      <div className="rounded-xl ring-2 ring-sky-800/20 bg-white p-2 mx-2 mb-1 shadow-sm">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,4fr)_minmax(180px,1fr)]">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-800">
                <ServerCog className="h-5 w-5 text-orange-500" />
                En curso
              </h3>
              {activeCampaigns.length > 0 && (
                <span className="text-xs tabular-nums text-slate-500">
                  {activeCampaigns.length}{" "}
                  {activeCampaigns.length === 1 ? "campaña" : "campañas"}
                </span>
              )}
            </div>
            {activeCampaigns.length > 0 ? (
              <ul className="grid gap-3">
                {activeCampaigns.map((campaign) => (
                  <li key={normalizarCampana(campaign.name)}>
                    <ActiveCampaignCard campaign={campaign} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No hay campañas marcadas actualmente como migración.
              </p>
            )}
          </div>

          <aside className="flex flex-col rounded-2xl border border-slate-200 bg-[#1a355b] p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <p className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#3e7cd6] text-white">
                <History className="h-7 w-7" aria-hidden="true" />
              </p>
              <h3 className="text-base   font-bold text-white">
                Opciones de migraciones
              </h3>
            </div>
            <p className="px-3 pt-2 flex-1 text-xs leading-relaxed text-white/80">
              Puedes consultar las campañas ya migradas y las proximas campañas
              a migrar programadas para las próximas entregas.
            </p>
            <button
              type="button"
              aria-expanded={isHistoryOpen}
              aria-controls="migracion-historial"
              onClick={() => setIsHistoryOpen((open) => !open)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#235eb1] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#244775] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              {isHistoryOpen ? "Ocultar historial" : "Ver línea de tiempo"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isHistoryOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              aria-expanded={isHistoryOpen}
              aria-controls="migracion-historial"
              onClick={() => setIsHistoryOpen((open) => !open)}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e56618] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#244775] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              {isHistoryOpen
                ? "Ocultar proximas migraciones"
                : "Ver proximas migraciones"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isHistoryOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </aside>
        </div>

        {isHistoryOpen && (
          <div
            id="migracion-historial"
            className="border-t-2 border-blue-200 bg-blue-50 px-5 py-5 sm:px-6 sm:py-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 ">
                <h3 className="text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-700" />
                  Línea de tiempo de campañas ya migradas
                </h3>
              </div>
            </div>

            <ol className="space-y-3">
              {historyRecords.map((record, index) => {
                const campaignImage = getCampaignImage(record.Campaña);
                const { link, folderPath } = getMigrationResources(
                  record,
                  enviosServidores,
                );

                return (
                  <li
                    key={`${record.Campaña}-${record["Fecha Inicio"]}`}
                    className="relative"
                  >
                    {index < historyRecords.length - 1 && (
                      <span
                        className="absolute bottom-0 left-[19px] top-10 w-px"
                        style={{ backgroundColor: record.Color }}
                        aria-hidden="true"
                      />
                    )}
                    <article
                      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 border-l-4 bg-white p-4 sm:p-5"
                      style={{ borderLeftColor: record.Color }}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:items-center">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="overflow-hidden rounded-xl w-xs">
                            <img
                              src={campaignImage}
                              alt={`Imagen de ${record.Campaña}`}
                              className="h-full w-full rounded-lg object-contain p-2"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${record.Color || "#e2e8f0"} 70%, transparent)`,
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="wrap-break-words text-sm font-bold text-slate-900 sm:text-lg">
                                {record.Campaña}
                              </h4>
                            </div>
                            <p className="mt-1 truncate text-sm font-medium text-slate-600">
                              {record.Cliente} · {record.Segmento}
                            </p>
                            <p 
                              className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-bold"
                              style={{color: record.Color}}>
                              <UserRound
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {record.Desarrollador}
                            </p>
                          </div>
                        </div>

                        <div className="">
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-slate-950/5  px-3 py-3 sm:px-4 mb-4">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900">
                                Inicio
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-900 sm:text-sm">
                                <CalendarDays
                                  className="h-4 w-4 shrink-0 text-blue-700"
                                  aria-hidden="true"
                                />
                                <span className="truncate">
                                  {formatDate(record["Fecha Inicio"])}
                                </span>
                              </p>
                            </div>
                            <div
                              className="flex items-center text-blue-500"
                              aria-hidden="true"
                            >
                              <span className="h-px w-3 bg-slate-900 sm:w-6" />
                              <ArrowRight className="h-4 w-4 shrink-0" />
                              <span className="h-px w-3 bg-slate-900 sm:w-6" />
                            </div>
                            <div className="min-w-0 text-right">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900">
                                Entrega
                              </p>
                              <p className="mt-1 flex items-center justify-end gap-1.5 text-xs font-semibold tabular-nums text-slate-900 sm:text-sm">
                                <Clock3
                                  className="h-3.5 w-3.5 shrink-0 text-blue-500"
                                  aria-hidden="true"
                                />
                                <span className="truncate">
                                  {formatDate(record["Fecha Entrega"])}
                                </span>
                              </p>
                            </div>
                          </div>
                          {(link || folderPath) && (
                          <div className="grid gap-2 sm:grid-cols-2 lg:col-span-2">
                            {link && (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                title={link}
                                style={{color: record.Color, borderColor: record.Color, backgroundColor: `${record.Color}20`}}
                              >
                                <Link2
                                  className="h-4 w-4 shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="truncate">
                                  Abrir enlace
                                </span>
                              </a>
                            )}
                            {folderPath && (
                              <div
                                className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                                title={folderPath}
                                style={{color: record.Color, borderColor: record.Color, backgroundColor: `${record.Color}20`}}
                              >
                                <FolderTree
                                  className="h-4 w-4 shrink-0 text-slate-500"
                                  aria-hidden="true"
                                />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Ruta de carpetas
                                  </p>
                                  <p className="truncate font-mono text-xs">
                                    {folderPath}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        </div>                        
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
