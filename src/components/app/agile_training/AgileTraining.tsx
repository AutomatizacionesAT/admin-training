import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Award,
  BriefcaseBusiness,
  CalendarRange,
  Check,
  Gauge,
  ListFilter,
  LoaderCircle,
  Maximize2,
  PauseCircle,
  Target,
  X,
} from 'lucide-react';

import { fetchAgileTrainingData } from './utils/fetchData';
import type { AgileSortField, AgileSortOrder, AgileTrainingKpis, AgileTrainingRow } from './utils/types';

const AGILE_TRAINING_IMAGE = `${import.meta.env.BASE_URL}agile-training/agileTraining.png`;

type ModalState = {
  estado: string;
  rows: AgileTrainingRow[];
} | null;

type MultiSelectProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

type FilterSelectProps = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

type StatTileProps = {
  label: string;
  value: number;
  icon: typeof BriefcaseBusiness;
  accentClass: string;
};

type DetailSectionProps = {
  items: Array<{ label: string; value: string }>;
};

type FilterKey = 'coordinadores' | 'campanas' | 'industria' | 'estado' | 'insignia' | 'jefesDeNegocio' | 'gerencias';

type EstadoSummary = {
  key: string;
  label: string;
  rows: AgileTrainingRow[];
};

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getBadgeClasses(tone: 'blue' | 'green' | 'amber' | 'slate' | 'violet' | 'rose' | 'brown') {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-100 text-amber-700 ring-amber-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    brown: 'bg-stone-200 text-stone-700 ring-stone-300',
  };

  return tones[tone];
}

function getInsigniaTone(insignia: string): 'amber' | 'slate' | 'blue' | 'brown' {
  const normalized = normalizeText(insignia);
  if (normalized.includes('oro')) return 'amber';
  if (normalized.includes('plata')) return 'blue';
  if (normalized.includes('bronce')) return 'brown';
  return 'slate';
}

function getEstadoTone(estado: string): 'blue' | 'green' | 'amber' | 'violet' | 'rose' | 'slate' {
  const normalized = normalizeText(estado);
  if (normalized.includes('final')) return 'green';
  if (normalized.includes('progreso')) return 'blue';
  if (normalized.includes('paus')) return 'amber';
  if (normalized.includes('novedad')) return 'violet';
  if (normalized.includes('retiro')) return 'rose';
  return 'slate';
}

function getEstadoPresentation(estado: string): {
  icon: typeof Activity;
  heroClass: string;
  cardClass: string;
  labelClass: string;
} {
  const normalized = normalizeText(estado);
  if (normalized.includes('final')) {
    return {
      icon: Target,
      heroClass: 'bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-200/20 backdrop-blur-sm',
      cardClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      labelClass: 'text-emerald-600',
    };
  }
  if (normalized.includes('progreso')) {
    return {
      icon: Activity,
      heroClass: 'bg-blue-500/15 text-blue-50 ring-1 ring-blue-200/20 backdrop-blur-sm',
      cardClass: 'border-blue-200 bg-blue-50 text-blue-900',
      labelClass: 'text-blue-600',
    };
  }
  if (normalized.includes('novedad')) {
    return {
      icon: AlertCircle,
      heroClass: 'bg-violet-500/15 text-violet-50 ring-1 ring-violet-200/20 backdrop-blur-sm',
      cardClass: 'border-violet-200 bg-violet-50 text-violet-900',
      labelClass: 'text-violet-600',
    };
  }
  if (normalized.includes('paus')) {
    return {
      icon: PauseCircle,
      heroClass: 'bg-amber-500/15 text-amber-50 ring-1 ring-amber-200/20 backdrop-blur-sm',
      cardClass: 'border-amber-200 bg-amber-50 text-amber-900',
      labelClass: 'text-amber-600',
    };
  }
  if (normalized.includes('retiro')) {
    return {
      icon: X,
      heroClass: 'bg-rose-500/15 text-rose-50 ring-1 ring-rose-200/20 backdrop-blur-sm',
      cardClass: 'border-rose-200 bg-rose-50 text-rose-900',
      labelClass: 'text-rose-600',
    };
  }
  return {
    icon: CalendarRange,
    heroClass: 'bg-slate-500/20 text-slate-50 ring-1 ring-slate-200/20 backdrop-blur-sm',
    cardClass: 'border-slate-200 bg-slate-50 text-slate-900',
    labelClass: 'text-slate-500',
  };
}

