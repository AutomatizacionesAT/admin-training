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
  Rocket,
  Target,
  X,
} from 'lucide-react';

import { fetchAgileTrainingData } from './utils/fetchData';
import type { AgileSortField, AgileSortOrder, AgileTrainingKpis, AgileTrainingRow } from './utils/types';

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
  value: string;
  options: string[];
  defaultLabel: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

type DetailSectionProps = {
  title: string;
  percent: number;
  items: Array<{ label: string; value: string }>;
};

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function getBadgeClasses(tone: 'blue' | 'green' | 'amber' | 'slate' | 'violet' | 'rose') {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  };

  return tones[tone];
}

function getInsigniaTone(insignia: string): 'amber' | 'slate' | 'blue' {
  const normalized = normalizeText(insignia);
  if (normalized.includes('oro')) return 'amber';
  if (normalized.includes('plata')) return 'blue';
  return 'slate';
}

function getEstadoTone(estado: string): 'blue' | 'green' | 'amber' | 'violet' | 'rose' | 'slate' {
  const normalized = normalizeText(estado);
  if (normalized.includes('final')) return 'green';
  if (normalized.includes('progreso')) return 'blue';
  if (normalized.includes('paus')) return 'amber';
  if (normalized.includes('novedad')) return 'violet';
  return 'slate';
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
      promedioPiloto: 0,
      promedioCumplimiento: 0,
      finalizadas: 0,
      enProgreso: 0,
      novedad: 0,
      pausado: 0,
    };
  }

  const totals = rows.reduce(
    (acc, row) => {
      const estado = normalizeText(row.estado);
      acc.avance += row.avancePct;
      acc.piloto += row.pilotoPct;
      acc.cumplimiento += row.cumplimientoPct;
      if (estado.includes('final')) acc.finalizadas += 1;
      if (estado.includes('progreso')) acc.enProgreso += 1;
      if (estado.includes('novedad')) acc.novedad += 1;
      if (estado.includes('paus')) acc.pausado += 1;
      return acc;
    },
    { avance: 0, piloto: 0, cumplimiento: 0, finalizadas: 0, enProgreso: 0, novedad: 0, pausado: 0 }
  );

  return {
    totalCampanas: rows.length,
    promedioAvance: totals.avance / rows.length,
    promedioPiloto: totals.piloto / rows.length,
    promedioCumplimiento: totals.cumplimiento / rows.length,
    finalizadas: totals.finalizadas,
    enProgreso: totals.enProgreso,
    novedad: totals.novedad,
    pausado: totals.pausado,
  };
}

