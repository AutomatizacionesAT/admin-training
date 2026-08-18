import { X } from "lucide-react";
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
  SI: "SI",
  NO: "NO",
  MIGRACION: "MIGRACION",
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        <header className="flex items-center justify-between bg-[#12243d] px-6 py-5 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
              Informe de envios
            </p>
            <h2 className="mt-1 text-xl font-black">Estado de servidores</h2>
            <p className="mt-1 text-xs text-slate-300">
              Campañas con estado {selectedStatus ? STATUS_LABELS[selectedStatus] : "de servidor"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar informe de servidores"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

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
                <div key={status} className={`rounded-xl border p-4 ${tone}`}>
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

          <div className="mt-5 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-700">
                Campañas
              </h3>
              <span className="text-xs font-bold text-slate-500">
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
                    <tr key={`${record.campana}-${index}`} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {record.campana || "Sin campaña"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-600">
                        {record.estadoServidor || "Sin dato"}
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