function buildEstadoSummary(rows: AgileTrainingRow[]): EstadoSummary[] {
  const summary = new Map<string, EstadoSummary>();

  rows.forEach((row) => {
    const label = row.estado.trim();
    if (!label) return;

    const key = normalizeText(label);
    const current = summary.get(key);
    if (current) {
      current.rows.push(row);
      return;
    }
    summary.set(key, { key, label, rows: [row] });
  });

  return Array.from(summary.values()).sort(
    (a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
  );
}

function getCumplimientoTone(value: number): 'green' | 'amber' | 'rose' {
  if (value >= 80) return 'green';
  if (value >= 30) return 'amber';
  return 'rose';
}

function getCumplimientoTextClass(value: number): string {
  const tone = getCumplimientoTone(value);
  if (tone === 'green') return 'text-emerald-600';
  if (tone === 'amber') return 'text-amber-600';
  return 'text-rose-600';
}

function compareRows(a: AgileTrainingRow, b: AgileTrainingRow, field: AgileSortField, order: AgileSortOrder): number {
  const direction = order === 'asc' ? 1 : -1;

  if (field === 'avancePct' || field === 'pilotoPct' || field === 'cumplimientoPct') {
    return (a[field] - b[field]) * direction;
  }

  if (field === 'fechaFinISO') {
    return a.fechaFinISO.localeCompare(b.fechaFinISO) * direction;
  }

  return a[field].localeCompare(b[field], 'es', { sensitivity: 'base' }) * direction;
}

function buildKpis(rows: AgileTrainingRow[]): AgileTrainingKpis {
  if (rows.length === 0) {
    return {
      totalCampanas: 0,
      promedioAvance: 0,
      promedioMeta: 0,
      promedioPiloto: 0,
      promedioCumplimiento: 0,
    };
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.avance += row.avancePct;
      acc.meta += row.metaPct;
      acc.piloto += row.pilotoPct;
      acc.cumplimiento += row.cumplimientoPct;
      return acc;
    },
    { avance: 0, meta: 0, piloto: 0, cumplimiento: 0 }
  );

  return {
    totalCampanas: rows.length,
    promedioAvance: totals.avance / rows.length,
    promedioMeta: totals.meta / rows.length,
    promedioPiloto: totals.piloto / rows.length,
    promedioCumplimiento: totals.cumplimiento / rows.length,
  };
}

function formatDisplayDate(raw: string, iso: string): string {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (!raw) return 'PENDIENTE';
  return raw.replace('T05:00:00.000Z', '');
}

function formatPossiblePercent(value: string): string {
  if (!value) return 'Sin dato';

  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return value;
  if (numeric >= 0 && numeric <= 1) return formatPercent(numeric * 100);
  if (numeric > 1 && numeric <= 100) return formatPercent(numeric);
  return value;
}