function formatDisplayDate(raw: string, iso: string): string {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (!raw) return 'Sin fecha';
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

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BriefcaseBusiness }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-blue-100" />
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
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex min-h-12 flex-wrap items-center gap-2 px-3 py-2 pr-12">
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
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : 'Agregar otro'}
            className="min-w-[140px] flex-1 border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            list={undefined}
          />
        </div>

        {selected.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            title="Limpiar filtro"
            className="absolute right-10 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
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
                    setQuery('');
                    setOpen(true);
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

function FilterSelect({ label, value, options, defaultLabel, onChange, onClear }: FilterSelectProps) {
  const getOptionLabel = (option: string) => {
    if (option === 'below') return 'Debajo de meta';
    if (option === 'met') return 'En meta';
    if (option === 'over') return 'Sobrecumplido';
    return option;
  };

  return (
    <div className="relative">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 pr-12 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{defaultLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>{getOptionLabel(option)}</option>
        ))}
      </select>
      {value ? (
        <button
          type="button"
          onClick={onClear}
          title="Limpiar filtro"
          className="absolute right-3 top-[34px] inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function DetailSection({ title, percent, items }: DetailSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Punto de lanzamiento</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <span className="text-lg font-black text-slate-900">{formatPercent(percent)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-slate-50 p-3">
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
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
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
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
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
  const [selectedIndustria, setSelectedIndustria] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedInsignia, setSelectedInsignia] = useState('');
  const [selectedPerformance, setSelectedPerformance] = useState('');
  const [sortField, setSortField] = useState<AgileSortField>('cumplimientoPct');
  const [sortOrder, setSortOrder] = useState<AgileSortOrder>('desc');
  const [summaryOrder, setSummaryOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [estadoModal, setEstadoModal] = useState<ModalState>(null);

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

  const applyRowFilters = useCallback((row: AgileTrainingRow, skip: Array<'coordinadores' | 'campanas' | 'industria' | 'estado' | 'insignia' | 'performance' | 'search'> = []) => {
    if (!skip.includes('coordinadores') && selectedCoordinadores.length > 0 && !selectedCoordinadores.includes(row.coordinador)) {
      return false;
    }

    if (!skip.includes('campanas') && selectedCampanas.length > 0 && !selectedCampanas.includes(row.campana)) {
      return false;
    }

    if (!skip.includes('industria') && selectedIndustria && row.industria !== selectedIndustria) {
      return false;
    }

    if (!skip.includes('estado') && selectedEstado && row.estado !== selectedEstado) {
      return false;
    }

    if (!skip.includes('insignia') && selectedInsignia && row.insignia !== selectedInsignia) {
      return false;
    }

    if (!skip.includes('performance')) {
      if (selectedPerformance === 'below' && row.cumplimientoPct >= 100) return false;
      if (selectedPerformance === 'met' && (row.cumplimientoPct < 100 || row.cumplimientoPct > 120)) return false;
      if (selectedPerformance === 'over' && row.cumplimientoPct <= 120) return false;
    }

    return true;
  }, [selectedCampanas, selectedCoordinadores, selectedEstado, selectedIndustria, selectedInsignia, selectedPerformance]);

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
    if (selectedIndustria && !availableIndustrias.includes(selectedIndustria)) setSelectedIndustria('');
  }, [availableIndustrias, selectedIndustria]);

  useEffect(() => {
    if (selectedEstado && !availableEstados.includes(selectedEstado)) setSelectedEstado('');
  }, [availableEstados, selectedEstado]);

  useEffect(() => {
    if (selectedInsignia && !availableInsignias.includes(selectedInsignia)) setSelectedInsignia('');
  }, [availableInsignias, selectedInsignia]);

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

  const globalKpis = useMemo(() => buildKpis(rows), [rows]);
  const filteredKpis = useMemo(() => buildKpis(filteredRows), [filteredRows]);

  const stateSummary = useMemo(() => {
    const summary = new Map<string, AgileTrainingRow[]>();
    filteredRows.forEach((row) => {
      const key = row.estado || 'Sin estado';
      summary.set(key, [...(summary.get(key) ?? []), row]);
    });
    return Array.from(summary.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredRows]);

  const summaryRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const direction = summaryOrder === 'asc' ? 1 : -1;
      return (a.cumplimientoPct - b.cumplimientoPct) * direction;
    });
  }, [filteredRows, summaryOrder]);

  const clearAllFilters = () => {
    setSelectedCoordinadores([]);
    setSelectedCampanas([]);
    setSelectedIndustria('');
    setSelectedEstado('');
    setSelectedInsignia('');
    setSelectedPerformance('');
  };

  const selectedLaunchItems = selectedRow
    ? [
        {
          title: 'Especialización Formadores',
          percent: selectedRow.tercio1Pct,
          items: [
            { label: 'Formador de Formadores', value: selectedRow.formadorDeFormadores },
            { label: 'CED (Campus entrenamiento digital)', value: selectedRow.ced },
            { label: 'U Atento', value: selectedRow.uAtento },
          ],
        },
        {
          title: 'Redefinición Malla De Formación',
          percent: selectedRow.tercio2Pct,
          items: [
            { label: 'Tipologías y Pareto KPI', value: selectedRow.tipologiasParetoKpi },
            { label: 'Encuesta Asesor', value: selectedRow.encuestaAsesor },
            { label: 'Mejora encuesta post training', value: selectedRow.mejoraEncuestaPostTraining },
            { label: 'Levantamientos del cliente', value: selectedRow.levantamientosCliente },
            { label: 'Migración malla', value: selectedRow.migracionMalla },
          ],
        },
        {
          title: 'Desarrollo Digital',
          percent: selectedRow.tercio3Pct,
          items: [
            { label: 'Herramientas diferenciales', value: selectedRow.herramientasDiferenciales },
            { label: 'Metodologías por objetivos', value: selectedRow.metodologiasObjetivos },
          ],
        },
      ]
    : [];

  const multipleCampaigns = filteredRows.length > 1;
  const hasActiveFilters = selectedCoordinadores.length > 0 || selectedCampanas.length > 0 || !!selectedIndustria || !!selectedEstado || !!selectedInsignia || !!selectedPerformance;

  const handleSelectCampaignFromModal = useCallback((campana: string) => {
    setSelectedCampaign(campana);
    setEstadoModal(null);
    setActiveTab('campanas');
  }, []);

  return (
    <>
      <main className="min-h-[calc(100vh-72px)] bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-[#0b1f3a] via-[#10376a] to-[#24479d] px-6 py-8 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)] lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100 ring-1 ring-white/15">
                  <Rocket className="h-3.5 w-3.5" />
                  Agile Training
                </span>
                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Seguimiento operativo de lanzamiento y piloto por campaña</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                    Una lectura centralizada del estado de cada campaña: cuánto avanza el lanzamiento, cómo se comporta el piloto y qué tan cerca está cada equipo de cumplir su meta.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white/6 p-3 ring-1 ring-white/10 lg:w-[420px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard label="Campañas" value={rows.length} icon={BriefcaseBusiness} />
                  <StatCard label="Finalizadas" value={globalKpis.finalizadas} icon={Target} />
                  <StatCard label="En progreso" value={globalKpis.enProgreso} icon={Activity} />
                  <StatCard label="Con novedad" value={globalKpis.novedad} icon={AlertCircle} />
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
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
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
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LoaderCircle className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-4 py-4 lg:px-6">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_repeat(4,minmax(0,0.9fr))]">
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

                <FilterSelect label="Industria" value={selectedIndustria} options={availableIndustrias} defaultLabel="Todas las industrias" onChange={setSelectedIndustria} onClear={() => setSelectedIndustria('')} />
                <FilterSelect label="Insignia" value={selectedInsignia} options={availableInsignias} defaultLabel="Todas las insignias" onChange={setSelectedInsignia} onClear={() => setSelectedInsignia('')} />
                <FilterSelect label="Estado" value={selectedEstado} options={availableEstados} defaultLabel="Todos los estados" onChange={setSelectedEstado} onClear={() => setSelectedEstado('')} />
                <FilterSelect label="Cumplimiento" value={selectedPerformance} options={['below', 'met', 'over']} defaultLabel="Todo el cumplimiento" onChange={setSelectedPerformance} onClear={() => setSelectedPerformance('')} />
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Campañas visibles</p>
                    <p className="mt-3 text-3xl font-black text-slate-900">{filteredRows.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Finalizadas</p>
                    <p className="mt-3 text-3xl font-black text-slate-900">{filteredKpis.finalizadas}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">En progreso</p>
                    <p className="mt-3 text-3xl font-black text-slate-900">{filteredKpis.enProgreso}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Con novedad</p>
                    <p className="mt-3 text-3xl font-black text-slate-900">{filteredKpis.novedad}</p>
                  </div>
                </div>

                {multipleCampaigns ? (
                  <div className="grid gap-4 xl:grid-cols-3">
                    <ProgressMetric label="Promedio lanzamiento" value={filteredKpis.promedioAvance} tone="blue" />
                    <ProgressMetric label="Promedio cumplimiento" value={filteredKpis.promedioCumplimiento} tone="green" />
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
                    <div className="mt-6 space-y-3">
                      {stateSummary.map(([estado, estadoRows]) => (
                        <button
                          key={estado}
                          type="button"
                          onClick={() => setEstadoModal({ estado, rows: estadoRows })}
                          className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                        >
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getBadgeClasses(getEstadoTone(estado))}`}>
                            {estado}
                          </span>
                          <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            {estadoRows.length}
                            <Maximize2 className="h-4 w-4 text-slate-400" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Cumplimiento</p>
                        <h2 className="mt-2 text-xl font-bold text-slate-900">Campañas filtradas</h2>
                      </div>
                      {multipleCampaigns ? (
                        <button
                          type="button"
                          title="Ordenar cumplimiento"
                          onClick={() => setSummaryOrder((current) => (current === 'asc' ? 'desc' : 'asc'))}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
                            <p className="font-semibold text-slate-900">{row.campana}</p>
                            <p className="mt-1 text-sm text-slate-500">{row.coordinador || 'Sin coordinador'}</p>
                          </div>
                          <span className={`text-xl font-black ${getCumplimientoTextClass(row.cumplimientoPct)}`}>
                            {formatPercent(row.cumplimientoPct)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 px-4 py-6 xl:grid-cols-[1.2fr_0.8fr] lg:px-6">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Vista por campaña</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select value={sortField} onChange={(event) => setSortField(event.target.value as AgileSortField)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="cumplimientoPct">Cumplimiento</option>
                        <option value="avancePct">Avance</option>
                        <option value="fechaFinISO">Fecha fin</option>
                        <option value="campana">Campaña</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="pilotoPct">Piloto</option>
                      </select>
                      <button type="button" onClick={() => setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        {sortOrder === 'desc' ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
                        {sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
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
                            <tr key={row.campana} className={`cursor-pointer transition ${active ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`} onClick={() => setSelectedCampaign(row.campana)}>
                              <td className="px-4 py-4 align-top">
                                <div>
                                  <p className="font-semibold text-slate-900">{row.campana}</p>
                                  <p className="mt-1 text-xs text-slate-500">{row.industria || 'Sin industria'} · {row.insignia || 'Sin insignia'}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top text-slate-700">{row.coordinador || 'Sin coordinador'}</td>
                              <td className="px-4 py-4 align-top font-semibold text-slate-900">{formatPercent(row.avancePct)}</td>
                              <td className="px-4 py-4 align-top font-semibold text-slate-700">{formatPercent(row.metaPct)}</td>
                              <td className={`px-4 py-4 align-top text-lg font-black ${getCumplimientoTextClass(row.cumplimientoPct)}`}>{formatPercent(row.cumplimientoPct)}</td>
                              <td className="px-4 py-4 align-top font-semibold text-slate-700">{formatPercent(row.pilotoPct)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <aside className="space-y-5">
                  {selectedRow ? (
                    <>
                      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detalle de campaña</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedRow.campana}</h2>
                            <p className="mt-2 text-sm text-slate-500">{selectedRow.coordinador || 'Sin coordinador'} · {selectedRow.industria || 'Sin industria'}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getBadgeClasses(getInsigniaTone(selectedRow.insignia))}`}>
                            <Award className="mr-1 h-3.5 w-3.5" />
                            {selectedRow.insignia || 'Sin insignia'}
                          </span>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Cumplimiento</p>
                          <p className={`mt-2 text-4xl font-black ${getCumplimientoTextClass(selectedRow.cumplimientoPct)}`}>{formatPercent(selectedRow.cumplimientoPct)}</p>
                        </div>

                        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Inicio: {formatDisplayDate(selectedRow.fechaInicio, selectedRow.fechaInicioISO)}</div>
                          <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Fin: {formatDisplayDate(selectedRow.fechaFin, selectedRow.fechaFinISO)}</div>
                          <div className="flex items-center gap-2"><Gauge className="h-4 w-4" />Duración: {selectedRow.duracionDias || selectedRow.duracion || 0} días</div>
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
                      </section>

                      <section className="space-y-4">
                        {selectedLaunchItems.map((section) => (
                          <DetailSection key={section.title} title={section.title} percent={section.percent} items={section.items} />
                        ))}

                        <DetailSection
                          title="Piloto"
                          percent={selectedRow.pilotoPct}
                          items={[
                            { label: 'PPT Lanzamiento', value: selectedRow.pptLanzamiento },
                            { label: 'Graduación OJT', value: selectedRow.graduacionOjt },
                            { label: 'Resultados', value: selectedRow.resultados },
                          ]}
                        />
                      </section>
                    </>
                  ) : null}
                </aside>
              </div>
            )}
          </section>
        </div>
      </main>

      <EstadoModal modal={estadoModal} onClose={() => setEstadoModal(null)} onSelectCampaign={handleSelectCampaignFromModal} />
    </>
  );
}
