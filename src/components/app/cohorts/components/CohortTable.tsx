import { useState, useMemo } from "react";
import type { CohortRecord } from "../utils/utils";
import { formatPct, formatNum, semaforo, mesLabel } from "../utils/utils";
import { ChevronUp, ChevronDown, Search, Table2, ArrowUpDown } from "lucide-react";

interface Props {
  data: CohortRecord[];
}

type SortKey = keyof CohortRecord;
type SortDir = "asc" | "desc";

const SEMAFORO_CLASS: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300/60 font-bold",
  yellow: "bg-amber-100 text-amber-700 ring-1 ring-amber-300/60 font-bold",
  red: "bg-rose-100 text-rose-700 ring-1 ring-rose-300/60 font-bold",
  gray: "bg-slate-100 text-slate-500 font-medium",
};

function SemaforoBadge({ value }: { value: number | null }) {
  const color = semaforo(value);
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] tabular-nums ${SEMAFORO_CLASS[color]}`}>
      {formatPct(value)}
    </span>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-70 transition-opacity" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-[#1a355b]" />
    : <ChevronDown className="w-3 h-3 text-[#1a355b]" />;
}

const PAGE_SIZE = 50;

export default function CohortTable({ data }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (r) =>
        r.nombre?.toLowerCase().includes(q) ||
        r.campana?.toLowerCase().includes(q) ||
        r.indicador?.toLowerCase().includes(q) ||
        r.formador?.toLowerCase().includes(q) ||
        r.coordinador?.toLowerCase().includes(q) ||
        r.documento?.includes(q) ||
        r.req?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const Th = ({
    label,
    sortable,
    className = "",
  }: {
    label: string;
    sortable?: SortKey;
    className?: string;
  }) => (
    <th
      className={`group px-3 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap select-none transition-colors ${
        sortable ? "cursor-pointer hover:text-[#1a355b] hover:bg-blue-50/50" : ""
      } ${className}`}
      onClick={sortable ? () => handleSort(sortable) : undefined}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {sortable && <SortIcon active={sortKey === sortable} dir={sortDir} />}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Header con Buscador & Contador */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap bg-gradient-to-r from-white via-slate-50/30 to-white">
        <div className="flex items-center gap-2.5">
          <span className="size-8 rounded-lg bg-[#1a355b]/10 flex items-center justify-center text-[#1a355b]">
            <Table2 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              Detalle de Registros
            </h3>
            <p className="text-[11px] text-gray-400">
              {sorted.length.toLocaleString("es-CO")} registros encontrados
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, doc, campaña…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a355b]/20 focus:border-[#1a355b] transition-all bg-slate-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200">
            <tr>
              <Th label="Nombre" sortable="nombre" />
              <Th label="Documento" sortable="documento" />
              <Th label="REQ" sortable="req" />
              <Th label="Mes" sortable="mes" />
              <Th label="Dirección" sortable="direccion" />
              <Th label="Campaña" sortable="campana" />
              <Th label="Segmento" sortable="segmento" />
              <Th label="Indicador" sortable="indicador" />
              <Th label="Formador" sortable="formador" />
              <Th label="Coordinador" sortable="coordinador" />
              <Th label="OJT" />
              <Th label="S1" />
              <Th label="S2" />
              <Th label="S3" />
              <Th label="S4" />
              <Th label="Cierre" sortable="cumplimientoCierre" />
              <Th label="≥70%" sortable="cumplimiento70" />
              <Th label="Observación" className="min-w-[160px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-16 text-center text-gray-400 text-sm">
                  Sin resultados para los filtros y búsqueda aplicados
                </td>
              </tr>
            ) : (
              paged.map((r, i) => (
                <tr
                  key={`${r.sheetName}-${r.rowIndex}-${i}`}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  <td className="px-3 py-2.5 font-bold text-gray-800 whitespace-nowrap">
                    {r.nombre ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 tabular-nums text-[11px]">
                    {r.documento ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 font-medium whitespace-nowrap">
                    {r.req ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {mesLabel(r.mes)}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap max-w-[150px] truncate" title={r.direccion ?? ""}>
                    {r.direccion ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-800 font-semibold whitespace-nowrap max-w-[160px] truncate" title={r.campana ?? ""}>
                    {r.campana ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                    {r.segmento ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap font-medium max-w-[160px] truncate" title={r.indicador ?? ""}>
                    {r.indicador ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap max-w-[140px] truncate" title={r.formador ?? ""}>
                    {r.formador ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap max-w-[140px] truncate" title={r.coordinador || r.sheetName}>
                    {r.coordinador || r.sheetName}
                  </td>
                  <td className="px-3 py-2.5">
                    <SemaforoBadge value={r.cumplimientoOjt} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SemaforoBadge value={r.cumplimientoS1} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SemaforoBadge value={r.cumplimientoS2} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SemaforoBadge value={r.cumplimientoS3} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SemaforoBadge value={r.cumplimientoS4} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SemaforoBadge value={r.cumplimientoCierre} />
                  </td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold text-gray-600 text-center">
                    {formatNum(r.cumplimiento70)}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 text-[11px] max-w-[200px] truncate" title={r.observacion ?? ""}>
                    {r.observacion ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500 bg-slate-50/50">
          <span>
            Página <strong className="text-gray-800">{page}</strong> de <strong className="text-gray-800">{totalPages}</strong> — {sorted.length.toLocaleString("es-CO")} registros
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs cursor-pointer"
            >
              ‹ Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs cursor-pointer"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