function StatCard({ label, value, icon: Icon, accentClass }: StatTileProps) {
  return (
    <div className={`rounded-2xl p-4 ${accentClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function ProgressMetric({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'violet' }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    violet: 'bg-violet-500',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-lg font-black text-slate-900">{formatPercent(value)}</p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function MultiSelectFilter({ label, placeholder, options, selected, onToggle, onClear }: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const normalized = normalizeText(query);
    return options.filter((option) => {
      if (!normalized) return true;
      return normalizeText(option).includes(normalized);
    });
  }, [options, query]);

  return (
    <div ref={containerRef} className="relative">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div
        className="relative rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 hover:cursor-pointer hover:border-blue-400 hover:shadow-md"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex min-h-12 flex-wrap items-center gap-2 px-3 py-2">
          {selected.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {value}
              <X className="h-3 w-3" />
            </button>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : 'Agregar otro'}
            className="w-full flex-1 border-none bg-transparent pr-6 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            list={undefined}
          />
        </div>

        {selected.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            title="Limpiar filtro"
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const active = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onToggle(option);
                    setOpen(true);
                    inputRef.current?.focus();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>{option}</span>
                  {active ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-sm text-slate-500">No hay opciones disponibles para este filtro.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, options, selected, onToggle, onClear }: FilterSelectProps) {
  return (
    <div className="relative">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <MultiSelectFilter
        label=""
        placeholder={`Selecciona ${label.toLowerCase()}`}
        options={options}
        selected={selected}
        onToggle={onToggle}
        onClear={onClear}
      />
    </div>
  );
}

function DetailSection({ items }: DetailSectionProps) {
  return (
    <div className="border-t border-slate-300 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-300 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{formatPossiblePercent(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstadoModal({ modal, onClose, onSelectCampaign }: { modal: ModalState; onClose: () => void; onSelectCampaign: (campana: string) => void }) {
  useEffect(() => {
    if (!modal) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [modal, onClose]);

  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detalle por estado</p>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${getBadgeClasses(getEstadoTone(modal.estado))}`}>
              {modal.estado}
            </span>
            <p className="mt-1 text-sm text-slate-500">{modal.rows.length} campañas con este estado según los filtros actuales.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 hover:cursor-pointer hover:scale-110">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {modal.rows.map((row) => (
              <div key={`${modal.estado}-${row.campana}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{row.campana}</h3>
                    <p className="text-sm text-slate-500">{row.coordinador || 'Sin coordinador'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectCampaign(row.campana)}
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:cursor-pointer hover:underline"
                  >
                    Ver m&aacute;s..
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{row.notas || 'Sin notas registradas.'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgileTraining() {
  const [rows, setRows] = useState<AgileTrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'campanas'>('resumen');
  const [selectedCoordinadores, setSelectedCoordinadores] = useState<string[]>([]);
  const [selectedCampanas, setSelectedCampanas] = useState<string[]>([]);
  const [selectedIndustrias, setSelectedIndustrias] = useState<string[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [selectedInsignias, setSelectedInsignias] = useState<string[]>([]);
  const [selectedJefesDeNegocio, setSelectedJefesDeNegocio] = useState<string[]>([]);
  const [selectedGerencias, setSelectedGerencias] = useState<string[]>([]);
  const [sortField, setSortField] = useState<AgileSortField>('avancePct');
  const [sortOrder, setSortOrder] = useState<AgileSortOrder>('desc');
  const [summaryOrder, setSummaryOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [estadoModal, setEstadoModal] = useState<ModalState>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    lanzamiento1: false,
    lanzamiento2: false,
    lanzamiento3: false,
    piloto: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAgileTrainingData();
      setRows(data);
    } catch {
      setError('No se pudieron cargar los datos de Agile Training. Verifica la publicación del Apps Script o la disponibilidad de la hoja dataagile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleMultiValue = (current: string[], value: string): string[] => (
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
  );

  const sameArray = (left: string[], right: string[]) => (
    left.length === right.length && left.every((value, index) => value === right[index])
  );

  const applyRowFilters = useCallback((row: AgileTrainingRow, skip: FilterKey[] = []) => {
    if (!skip.includes('coordinadores') && selectedCoordinadores.length > 0 && !selectedCoordinadores.includes(row.coordinador)) {
      return false;
    }

    if (!skip.includes('campanas') && selectedCampanas.length > 0 && !selectedCampanas.includes(row.campana)) {
      return false;
    }

    if (!skip.includes('industria') && selectedIndustrias.length > 0 && !selectedIndustrias.includes(row.industria)) {
      return false;
    }

    if (!skip.includes('estado') && selectedEstados.length > 0 && !selectedEstados.includes(row.estado)) {
      return false;
    }

    if (!skip.includes('insignia') && selectedInsignias.length > 0 && !selectedInsignias.includes(row.insignia)) {
      return false;
    }

    if (!skip.includes('jefesDeNegocio') && selectedJefesDeNegocio.length > 0 && !selectedJefesDeNegocio.includes(row.jefeDeNegocio)) {
      return false;
    }

    if (!skip.includes('gerencias') && selectedGerencias.length > 0 && !selectedGerencias.includes(row.gerencia)) {
      return false;
    }

    return true;
  }, [selectedCampanas, selectedCoordinadores, selectedEstados, selectedGerencias, selectedIndustrias, selectedInsignias, selectedJefesDeNegocio]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => applyRowFilters(row)).sort((a, b) => compareRows(a, b, sortField, sortOrder));
  }, [rows, applyRowFilters, sortField, sortOrder]);

  const availableCoordinadores = useMemo(() => {
    return Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['coordinadores'])).map((row) => row.coordinador).filter(Boolean))).sort();
  }, [rows, applyRowFilters]);

  const availableCampanas = useMemo(() => {
    return Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['campanas'])).map((row) => row.campana).filter(Boolean))).sort();
  }, [rows, applyRowFilters]);

  const availableIndustrias = useMemo(() => {
    return Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['industria'])).map((row) => row.industria).filter(Boolean))).sort();
  }, [rows, applyRowFilters]);

  const availableEstados = useMemo(() => {
    return Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['estado'])).map((row) => row.estado).filter(Boolean))).sort();
  }, [rows, applyRowFilters]);

  const availableInsignias = useMemo(() => {
    return Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['insignia'])).map((row) => row.insignia).filter(Boolean))).sort();
  }, [rows, applyRowFilters]);

  const availableJefesDeNegocio = useMemo(() => {
    return Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['jefesDeNegocio'])).map((row) => row.jefeDeNegocio).filter(Boolean))).sort();
  }, [rows, applyRowFilters]);

  const availableGerencias = useMemo(() => {
    return Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['gerencias'])).map((row) => row.gerencia).filter(Boolean))).sort();
  }, [rows, applyRowFilters]);

  useEffect(() => {
    setSelectedCoordinadores((current) => {
      const next = current.filter((value) => availableCoordinadores.includes(value));
      return sameArray(current, next) ? current : next;
    });
  }, [availableCoordinadores]);

  useEffect(() => {
    setSelectedCampanas((current) => {
      const next = current.filter((value) => availableCampanas.includes(value));
      return sameArray(current, next) ? current : next;
    });
  }, [availableCampanas]);

  useEffect(() => {
    setSelectedIndustrias((current) => {
      const next = current.filter((value) => availableIndustrias.includes(value));
      return sameArray(current, next) ? current : next;
    });
  }, [availableIndustrias]);

  useEffect(() => {
    setSelectedEstados((current) => {
      const next = current.filter((value) => availableEstados.includes(value));
      return sameArray(current, next) ? current : next;
    });
  }, [availableEstados]);

  useEffect(() => {
    setSelectedInsignias((current) => {
      const next = current.filter((value) => availableInsignias.includes(value));
      return sameArray(current, next) ? current : next;
    });
  }, [availableInsignias]);

  useEffect(() => {
    setSelectedJefesDeNegocio((current) => {
      const next = current.filter((value) => availableJefesDeNegocio.includes(value));
      return sameArray(current, next) ? current : next;
    });
  }, [availableJefesDeNegocio]);

  useEffect(() => {
    setSelectedGerencias((current) => {
      const next = current.filter((value) => availableGerencias.includes(value));
      return sameArray(current, next) ? current : next;
    });
  }, [availableGerencias]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedCampaign('');
      return;
    }

    const exists = filteredRows.some((row) => row.campana === selectedCampaign);
    if (!exists) setSelectedCampaign(filteredRows[0].campana);
  }, [filteredRows, selectedCampaign]);

  const selectedRow = useMemo(
    () => filteredRows.find((row) => row.campana === selectedCampaign) ?? filteredRows[0] ?? null,
    [filteredRows, selectedCampaign]
  );

  const filteredKpis = useMemo(() => buildKpis(filteredRows), [filteredRows]);
  const globalStateSummary = useMemo(() => buildEstadoSummary(rows), [rows]);
  const filteredStateSummary = useMemo(() => buildEstadoSummary(filteredRows), [filteredRows]);

  const summaryRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const direction = summaryOrder === 'asc' ? 1 : -1;
      return (a.avancePct - b.avancePct) * direction;
    });
  }, [filteredRows, summaryOrder]);

  const clearAllFilters = () => {
    setSelectedCoordinadores([]);
    setSelectedCampanas([]);
    setSelectedIndustrias([]);
    setSelectedEstados([]);
    setSelectedInsignias([]);
    setSelectedJefesDeNegocio([]);
    setSelectedGerencias([]);
  };

  const selectedLaunchItems = selectedRow
    ? [
        {
          title: 'Especialización Formadores',
          percent: selectedRow.especializacionFormadoresPct,
          items: [
            { label: 'Formador de Formadores', value: selectedRow.formadorDeFormadores },
            { label: 'CED (Campus entrenamiento digital)', value: selectedRow.ced },
            { label: 'U Atento', value: selectedRow.uAtento },
          ],
        },
        {
          title: 'Redefinición Malla De Formación',
          percent: selectedRow.redefinicionMallaFormacionPct,
          items: [
            { label: 'Tipologías y Pareto KPI', value: selectedRow.tipologiasParetoKpi },
            { label: 'Encuesta Asesor', value: selectedRow.encuestaAsesor },
            { label: 'Mejora encuesta post training', value: selectedRow.mejoraEncuestaPostTraining },
            { label: 'Levantamientos del cliente', value: selectedRow.levantamientosCliente },
            { label: 'Migración malla', value: selectedRow.migracionMalla },
          ],
        },
        {
          title: 'Desarrollo Digital (Herramientas diferenciales - Metodologías por objetivos)',
          percent: selectedRow.desarrolloDigitalPct,
          items: [
            { label: 'Herramientas diferenciales', value: selectedRow.herramientasDiferenciales },
            { label: 'Metodologías por objetivos', value: selectedRow.metodologiasObjetivos },
          ],
        },
      ]
    : [];

  const multipleCampaigns = filteredRows.length > 1;
  const hasActiveFilters = selectedCoordinadores.length > 0 || selectedCampanas.length > 0 || selectedIndustrias.length > 0 || selectedEstados.length > 0 || selectedInsignias.length > 0 || selectedJefesDeNegocio.length > 0 || selectedGerencias.length > 0;

  const handleSelectCampaignFromModal = useCallback((campana: string) => {
    setSelectedCampaign(campana);
    setEstadoModal(null);
    setActiveTab('campanas');
  }, []);

  return (
    <>
      <main className="min-h-[calc(100vh-72px)] bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-[#0b1f3a] via-[#10376a] to-[#24479d] px-6 py-8 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)] lg:px-8">
            <img
              src={AGILE_TRAINING_IMAGE}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1/2 z-0 h-60 w-auto -translate-y-1/2 opacity-15 sm:h-[300px] lg:right-8 lg:h-[360px]"
            />
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="relative z-10 max-w-3xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100 ring-1 ring-white/15">
                  Agile Training
                </span>
                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Seguimiento operativo de lanzamiento y piloto por campaña</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                    Una lectura centralizada del estado de cada campaña: cuánto avanza el lanzamiento, cómo se comporta el piloto y qué tan cerca está cada equipo de cumplir su meta.
                  </p>
                </div>
              </div>

              <div className="relative z-10 rounded-3xl bg-white/6 p-3 ring-1 ring-white/10 lg:w-[560px]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="Campañas" value={rows.length} icon={BriefcaseBusiness} accentClass="bg-blue-500/15 text-blue-50 ring-1 ring-blue-200/20 backdrop-blur-sm" />
                  {globalStateSummary.map((estado) => {
                    const presentation = getEstadoPresentation(estado.label);
                    return (
                      <StatCard
                        key={estado.key}
                        label={estado.label}
                        value={estado.rows.length}
                        icon={presentation.icon}
                        accentClass={presentation.heroClass}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'resumen', label: 'Resumen', icon: Gauge },
                  { id: 'campanas', label: 'Campañas', icon: ListFilter },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as 'resumen' | 'campanas')}
                      className={`inline-flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-700 hover:cursor-pointer hover:border-slate-300'}`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{filteredRows.length} campañas visibles</span>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer hover:border-slate-300"
                >
                  <LoaderCircle className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-4 py-4 lg:px-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MultiSelectFilter
                  label="Coordinador"
                  placeholder="Escribe o selecciona"
                  options={availableCoordinadores}
                  selected={selectedCoordinadores}
                  onToggle={(value) => setSelectedCoordinadores((current) => toggleMultiValue(current, value))}
                  onClear={() => setSelectedCoordinadores([])}
                />

                <MultiSelectFilter
                  label="Campaña"
                  placeholder="Filtra por campaña"
                  options={availableCampanas}
                  selected={selectedCampanas}
                  onToggle={(value) => setSelectedCampanas((current) => toggleMultiValue(current, value))}
                  onClear={() => setSelectedCampanas([])}
                />

                <MultiSelectFilter
                  label="Gerencia"
                  placeholder="Filtra por gerencia"
                  options={availableGerencias}
                  selected={selectedGerencias}
                  onToggle={(value) => setSelectedGerencias((current) => toggleMultiValue(current, value))}
                  onClear={() => setSelectedGerencias([])}
                />

                <MultiSelectFilter
                  label="Jefe de negocio"
                  placeholder="Filtra por jefe"
                  options={availableJefesDeNegocio}
                  selected={selectedJefesDeNegocio}
                  onToggle={(value) => setSelectedJefesDeNegocio((current) => toggleMultiValue(current, value))}
                  onClear={() => setSelectedJefesDeNegocio([])}
                />

                <FilterSelect label="Industria" options={availableIndustrias} selected={selectedIndustrias} onToggle={(value) => setSelectedIndustrias((current) => toggleMultiValue(current, value))} onClear={() => setSelectedIndustrias([])} />
                <FilterSelect label="Insignia" options={availableInsignias} selected={selectedInsignias} onToggle={(value) => setSelectedInsignias((current) => toggleMultiValue(current, value))} onClear={() => setSelectedInsignias([])} />
                <FilterSelect label="Estado" options={availableEstados} selected={selectedEstados} onToggle={(value) => setSelectedEstados((current) => toggleMultiValue(current, value))} onClear={() => setSelectedEstados([])} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <X className="h-4 w-4" />
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
                <div className="text-center">
                  <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-blue-600" />
                  <p className="mt-4 text-sm font-medium text-slate-500">Cargando Agile Training...</p>
                </div>
              </div>
            ) : error ? (
              <div className="px-6 py-12">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5" />
                    <div>
                      <p className="font-semibold">No fue posible cargar la vista.</p>
                      <p className="mt-1 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="px-6 py-12">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-base font-semibold text-slate-800">No hay campañas para los filtros seleccionados.</p>
                  <p className="mt-2 text-sm text-slate-500">Limpia uno o varios filtros para volver a ver el portafolio completo.</p>
                </div>
              </div>
            ) : activeTab === 'resumen' ? (
              <div className="space-y-6 px-4 py-6 lg:px-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Campañas visibles</p>
                    <p className="mt-3 text-3xl font-black">{filteredRows.length}</p>
                  </div>
                  {filteredStateSummary.map((estado) => {
                    const presentation = getEstadoPresentation(estado.label);
                    return (
                      <div key={estado.key} className={`rounded-2xl border p-5 ${presentation.cardClass}`}>
                        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${presentation.labelClass}`}>{estado.label}</p>
                        <p className="mt-3 text-3xl font-black">{estado.rows.length}</p>
                      </div>
                    );
                  })}
                </div>

                {multipleCampaigns ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <ProgressMetric label="Promedio avance" value={filteredKpis.promedioAvance} tone="green" />
                    <ProgressMetric label="Promedio piloto" value={filteredKpis.promedioPiloto} tone="violet" />
                  </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Estados</p>
                          <h2 className="mt-2 text-xl font-bold text-slate-900">Estados</h2>
                        </div>
                        <Activity className="h-5 w-5 text-slate-400" />
                      </div>
                    <div className="mt-6 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                      {filteredStateSummary.map((estado) => (
                        <button
                          key={estado.key}
                          type="button"
                          onClick={() => setEstadoModal({ estado: estado.label, rows: estado.rows })}
                          className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                        >
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getBadgeClasses(getEstadoTone(estado.label))}`}>
                            {estado.label}
                          </span>
                          <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            {estado.rows.length}
                            <Maximize2 className="h-4 w-4 text-slate-400" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Avance</p>
                        <h2 className="mt-2 text-xl font-bold text-slate-900">Campañas filtradas</h2>
                      </div>
                      {multipleCampaigns ? (
                        <button
                          type="button"
                          onClick={() => setSummaryOrder((current) => (current === 'asc' ? 'desc' : 'asc'))}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:cursor-pointer hover:border-slate-300"
                        >
                          {summaryOrder === 'desc' ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
                          {summaryOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-6 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                      {summaryRows.map((row) => (
                        <button
                          key={row.campana}
                          type="button"
                          onClick={() => {
                            setSelectedCampaign(row.campana);
                            setActiveTab('campanas');
                          }}
                          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{row.campana}</p>
                              {row.insignia ? (
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getBadgeClasses(getInsigniaTone(row.insignia))}`}>
                                  {row.insignia}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{row.coordinador || 'Sin coordinador'}</p>
                          </div>
                          <span className={`text-xl font-black ${getCumplimientoTextClass(row.avancePct)}`}>
                            {formatPercent(row.avancePct)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <div className="space-y-6 px-4 py-6 lg:px-6">
                <div className="grid gap-4 xl:grid-cols-2">
                  <ProgressMetric label="Promedio avance" value={filteredKpis.promedioAvance} tone="green" />
                  <ProgressMetric label="Promedio piloto" value={filteredKpis.promedioPiloto} tone="violet" />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Vista por campaña</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select value={sortField} onChange={(event) => setSortField(event.target.value as AgileSortField)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 hover:cursor-pointer hover:border-slate-300">
                        <option value="avancePct">Avance</option>
                        <option value="cumplimientoPct">Cumplimiento</option>
                        <option value="campana">Campaña</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="pilotoPct">Piloto</option>
                      </select>
                      <button type="button" onClick={() => setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:cursor-pointer hover:border-slate-300">
                        {sortOrder === 'desc' ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
                        {sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[520px] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                        <tr>
                          <th className="px-4 py-3">Campaña</th>
                          <th className="px-4 py-3">Coordinador</th>
                          <th className="px-4 py-3">Avance</th>
                          <th className="px-4 py-3">Meta</th>
                          <th className="px-4 py-3">Cumplimiento</th>
                          <th className="px-4 py-3">Piloto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredRows.map((row) => {
                          const active = selectedRow?.campana === row.campana;
                          return (
                            <tr key={row.campana} className={`cursor-pointer transition ${active ? 'bg-blue-100' : 'hover:bg-slate-50'}`} onClick={() => setSelectedCampaign(row.campana)}>
                              <td className="px-4 py-4 align-top">
                                <div>
                                  <p className="font-semibold text-slate-900">{row.campana}</p>
                                  <p className="mt-1 text-xs text-slate-500">{row.industria || 'Sin industria'} · {row.insignia || 'Sin insignia'}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top text-slate-700">{row.coordinador || 'Sin coordinador'}</td>
                              <td className={`px-4 py-4 align-top text-lg font-black ${getCumplimientoTextClass(row.avancePct)}`}>{formatPercent(row.avancePct)}</td>
                              <td className="px-4 py-4 align-top font-semibold text-slate-700">{formatPercent(row.metaPct)}</td>
                              <td className="px-4 py-4 align-top font-semibold text-slate-700">{formatPercent(row.cumplimientoPct)}</td>
                              <td className="px-4 py-4 align-top font-semibold text-slate-700">{formatPercent(row.pilotoPct)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                  {selectedRow ? (
                    <>
                      <section className="">

                        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 py-5 sm:flex-row">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detalle de campaña</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedRow.campana}</h2>
                            <p className="mt-2 text-sm font-medium text-slate-500">{selectedRow.coordinador || 'Sin coordinador'}</p>
                            <p className="mt-1 text-xs text-slate-400">{selectedRow.industria || 'Sin industria'}</p>
                            {(selectedRow.gerencia || selectedRow.jefeDeNegocio) ? (
                              <div className="mt-4 flex flex-row flex-wrap items-start gap-2">
                                {selectedRow.gerencia ? (
                                  <div className="max-w-full rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900 ring-1 ring-emerald-200">
                                    <p className="text-[16px] font-bold uppercase tracking-[0.16em] text-emerald-600">Gerencia</p>
                                    <p className="mt-0.5 break-words text-sm font-bold">{selectedRow.gerencia}</p>
                                  </div>
                                ) : null}
                                {selectedRow.jefeDeNegocio ? (
                                  <div className="max-w-full rounded-xl bg-amber-50 px-3 py-2 text-amber-900 ring-1 ring-amber-200">
                                    <p className="text-[16px] font-bold uppercase tracking-[0.16em] text-amber-600">Jefe de negocio</p>
                                    <p className="mt-0.5 break-words text-sm font-bold">{selectedRow.jefeDeNegocio}</p>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getBadgeClasses(getInsigniaTone(selectedRow.insignia))}`}>
                            <Award className="mr-1 h-3.5 w-3.5" />
                            {selectedRow.insignia || 'Sin insignia'}
                          </span>
                        </div>

                        <div className="max-h-[450px] overflow-y-auto space-y-5">

                          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Avance</p>
                            <p className={`mt-2 text-4xl font-black ${getCumplimientoTextClass(selectedRow.avancePct)}`}>{formatPercent(selectedRow.avancePct)}</p>
                          </div>

                          <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white  p-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Inicio: {formatDisplayDate(selectedRow.fechaInicio, selectedRow.fechaInicioISO)}</div>
                            <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Fin: {formatDisplayDate(selectedRow.fechaFin, selectedRow.fechaFinISO)}</div>
                            <div className="flex items-center gap-2"><Gauge className="h-4 w-4" />Duración: {selectedRow.duracionDias ? `${selectedRow.duracionDias} días` : selectedRow.duracion ? `${selectedRow.duracion} días` : 'Pendiente'}</div>
                          </div>

                          <div className="mt-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getBadgeClasses(getEstadoTone(selectedRow.estado))}`}>
                              {selectedRow.estado || 'Sin estado'}
                            </span>
                          </div>

                          {selectedRow.notas ? (
                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Notas</p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{selectedRow.notas}</p>
                            </div>
                          ) : null}

                          <section className="space-y-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Fase</p>
                              <h3 className="mt-1 text-lg font-bold text-slate-900">Implementaci&oacute;n</h3>
                            </div>

                            {selectedLaunchItems.map((section, index) => {
                              if (index === 2) {
                                return (
                                  <div key={section.title} className="rounded-2xl border border-slate-200 bg-white">
                                    <div className="flex w-full items-center justify-between gap-4 p-4 text-left">
                                      <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                                      <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-slate-900">{formatPercent(section.percent)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              const key = `lanzamiento${index + 1}`;
                              const isOpen = openSections[key];
                              return (
                                <div key={section.title} className="rounded-2xl border border-slate-200 bg-white">
                                  <button
                                    type="button"
                                    onClick={() => setOpenSections((current) => ({ ...current, [key]: !current[key] }))}
                                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:cursor-pointer"
                                  >
                                    <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-black text-slate-900">{formatPercent(section.percent)}</span>
                                      <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><ArrowDownWideNarrow className="h-4 w-4 text-slate-400" /></span>
                                    </div>
                                  </button>
                                  {isOpen ? <DetailSection items={section.items} /> : null}
                                </div>
                              );
                            })}

                            <div className="pt-2">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Fase</p>
                              <h3 className="mt-1 text-lg font-bold text-slate-900">Lanzamiento</h3>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white">
                              <button
                                type="button"
                                onClick={() => setOpenSections((current) => ({ ...current, piloto: !current.piloto }))}
                                className="flex w-full items-center justify-between gap-4 p-4 text-left hover:cursor-pointer"
                              >
                                <h3 className="text-lg font-bold text-slate-900">Piloto</h3>
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-black text-slate-900">{formatPercent(selectedRow.pilotoPct)}</span>
                                  <span className={`transition-transform ${openSections.piloto ? 'rotate-180' : ''}`}><ArrowDownWideNarrow className="h-4 w-4 text-slate-400" /></span>
                                </div>
                              </button>
                              {openSections.piloto ? (
                                <DetailSection
                                  items={[
                                    { label: 'PPT Lanzamiento', value: selectedRow.pptLanzamiento },
                                    { label: 'Graduación OJT', value: selectedRow.graduacionOjt },
                                    { label: 'Resultados', value: selectedRow.resultados },
                                  ]}
                                />
                              ) : null}
                            </div>
                          </section>

                        </div>


                      </section>
                    </>
                  ) : null}
                </aside>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <EstadoModal modal={estadoModal} onClose={() => setEstadoModal(null)} onSelectCampaign={handleSelectCampaignFromModal} />
    </>
  );
}
