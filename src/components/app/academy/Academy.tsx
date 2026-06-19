import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarRange,
  Check,
  Database,
  Gauge,
  GraduationCap,
  Layers3,
  LoaderCircle,
  PieChart,
  X,
} from 'lucide-react';

import { fetchAcademySheet } from './utils/fetchData';
import type { AcademyKpis, AcademyRow, AcademySheetKey, AcademySortField, AcademySortOrder, PieSlice } from './utils/types';

const CAFE_OPERACIONES_IMAGE = `${import.meta.env.BASE_URL}academy/cafeOperaciones.png`;
const CAFE_GO_IMAGE = `${import.meta.env.BASE_URL}academy/cafeGo.png`;

type AcademyTab = {
  id: AcademySheetKey;
  label: string;
  subtitle: string;
};

type MultiSelectProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

const TABS: AcademyTab[] = [
  { id: 'formacionContinua', label: 'Cafe Operaciones', subtitle: 'Formación continua' },
  { id: 'formacionInicial', label: 'Cafe Go', subtitle: 'Formación inicial' },
];

function formatPercent(value: number | null): string {
  if (value === null) return 'Pendiente';
  return `${Math.round(value)}%`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function getProgressTone(value: number | null): string {
  if (value === null) return 'text-slate-500';
  if (value >= 100) return 'text-emerald-600';
  if (value > 0) return 'text-amber-600';
  return 'text-rose-600';
}

function getStatusTone(status: string): string {
  const normalized = normalizeText(status);
  if (normalized.includes('final')) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (normalized.includes('novedad')) return 'bg-violet-50 text-violet-700 ring-violet-200';
  if (normalized.includes('retiro')) return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function formatDisplayDate(raw: string, iso: string): string {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (!raw) return 'Pendiente';
  return raw.replace('T05:00:00.000Z', '');
}

function compareRows(a: AcademyRow, b: AcademyRow, field: AcademySortField, order: AcademySortOrder): number {
  const direction = order === 'asc' ? 1 : -1;
  if (field === 'backupPct' || field === 'migracionPct') {
    return ((a[field] ?? -1) - (b[field] ?? -1)) * direction;
  }
  if (field === 'fechaFinISO') {
    return a.fechaFinISO.localeCompare(b.fechaFinISO) * direction;
  }
  return a[field].localeCompare(b[field], 'es', { sensitivity: 'base' }) * direction;
}

function buildKpis(rows: AcademyRow[]): AcademyKpis {
  if (rows.length === 0) {
    return {
      totalCampanas: 0,
      promedioBackup: null,
      promedioMigracion: null,
      backupCompletado: 0,
      migracionCompletada: 0,
    };
  }

  const withBackup = rows.filter((row) => row.backupPct !== null);
  const withMigration = rows.filter((row) => row.migracionPct !== null);

  return {
    totalCampanas: rows.length,
    promedioBackup: withBackup.length > 0 ? withBackup.reduce((acc, row) => acc + (row.backupPct ?? 0), 0) / withBackup.length : null,
    promedioMigracion: withMigration.length > 0 ? withMigration.reduce((acc, row) => acc + (row.migracionPct ?? 0), 0) / withMigration.length : null,
    backupCompletado: rows.filter((row) => (row.backupPct ?? -1) >= 100).length,
    migracionCompletada: rows.filter((row) => (row.migracionPct ?? -1) >= 100).length,
  };
}

function buildPieData(rows: AcademyRow[], field: 'backupPct' | 'migracionPct'): PieSlice[] {
  const completado = rows.filter((row) => (row[field] ?? -1) >= 100).length;
  const restante = Math.max(rows.length - completado, 0);

  return [
    { label: 'Completado', count: completado, color: '#10b981' },
    { label: 'Resto', count: restante, color: '#cbd5e1' },
  ].filter((slice) => slice.count > 0);
}

function PieCard({ title, data, average }: { title: string; data: PieSlice[]; average: number | null }) {
  const total = data.reduce((acc, item) => acc + item.count, 0);
  const gradient = total === 0
    ? '#e2e8f0'
    : `conic-gradient(${data.reduce<{ stops: string[]; current: number }>((acc, item) => {
      const next = acc.current + (item.count / total) * 100;
      acc.stops.push(`${item.color} ${acc.current}% ${next}%`);
      acc.current = next;
      return acc;
    }, { stops: [], current: 0 }).stops.join(', ')})`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Distribución</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <PieChart className="h-5 w-5 text-slate-400" />
      </div>
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full" style={{ background: gradient }}>
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-center shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Promedio</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatPercent(average)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
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
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const normalized = normalizeText(query);
    return options.filter((option) => !normalized || normalizeText(option).includes(normalized));
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
            <button key={value} type="button" onClick={() => onToggle(value)} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">
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
            className="min-w-[140px] flex-1 border-none bg-transparent pr-6 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
        {selected.length > 0 ? (
          <button type="button" onClick={onClear} title="Limpiar filtro" className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600">
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
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
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

export default function Academy() {
  const [dataBySheet, setDataBySheet] = useState<Record<AcademySheetKey, AcademyRow[]>>({
    formacionContinua: [],
    formacionInicial: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AcademySheetKey>('formacionContinua');
  const [selectedCoordinadores, setSelectedCoordinadores] = useState<string[]>([]);
  const [selectedCampanas, setSelectedCampanas] = useState<string[]>([]);
  const [selectedIndustrias, setSelectedIndustrias] = useState<string[]>([]);
  const [sortField, setSortField] = useState<AcademySortField>('backupPct');
  const [sortOrder, setSortOrder] = useState<AcademySortOrder>('desc');
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [continua, inicial] = await Promise.all([
        fetchAcademySheet('formacionContinua'),
        fetchAcademySheet('formacionInicial'),
      ]);
      setDataBySheet({ formacionContinua: continua, formacionInicial: inicial });
    } catch {
      setError('No se pudieron cargar los datos de Academy. Verifica la publicación del Apps Script o la disponibilidad de las hojas de formación.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = dataBySheet[activeTab];

  const sameArray = (left: string[], right: string[]) => left.length === right.length && left.every((value, index) => value === right[index]);
  const toggleMultiValue = (current: string[], value: string) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  const applyRowFilters = useCallback((row: AcademyRow, skip: Array<'coordinadores' | 'campanas' | 'industrias'> = []) => {
    if (!skip.includes('coordinadores') && selectedCoordinadores.length > 0 && !selectedCoordinadores.includes(row.coordinador)) return false;
    if (!skip.includes('campanas') && selectedCampanas.length > 0 && !selectedCampanas.includes(row.campana)) return false;
    if (!skip.includes('industrias') && selectedIndustrias.length > 0 && !selectedIndustrias.includes(row.industria)) return false;
    return true;
  }, [selectedCampanas, selectedCoordinadores, selectedIndustrias]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => applyRowFilters(row)).sort((a, b) => compareRows(a, b, sortField, sortOrder));
  }, [rows, applyRowFilters, sortField, sortOrder]);

  const availableCoordinadores = useMemo(() => Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['coordinadores'])).map((row) => row.coordinador).filter(Boolean))).sort(), [rows, applyRowFilters]);
  const availableCampanas = useMemo(() => Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['campanas'])).map((row) => row.campana).filter(Boolean))).sort(), [rows, applyRowFilters]);
  const availableIndustrias = useMemo(() => Array.from(new Set(rows.filter((row) => applyRowFilters(row, ['industrias'])).map((row) => row.industria).filter(Boolean))).sort(), [rows, applyRowFilters]);
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
    if (filteredRows.length === 0) {
      setSelectedCampaign('');
      return;
    }
    const exists = filteredRows.some((row) => row.campana === selectedCampaign);
    if (!exists) setSelectedCampaign(filteredRows[0].campana);
  }, [filteredRows, selectedCampaign]);

  const selectedRow = useMemo(() => filteredRows.find((row) => row.campana === selectedCampaign) ?? filteredRows[0] ?? null, [filteredRows, selectedCampaign]);
  const kpis = useMemo(() => buildKpis(filteredRows), [filteredRows]);
  const backupPie = useMemo(() => buildPieData(filteredRows, 'backupPct'), [filteredRows]);
  const migrationPie = useMemo(() => buildPieData(filteredRows, 'migracionPct'), [filteredRows]);
  const hasActiveFilters = selectedCoordinadores.length > 0 || selectedCampanas.length > 0 || selectedIndustrias.length > 0;

  const clearAllFilters = () => {
    setSelectedCoordinadores([]);
    setSelectedCampanas([]);
    setSelectedIndustrias([]);
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-[#0b1f3a] via-[#10376a] to-[#24479d] px-6 py-10 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)] lg:px-8">
        <img
          src={CAFE_GO_IMAGE}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 z-0 h-[180px] w-auto -translate-y-1/2 opacity-15 sm:h-60 lg:left-4 lg:h-[300px]"
        />
        <img
          src={CAFE_OPERACIONES_IMAGE}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 z-0 h-[180px] w-auto -translate-y-1/2 opacity-10 sm:h-60 lg:right-4 lg:h-[300px]"
        />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100 ring-1 ring-white/15">
              Academy
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Seguimiento de migración hacia Atento Academy</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Monitorea el backup y la migración de contenidos de Moodle para formación inicial y continua, con visibilidad por campaña, coordinador e industria.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-3xl bg-white/6 p-5 ring-1 ring-white/10 lg:w-[360px]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-blue-50 ring-1 ring-white/15">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Moodle a Academy</p>
                <p className="mt-2 text-xl font-bold text-white">Backup y migración por formación</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">Consulta el avance de Cafe Operaciones y Cafe Go en una sola vista administrativa.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-[1440px] rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <Layers3 className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{filteredRows.length} campañas visibles</span>
            <button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <LoaderCircle className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-4 py-4 lg:px-6">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_1fr]">
            <MultiSelectFilter label="Coordinador" placeholder="Escribe o selecciona" options={availableCoordinadores} selected={selectedCoordinadores} onToggle={(value) => setSelectedCoordinadores((current) => toggleMultiValue(current, value))} onClear={() => setSelectedCoordinadores([])} />
            <MultiSelectFilter label="Campaña" placeholder="Filtra por campaña" options={availableCampanas} selected={selectedCampanas} onToggle={(value) => setSelectedCampanas((current) => toggleMultiValue(current, value))} onClear={() => setSelectedCampanas([])} />
            <MultiSelectFilter label="Industria" placeholder="Selecciona industria" options={availableIndustrias} selected={selectedIndustrias} onToggle={(value) => setSelectedIndustrias((current) => toggleMultiValue(current, value))} onClear={() => setSelectedIndustrias([])} />
          </div>
          {hasActiveFilters ? (
            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={clearAllFilters} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                <X className="h-4 w-4" />
                Limpiar filtros
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">Cargando Academy...</p>
            </div>
          </div>
        ) : error ? (
          <div className="px-6 py-12">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">No fue posible cargar Academy.</p>
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
        ) : (
          <div className="space-y-6 px-4 py-6 lg:px-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Backup completado</p>
                <p className="mt-3 text-3xl font-black text-blue-900">{kpis.backupCompletado}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">Migración completada</p>
                <p className="mt-3 text-3xl font-black text-emerald-900">{kpis.migracionCompletada}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Tab activa</p>
                <p className="mt-3 text-xl font-black text-slate-900">{TABS.find((tab) => tab.id === activeTab)?.label}</p>
              </div>
            </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                <PieCard title="Estado del backup" data={backupPie} average={kpis.promedioBackup} />
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm xl:min-w-[170px]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Campañas visibles</p>
                  <p className="mt-2 text-4xl font-black text-slate-900">{kpis.totalCampanas}</p>
                  <p className="mt-2 text-sm text-slate-500">según filtros activos</p>
                </div>
                <PieCard title="Estado de la migración" data={migrationPie} average={kpis.promedioMigracion} />
              </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{TABS.find((tab) => tab.id === activeTab)?.subtitle}</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">Vista por campaña</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select value={sortField} onChange={(event) => setSortField(event.target.value as AcademySortField)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                      <option value="backupPct">Backup</option>
                      <option value="migracionPct">Migración</option>
                      <option value="campana">Campaña</option>
                      <option value="coordinador">Coordinador</option>
                    </select>
                    <button type="button" onClick={() => setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {sortOrder === 'desc' ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
                      {sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
                    </button>
                  </div>
                </div>

                <div className="max-h-[560px] overflow-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                      <tr>
                        <th className="px-4 py-3">Campaña</th>
                        <th className="px-4 py-3">Coordinador</th>
                        <th className="px-4 py-3">Industria</th>
                        <th className="px-4 py-3">Backup</th>
                        <th className="px-4 py-3">Migración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRows.map((row) => {
                        const active = selectedRow?.campana === row.campana;
                        return (
                          <tr key={`${activeTab}-${row.campana}`} className={`cursor-pointer transition ${active ? 'bg-blue-100' : 'hover:bg-slate-50'}`} onClick={() => setSelectedCampaign(row.campana)}>
                            <td className="px-4 py-4 align-top">
                              <div>
                                <p className="font-semibold text-slate-900">{row.campana}</p>
                                <p className="mt-1 text-xs text-slate-500">{row.direccion || 'Sin dirección'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-slate-700">{row.coordinador || 'Sin coordinador'}</td>
                            <td className="px-4 py-4 align-top text-slate-700">{row.industria || 'Sin industria'}</td>
                            <td className={`px-4 py-4 align-top text-lg font-black ${getProgressTone(row.backupPct)}`}>{formatPercent(row.backupPct)}</td>
                            <td className={`px-4 py-4 align-top text-lg font-black ${getProgressTone(row.migracionPct)}`}>{formatPercent(row.migracionPct)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                {selectedRow ? (
                  <section>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 py-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detalle de campaña</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedRow.campana}</h2>
                        <p className="mt-2 text-sm text-slate-500">{selectedRow.coordinador || 'Sin coordinador'} · {selectedRow.industria || 'Sin industria'}</p>
                      </div>
                    </div>

                    <div className="max-h-[500px] space-y-5 overflow-y-auto p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Backup</p>
                          <p className={`mt-2 text-4xl font-black ${getProgressTone(selectedRow.backupPct)}`}>{formatPercent(selectedRow.backupPct)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Migración</p>
                          <p className={`mt-2 text-4xl font-black ${getProgressTone(selectedRow.migracionPct)}`}>{formatPercent(selectedRow.migracionPct)}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><Database className="h-4 w-4" />Dirección: {selectedRow.direccion || 'Sin dirección'}</div>
                        <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Inicio: {formatDisplayDate(selectedRow.fechaInicio, selectedRow.fechaInicioISO)}</div>
                        <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Fin: {formatDisplayDate(selectedRow.fechaFin, selectedRow.fechaFinISO)}</div>
                        <div className="flex items-center gap-2"><Gauge className="h-4 w-4" />Duración: {selectedRow.duracionDias !== null ? `${selectedRow.duracionDias} días` : selectedRow.duracion || 'Pendiente'}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Estado</p>
                        <div className="mt-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(selectedRow.estado)}`}>
                            {selectedRow.estado || 'Sin estado'}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Notas</p>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{selectedRow.notas || 'Sin notas registradas.'}</p>
                      </div>
                    </div>
                  </section>
                ) : null}
              </aside>
            </div>
          </div>
        )}
      </section>

    </main>
  );
}
