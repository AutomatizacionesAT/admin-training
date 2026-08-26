import { semaforo, toPct } from "../utils/utils";
import type { CohortRecord } from "../utils/utils";

const S_BG: Record<string, string> = {
  green:  "bg-green-500",
  yellow: "bg-amber-400",
  red:    "bg-red-400",
  gray:   "bg-gray-300",
};
const S_TEXT: Record<string, string> = {
  green:  "text-green-600",
  yellow: "text-amber-600",
  red:    "text-red-500",
  gray:   "text-gray-400",
};
const S_BADGE: Record<string, string> = {
  green:  "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red:    "bg-red-100 text-red-600",
  gray:   "bg-gray-100 text-gray-400",
};

const toDisplay = (pct: number | null): number | null => {
  if (pct === null) return null;
  return pct > 1 ? Math.round(pct) : toPct(pct);
};

function ProgressRow({ label, total, pct }: { label: string; total?: number; pct: number | null }) {
  const color = semaforo(pct !== null && pct > 1 ? pct / 100 : pct);
  const dp = toDisplay(pct);
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <span className="flex-1 text-xs text-gray-700 truncate" title={label}>{label}</span>
      {total !== undefined && (
        <span className="text-[11px] text-gray-400 tabular-nums w-7 text-right shrink-0">{total}</span>
      )}
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${S_BG[color]}`} style={{ width: `${Math.min(100, dp ?? 0)}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums w-9 text-right shrink-0 ${S_TEXT[color]}`}>
        {dp !== null ? `${dp}%` : "—"}
      </span>
    </div>
  );
}

interface ByCampana   { campana: string; total: number; cumpliendo: number; promCierre: number | null }
interface ByIndicador { indicador: string; total: number; promCierre: number | null }
interface Props       { byCampana: ByCampana[]; byIndicador: ByIndicador[]; filteredData: CohortRecord[] }

export default function CohortResumenTab({ byCampana, byIndicador, filteredData }: Props) {

  // RACs únicos por campaña
  const racPorCampana = (() => {
    const docsMap = new Map<string, Set<string>>();
    const regMap  = new Map<string, number>();
    const sumMap  = new Map<string, { sum: number; count: number }>();
    filteredData.forEach((r) => {
      const k = r.campana ?? "Sin campaña";
      if (!docsMap.has(k)) docsMap.set(k, new Set());
      if (r.documento) docsMap.get(k)!.add(r.documento);
      regMap.set(k, (regMap.get(k) ?? 0) + 1);
      if (r.cumplimientoCierre !== null) {
        const p = toDisplay(r.cumplimientoCierre) ?? 0;
        const prev = sumMap.get(k) ?? { sum: 0, count: 0 };
        sumMap.set(k, { sum: prev.sum + p, count: prev.count + 1 });
      }
    });
    return Array.from(docsMap.entries())
      .map(([campana, docs]) => ({
        campana,
        racs: docs.size,
        registros: regMap.get(campana) ?? 0,
        promCierre: sumMap.has(campana)
          ? Math.round(sumMap.get(campana)!.sum / sumMap.get(campana)!.count)
          : null,
      }))
      .sort((a, b) => b.racs - a.racs);
  })();

  const totalRacs = racPorCampana.reduce((s, r) => s + r.racs, 0);

  // Top formadores
  const byFormador = (() => {
    const map = new Map<string, number>();
    filteredData.forEach((r) => { if (r.formador) map.set(r.formador, (map.get(r.formador) ?? 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, n]) => ({ formador: f, total: n }));
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

      {/* ── Col 1: RACs por campaña ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-[#1B365D]/10 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-[#1B365D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1B365D] leading-tight">RACs por campaña</p>
            <p className="text-[10px] text-gray-400">Personas únicas por documento</p>
          </div>
          <span className="text-[10px] font-bold text-[#F37021] bg-orange-50 px-2 py-0.5 rounded-full shrink-0">
            {totalRacs.toLocaleString("es-CO")} RACs
          </span>
        </div>

        {/* Tabla completa sin scroll */}
        {racPorCampana.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Sin datos</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-400 uppercase tracking-wide">Campaña</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-400 uppercase tracking-wide">RACs</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-400 uppercase tracking-wide">Reg.</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400 uppercase tracking-wide">Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {racPorCampana.map((row) => {
                const color = semaforo(row.promCierre !== null && row.promCierre > 1 ? row.promCierre / 100 : row.promCierre);
                return (
                  <tr key={row.campana} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-700 max-w-[140px] truncate" title={row.campana}>{row.campana}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums font-bold text-[#1B365D]">{row.racs}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-gray-400">{row.registros}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${S_BADGE[color]}`}>
                        {row.promCierre !== null ? `${row.promCierre}%` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Col 2: Cumplimiento cierre por campaña (barras) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-[#1B365D]">Cumplimiento cierre por campaña</p>
        </div>
        <div className="px-4 py-2">
          {byCampana.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Sin datos</p>
          ) : (
            byCampana.map((row) => (
              <ProgressRow key={row.campana} label={row.campana} total={row.total} pct={row.promCierre} />
            ))
          )}
        </div>
      </div>

      {/* ── Col 3: Indicador + Formadores ───────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-[#1B365D]">Cumplimiento por indicador</p>
          </div>
          <div className="px-4 py-2">
            {byIndicador.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin datos</p>
            ) : (
              byIndicador.map((row) => (
                <ProgressRow key={row.indicador} label={row.indicador} total={row.total} pct={row.promCierre} />
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-[#1B365D] mb-3">Top formadores</p>
          {byFormador.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {byFormador.map(({ formador, total }, idx) => (
                <div key={formador} className="flex items-center gap-2">
                  <span className="w-4 text-[10px] font-bold text-gray-300 tabular-nums shrink-0">{idx + 1}</span>
                  <span className="flex-1 text-xs text-gray-700 truncate" title={formador}>{formador}</span>
                  <span className="text-xs font-bold text-[#F37021] tabular-nums shrink-0">{total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
