import { useState, useMemo } from "react";
import type { CohortRecord } from "../utils/utils";
import { formatPct, formatNum, semaforo, mesLabel } from "../utils/utils";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface Props {
  data: CohortRecord[];
}

type SortKey = keyof CohortRecord;
type SortDir = "asc" | "desc";

const SEMAFORO_CLASS: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-400",
};

function SemaforoBadge({ value }: { value: number | null }) {
  const color = semaforo(value);
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${SEMAFORO_CLASS[color]}`}>
      {formatPct(value)}
    </span>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp className="w-3 h-3 opacity-20" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-[#F37021]" />
    : <ChevronDown className="w-3 h-3 text-[#F37021]" />;
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
        r.documento?.includes(q)
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
      className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none ${sortable ? "cursor-pointer hover:text-[#1B365D]" : ""} ${className}`}
      onClick={sortable ? () => handleSort(sortable) : undefined}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortable && <SortIcon active={sortKey === sortable} dir={sortDir} />}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Buscador */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, campaña, indicador…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D] transition-colors"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <Th label="REQ / Indicador" sortable="req" />
              <Th label="Nombre" sortable="nombre" />
              <Th label="Documento" />
              <Th label="Mes" sortable="mes" />
              <Th label="Dirección" sortable="direccion" />
              <Th label="Campaña" sortable="campana" />
              <Th label="Segmento" />
              <Th label="Indicador" sortable="indicador" />
              <Th label="Formador" sortable="formador" />
              <Th label="OJT" />
              <Th label="S1" />
              <Th label="S2" />
              <Th label="S3" />
              <Th label="S4" />
              <Th label="Cierre" sortable="cumplimientoCierre" />
              <Th label="≥70%" />
              <Th label="Observación" className="min-w-[160px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-16 text-center text-gray-400 text-sm">
                  Sin resultados para la búsqueda actual
                </td>
              </tr>
            ) : (
              paged.map((r, i) => (
                <tr
                  key={`${r.sheetName}-${r.rowIndex}-${i}`}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                    {r.nombre ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 tabular-nums text-xs">
                    {r.documento ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                    {r.req ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {mesLabel(r.mes)}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap max-w-[160px] truncate" title={r.direccion ?? ""}>
                    {r.direccion ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap max-w-[180px] truncate" title={r.campana ?? ""}>
                    {r.campana ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                    {r.segmento ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">
                    {r.indicador ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap max-w-[160px] truncate">
                    {r.formador ?? "—"}
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
                  <td className="px-3 py-2.5 tabular-nums text-xs text-gray-500">
                    {formatNum(r.cumplimiento70)}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs max-w-[200px] truncate" title={r.observacion ?? ""}>
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span>
            Página {page} de {totalPages} — {sorted.length.toLocaleString("es-CO")} registros
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹ Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
