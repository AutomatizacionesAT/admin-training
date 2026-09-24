import { useState } from "react";
import {
  X,
  CalendarDays,
  Building2,
  BriefcaseBusiness,
  Layers,
  FileText,
  Clock3,
  BadgeCheck,
  ShieldUser,
  Monitor,
  Hash,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import type { TrainingRecord } from "../utils/utils";
import { getDeliveryCompliance } from "../utils/utils";

interface SimulatorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TrainingRecord | null;
}

function formatField(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "—";
}

function getStatusTone(raw: string | null) {
  const value = (raw || "").toUpperCase().trim();
  if (value.includes("FINALIZ") || value.includes("ENTREG") || value.includes("COMPLET")) {
    return {
      label: "FINALIZADA",
      note: "Desarrollo entregado y verificado",
      chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
      dot: "bg-emerald-400",
      badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-300",
      accentBar: "bg-emerald-500",
      icon: BadgeCheck,
    };
  }
  if (value.includes("PROCESO") || value.includes("CURSO") || value.includes("DESARROLL")) {
    return {
      label: "EN PROCESO",
      note: "Desarrollo activo en ejecución",
      chip: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
      dot: "bg-orange-400 animate-pulse",
      badgeColor: "bg-orange-50 text-orange-700 ring-orange-300",
      accentBar: "bg-orange-500",
      icon: Clock3,
    };
  }
  if (value.includes("PROYECT") || value.includes("PENDIENT") || value.includes("ESPERA")) {
    return {
      label: "PROYECTADA",
      note: "Programado en cronograma operativo",
      chip: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
      dot: "bg-blue-400",
      badgeColor: "bg-blue-50 text-blue-700 ring-blue-300",
      accentBar: "bg-blue-600",
      icon: AlertCircle,
    };
  }
  return {
    label: value || "SIN INICIAR",
    note: "Pendiente de inicio de actividades",
    chip: "bg-slate-500/15 text-slate-300 ring-slate-400/30",
    dot: "bg-slate-400",
    badgeColor: "bg-slate-100 text-slate-700 ring-slate-300",
    accentBar: "bg-slate-400",
    icon: HelpCircle,
  };
}

