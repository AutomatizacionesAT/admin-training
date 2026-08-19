import { X, ClipboardList } from "lucide-react";
import type {
  EstadoServidorFilter,
} from "../hooks/useWTReportData";
import type { EnviosServidoresRecord } from "../utils/utils";

interface EnviosServidoresReportDialogProps {
  open: boolean;
  records: EnviosServidoresRecord[];
  selectedStatus: EstadoServidorFilter | null;
  onClose: () => void;
}

const STATUS_OPTIONS: EstadoServidorFilter[] = ["SI", "NO", "MIGRACION"];

function normalizeStatus(value: string): EstadoServidorFilter | null {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (["SI", "TRUE", "VERDADERO", "1", "EN SERVIDOR"].includes(normalized)) return "SI";
  if (["NO", "FALSE", "FALSO", "0", "SIN SERVIDOR"].includes(normalized)) return "NO";
  if (normalized.includes("MIGRACION")) return "MIGRACION";
  return null;
}

const STATUS_LABELS: Record<EstadoServidorFilter, string> = {
  SI: "EN SERVIDOR",
  NO: "SIN SERVIDOR",
  MIGRACION: "EN MIGRACION",
};

export function EnviosServidoresReportDialog({
  open,
  records,
  selectedStatus,
  onClose,
}: EnviosServidoresReportDialogProps) {
  if (!open) return null;

  const counts = STATUS_OPTIONS.reduce<Record<EstadoServidorFilter, number>>(
    (result, status) => {
      result[status] = records.filter(
        (record) => normalizeStatus(record.estadoServidor) === status,
      ).length;
      return result;
    },
    { SI: 0, NO: 0, MIGRACION: 0 },
  );
  const total = records.length;
  const visibleRecords = selectedStatus
    ? records.filter(
        (record) => normalizeStatus(record.estadoServidor) === selectedStatus,
      )
    : records;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">       
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
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
                <ClipboardList className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">Informe general del estado de web training en servidores</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300">                
                  <b className="font-semibold text-amber-400">Estado de servidores</b>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-inset ring-white/15">
                <span className="text-2xl font-bold leading-none text-amber-400">{total}</span>
                <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-300">
                  registros
                  <br />
                  listados
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {STATUS_OPTIONS.map((status) => {
              const percentage = total > 0 ? (counts[status] / total) * 100 : 0;
              const tone =
                status === "SI"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : status === "NO"
                    ? "border-slate-200 bg-slate-100 text-slate-700"
                    : "border-orange-200 bg-orange-50 text-orange-700";

              return (
                <div key={status} className={`rounded-xl border p-4 ${tone} ${selectedStatus === status ? 'ring-3 ring-amber-500' : ''}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                    {STATUS_LABELS[status]}
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <strong className="text-3xl font-black">{counts[status]}</strong>
                    <span className="text-sm font-bold">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl bg-white">
            <div className="flex items-center bg-slate-300 justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-700">
                Campañas
              </h3>
              <span className="text-xs font-bold text-blue-900">
                {visibleRecords.length} registros
              </span>
            </div>
            <div className="max-h-[45vh] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Nombre campaña</th>
                    <th className="px-4 py-3 font-black">Estado servidor</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record, index) => (
                    <tr key={`${record.campana}-${index}`} className={`${record.estadoServidor === "NO" ? 'bg-red-50 border-l-4 border-red-800 hover:bg-red-100' : record.estadoServidor === "MIGRACION" ? 'bg-amber-50 border-l-4 border-amber-800 hover:bg-amber-100' : 'bg-green-50 border-l-4 border-green-800 hover:bg-green-100'}`}>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {record.campana || "Sin campaña"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-600">
                        {record.estadoServidor === "SI" ? "EN SERVIDOR" : record.estadoServidor === "NO" ? "SIN SERVIDOR" : record.estadoServidor === "MIGRACION" ? "EN MIGRACION" : record.estadoServidor || "DESCONOCIDO"}
                      </td>
                    </tr>
                  ))}
                  {visibleRecords.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-10 text-center text-sm text-slate-500">
                        No hay registros para este estado.
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
