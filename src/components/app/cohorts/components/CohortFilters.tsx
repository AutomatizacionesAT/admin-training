import type { CohortFilters } from "../hooks/useCohortData";
import { X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const MESES = [
  { v: 1,  l: "Ene" }, { v: 2,  l: "Feb" }, { v: 3,  l: "Mar" },
  { v: 4,  l: "Abr" }, { v: 5,  l: "May" }, { v: 6,  l: "Jun" },
  { v: 7,  l: "Jul" }, { v: 8,  l: "Ago" }, { v: 9,  l: "Sep" },
  { v: 10, l: "Oct" }, { v: 11, l: "Nov" }, { v: 12, l: "Dic" },
];

// ── Dropdown personalizado sin z-index issues ─────────────────
function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = value ?? label;
  const active = value !== null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all ${
          active
            ? "bg-[#1B365D] text-white border-[#1B365D]"
            : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
        }`}
      >
        {display}
        <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        {active && (
          <span
            className="ml-0.5 w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
          >
            <X className="w-2 h-2" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[200] min-w-[180px] max-h-64 overflow-y-auto py-1">
          <button
            className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50"
            onClick={() => { onChange(null); setOpen(false); }}
          >
            Todos
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-[#1B365D] ${
                value === opt ? "bg-blue-50 text-[#1B365D] font-semibold" : "text-gray-700"
              }`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface Props {
  filters: CohortFilters;
  onChange: (f: CohortFilters) => void;
  availableAnios: number[];
  availableCoordinadores: string[];
  availableCampanas: string[];
  availableDirecciones: string[];
  availableIndicadores: string[];
  totalFiltered: number;
  totalAll: number;
}

export default function CohortFilters({
  filters,
  onChange,
  availableAnios,
  availableCoordinadores,
  availableCampanas,
  availableDirecciones,
  availableIndicadores,
  totalFiltered,
  totalAll,
}: Props) {
  const set = <K extends keyof CohortFilters>(key: K, val: CohortFilters[K]) =>
    onChange({ ...filters, [key]: val });

  const resetAll = () =>
    onChange({ anio: filters.anio, mes: null, coordinador: null, campana: null, direccion: null, indicador: null });

  const hasActive = filters.mes !== null || filters.coordinador !== null
    || filters.campana !== null || filters.direccion !== null || filters.indicador !== null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">

      {/* Fila 1: Año */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest w-16 shrink-0">AÑO</span>
        <div className="flex gap-2 flex-wrap">
          {availableAnios.map((a) => (
            <button
              key={a}
              onClick={() => set("anio", a)}
              className={`h-7 px-3 rounded-full text-xs font-semibold transition-all ${
                filters.anio === a
                  ? "bg-[#1B365D] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {a}
            </button>
          ))}
          {filters.anio !== null && (
            <button
              onClick={() => set("anio", null)}
              className="h-7 px-3 rounded-full text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              Todos
            </button>
          )}
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-gray-100" />

      {/* Fila 2: Meses */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest w-16 shrink-0">MES</span>
        <div className="flex gap-1.5 flex-wrap">
          {MESES.map((m) => (
            <button
              key={m.v}
              onClick={() => set("mes", filters.mes === m.v ? null : m.v)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium transition-all ${
                filters.mes === m.v
                  ? "bg-[#F37021] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-gray-100" />

      {/* Fila 3: Dropdowns + contador */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest w-16 shrink-0">FILTRAR POR</span>

        <div className="flex gap-2 flex-wrap items-center">
          {availableCoordinadores.length > 1 && (
            <Dropdown
              label="Coordinador"
              value={filters.coordinador}
              options={availableCoordinadores}
              onChange={(v) => set("coordinador", v)}
            />
          )}
          <Dropdown
            label="Dirección"
            value={filters.direccion}
            options={availableDirecciones}
            onChange={(v) => set("direccion", v)}
          />
          <Dropdown
            label="Campaña"
            value={filters.campana}
            options={availableCampanas}
            onChange={(v) => set("campana", v)}
          />
          <Dropdown
            label="Req / Indicador"
            value={filters.indicador}
            options={availableIndicadores}
            onChange={(v) => set("indicador", v)}
          />

          {hasActive && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 h-8 px-3 rounded-full text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-all"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>

        <span className="ml-auto text-xs text-gray-400 tabular-nums">
          <span className="font-semibold text-gray-600">{totalFiltered.toLocaleString("es-CO")}</span>
          {" "}/ {totalAll.toLocaleString("es-CO")} registros
        </span>
      </div>
    </div>
  );
}