export default function SimulatorDetailModal({
  isOpen,
  onClose,
  record,
}: SimulatorDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const statusTone = getStatusTone(record.estado);
  const StatusIcon = statusTone.icon;
  const title = record.nombreProceso || record.aplicativo || "Simulador sin título";
  const compliance = getDeliveryCompliance(record);

  const handleCopySummary = async () => {
    const summaryText = [
      `SIMULADOR: ${title}`,
      `ID: ${record.id || record.rowIndex || "N/A"}`,
      `ESTADO: ${record.estado || "Sin Iniciar"}`,
      `CUMPLIMIENTO SLA: ${compliance.label} (${compliance.description})`,
      `APLICATIVO: ${record.aplicativo || "—"}`,
      `CAMPAÑA: ${record.campana || "—"}`,
      `COORDINADOR: ${record.coordinador || "—"}`,
      `DESARROLLADOR: ${record.desarrollador || "—"}`,
      `INDUSTRIA / DIRECCIÓN: ${record.industria || "—"} · ${record.direccion || "—"}`,
      `FECHA INICIO: ${record.fechaInicio || "—"}`,
      `FECHA FIN: ${record.fechaFin || "—"}`,
      `FECHA REAL: ${record.fechaReal || "—"}`,
      record.notas ? `OBSERVACIONES: ${record.notas}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_40px_80px_-20px_rgba(2,10,24,0.6)] ring-1 ring-slate-900/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================ CABECERA CORPORATIVA =========================== */}
        <div className="relative overflow-hidden bg-[#0b1a2f] px-6 py-4.5 shrink-0">
          {/* Patrón de puntos idéntico a Web Training */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              color: "#7dd3fc",
              maskImage: "linear-gradient(to right, black, transparent 75%)",
              WebkitMaskImage: "linear-gradient(to right, black, transparent 75%)",
            }}
          />
          {/* Brillos ambientales */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 bottom-[-70px] h-48 w-48 rounded-full bg-blue-500/25 blur-3xl"
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/40 ring-1 ring-white/20">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">
                  Detalle del Simulador
                </p>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white truncate max-w-xl">
                  {title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white/90 ring-1 ring-inset ring-white/20 transition hover:bg-white/20 hover:text-white cursor-pointer"
                title="Copiar resumen al portapapeles"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 ring-1 ring-inset ring-white/20 transition hover:bg-white/20 hover:text-white cursor-pointer"
                aria-label="Cerrar detalle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================================ CUERPO ============================= */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            {/* ------------------------- IZQUIERDA: HERO CARD ------------------- */}
            <aside className="flex flex-col gap-3.5">
              <div className="relative overflow-hidden rounded-2xl bg-[#0b1a2f] p-5 text-white ring-1 ring-slate-900/20 shadow-md">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.14]"
                  style={{
                    backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                    color: "#60a5fa",
                    maskImage: "linear-gradient(to bottom, black, transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
                  }}
                />
                <div className="relative">
                  {/* Tag superior */}
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-6 rounded-full bg-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                      Simulador & Proceso
                    </p>
                  </div>

                  {/* Nombre del Proceso */}
                  <h3 className="mt-2.5 text-pretty text-xl font-black leading-tight tracking-tight text-white">
                    {title}
                  </h3>

                  {/* Campaña pill */}
                  {record.campana && (
                    <p className="mt-1 text-xs font-semibold text-blue-200/90 truncate">
                      {record.campana}
                    </p>
                  )}

                  {/* Coordinador */}
                  <div className="mt-4 flex items-center gap-3 border-t border-white/15 pt-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-black text-white ring-2 ring-white/20 shadow-sm">
                      <ShieldUser className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                        Coordinador Responsable
                      </p>
                      <p className="truncate text-xs font-bold text-white mt-0.5">
                        {formatField(record.coordinador)}
                      </p>
                    </div>
                  </div>

                  {/* Desarrollador */}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-xs font-black text-white ring-2 ring-white/20 shadow-sm">
                      <BriefcaseBusiness className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                        Desarrollador Asignado
                      </p>
                      <p className="truncate text-xs font-bold text-white mt-0.5">
                        {formatField(record.desarrollador)}
                      </p>
                    </div>
                  </div>

                  {/* Estado Operativo */}
                  <div className={`mt-4 flex items-center gap-2.5 rounded-xl p-3 ring-1 ring-inset ${statusTone.chip}`}>
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusTone.dot}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider">
                        {statusTone.label}
                      </p>
                      <p className="truncate text-[11px] text-slate-300 font-medium">
                        {statusTone.note}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card complementario de Aplicativo / Sistema */}
              <div className="overflow-hidden rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block">
                    Aplicativo / Plataforma
                  </span>
                  <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                    {formatField(record.aplicativo)}
                  </p>
                </div>
                {record.id && (
                  <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                    <Hash className="w-3 h-3 text-slate-400" />
                    {record.id}
                  </div>
                )}
              </div>
            </aside>

            {/* ------------------------- DERECHA: GRILLA DE DATOS ---------------- */}
            <section className="flex flex-col gap-4">
              {/* Bloque 1: Métricas Principales en Cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Estado */}
                <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200 transition hover:ring-2 hover:bg-blue-50/50 hover:ring-blue-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-blue-700">
                    <BadgeCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                      Estado Actual
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${statusTone.badgeColor}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {formatField(record.estado)}
                    </span>
                  </div>
                </div>

                {/* Aplicativo */}
                <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200 transition hover:ring-2 hover:bg-blue-50/50 hover:ring-blue-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-blue-700">
                    <Monitor className="h-4 w-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                      Aplicativo / Sistema
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 truncate mt-1">
                    {formatField(record.aplicativo)}
                  </p>
                </div>

                {/* Campaña */}
                <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200 transition hover:ring-2 hover:bg-blue-50/50 hover:ring-blue-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-blue-700">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                      Campaña / Cliente
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 truncate mt-1">
                    {formatField(record.campana)}
                  </p>
                </div>

                {/* Dirección / Industria */}
                <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200 transition hover:ring-2 hover:bg-blue-50/50 hover:ring-blue-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-blue-700">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                      Industria · Dirección
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 truncate mt-1">
                    {formatField(record.industria)} · {formatField(record.direccion)}
                  </p>
                </div>
              </div>

              {/* Bloque 2: Cronograma de Fechas */}
              <div className="rounded-2xl bg-white p-4.5 ring-1 ring-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-blue-900">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                    <span className="text-[11px] font-black uppercase tracking-[0.16em]">
                      Cronograma Operativo de Fechas
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Base_SM (1)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Fecha Inicio */}
                  <div className="p-3 rounded-xl bg-blue-50/50 border-l-4 border-l-blue-500 border border-slate-200/80 transition hover:shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1 text-blue-700">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                        Fecha Inicio
                      </span>
                    </div>
                    <p className="text-sm font-black tabular-nums font-mono text-slate-900 mt-1">
                      {formatField(record.fechaInicio)}
                    </p>
                  </div>

                  {/* Fecha Fin Proyectada */}
                  <div className="p-3 rounded-xl bg-orange-50/50 border-l-4 border-l-orange-500 border border-slate-200/80 transition hover:shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1 text-orange-700">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                        Fin Proyectado
                      </span>
                    </div>
                    <p className="text-sm font-black tabular-nums font-mono text-slate-900 mt-1">
                      {formatField(record.fechaFin)}
                    </p>
                  </div>

                  {/* Fecha Entrega Real */}
                  <div className="p-3 rounded-xl bg-emerald-50/50 border-l-4 border-l-emerald-500 border border-slate-200/80 transition hover:shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                        Entrega Real
                      </span>
                    </div>
                    <p className="text-sm font-black tabular-nums font-mono text-emerald-900 mt-1">
                      {formatField(record.fechaReal)}
                    </p>
                  </div>
                </div>

                {/* Tarjeta Vistosa de Cumplimiento / SLA */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    compliance.status === "on_time"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                      : compliance.status === "delayed"
                      ? "bg-rose-50/90 border-rose-200 text-rose-950"
                      : compliance.status === "pending_delayed"
                      ? "bg-amber-50/90 border-amber-200 text-amber-950"
                      : "bg-blue-50/70 border-blue-200 text-blue-950"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${
                        compliance.status === "on_time"
                          ? "bg-emerald-600 ring-2 ring-emerald-300"
                          : compliance.status === "delayed"
                          ? "bg-rose-600 ring-2 ring-rose-300"
                          : compliance.status === "pending_delayed"
                          ? "bg-amber-600 ring-2 ring-amber-300"
                          : "bg-blue-600 ring-2 ring-blue-300"
                      }`}
                    >
                      {compliance.status === "on_time" ? (
                        <BadgeCheck className="h-5 w-5" />
                      ) : compliance.status === "delayed" ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Clock3 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                          Cumplimiento SLA (Plazo de 5 días)
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${compliance.badgeClass}`}
                        >
                          {compliance.label}
                        </span>
                      </div>
                      <p className="text-xs font-semibold mt-0.5 truncate">
                        {compliance.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200/60">
                    <span
                      className={`text-xs font-black uppercase tracking-wider block ${
                        compliance.status === "on_time"
                          ? "text-emerald-700"
                          : compliance.status === "delayed"
                          ? "text-rose-700"
                          : "text-slate-600"
                      }`}
                    >
                      {compliance.status === "on_time"
                        ? "100% Cumplido"
                        : compliance.status === "delayed"
                        ? "Desfase Detectado"
                        : "En Seguimiento"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {record.fechaReal
                        ? `Registrado: ${record.fechaReal}`
                        : "Pendiente de entrega"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Observaciones y Notas */}
              <div className="rounded-2xl bg-white p-4.5 ring-1 ring-slate-200 shadow-2xs">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                    Observaciones y Notas
                  </span>
                </div>
                {record.notas && record.notas.trim() ? (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-950 leading-relaxed whitespace-pre-line font-medium">
                    {record.notas}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-1">
                    No se registran observaciones o requerimientos especiales para este simulador.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* ================================ FOOTER ============================= */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Módulo Simulador</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-slate-400">
              Registro {record.id ? `#${record.id}` : `Fila ${record.rowIndex || "—"}`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1b355b] to-[#13253f] hover:brightness-110 shadow-sm transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
