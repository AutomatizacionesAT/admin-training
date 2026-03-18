import { useState, useMemo, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';

import type { ParsedRow, CampaignReport, ManualOverrides, DailyBreakdown, GlobalKpis } from './utils/types';
import { fetchControlDeAccesos, fetchCoordinadores } from './utils/fetchData';
import { getPercentage } from './utils/calculations';

export type SortField = 'campana' | 'porcentaje' | 'coordinador';
export type SortOrder = 'asc' | 'desc';

import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import CampaignCard from './components/CampaignCard';
import DetailModal from './components/DetailModal';

export default function UsabilidadWebTraining() {
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [manualOverrides, setManualOverrides] = useState<ManualOverrides>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [globalDiasMes, setGlobalDiasMes] = useState(19);
  const [globalDiasSemana, setGlobalDiasSemana] = useState(5);
  const [detailCampaign, setDetailCampaign] = useState<string | null>(null);
  const [coordinadoresList, setCoordinadoresList] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [sortField, setSortField] = useState<SortField>('porcentaje');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // ─── Data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [parsed, coords] = await Promise.all([
        fetchControlDeAccesos(),
        fetchCoordinadores()
      ]);
      setRawData(parsed);
      setCoordinadoresList(coords);

      if (parsed.length > 0) {
        const dates = parsed.map((r) => r.dateISO).sort();
        setFechaInicio(dates[0]);
        setFechaFin(dates[dates.length - 1]);
      }
    } catch {
      setError('No se pudieron cargar los datos. Verifica que la hoja esté compartida públicamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Computed reports ────────────────────────────────────────────────────────
  const reports = useMemo((): CampaignReport[] => {
    if (rawData.length === 0) return [];

    const filtered = rawData.filter((row) => {
      if (fechaInicio && row.dateISO < fechaInicio) return false;
      if (fechaFin && row.dateISO > fechaFin) return false;
      return true;
    });

    const campaignDailyUnique: Record<string, Set<string>> = {};
    filtered.forEach((row) => {
      const cardKey = `${row.campana} ${row.modulo}`;
      if (!campaignDailyUnique[cardKey]) campaignDailyUnique[cardKey] = new Set();
      if (row.usuario && row.dateISO) {
        campaignDailyUnique[cardKey].add(`${row.dateISO}|${row.usuario}`);
      }
    });

    const baseReports = Object.keys(campaignDailyUnique)
      .map((cardKey, index) => {
        const overrides = manualOverrides[cardKey] || {};
        return {
          id: `camp-${index}`,
          coordinador: overrides.coordinador ?? '',
          campana: cardKey,
          totalRacs: overrides.totalRacs ?? 0,
          diasHabilesMes: globalDiasMes,
          diasHabilesSemana: globalDiasSemana,
          totalIngresosRegistros:
            overrides.totalIngresosRegistros ?? campaignDailyUnique[cardKey]?.size ?? 0,
        };
      });

    return baseReports.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortField === 'porcentaje') {
        const semA = a.totalRacs * a.diasHabilesSemana;
        const semB = b.totalRacs * b.diasHabilesSemana;
        valA = getPercentage(a.totalIngresosRegistros, semA);
        valB = getPercentage(b.totalIngresosRegistros, semB);
      } else if (sortField === 'coordinador') {
        valA = a.coordinador.toLowerCase() || 'zzzz';
        valB = b.coordinador.toLowerCase() || 'zzzz';
      } else {
        valA = a.campana.toLowerCase();
        valB = b.campana.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawData, fechaInicio, fechaFin, manualOverrides, globalDiasMes, globalDiasSemana, sortField, sortOrder]);

  // ─── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo((): GlobalKpis => {
    let racs = 0, ingresosMes = 0, ingresosSemana = 0, registros = 0;
    reports.forEach((r) => {
      racs += r.totalRacs;
      ingresosMes += r.totalRacs * r.diasHabilesMes;
      ingresosSemana += r.totalRacs * r.diasHabilesSemana;
      registros += r.totalIngresosRegistros;
    });
    const globalPercentage =
      ingresosSemana === 0 ? 0 : Math.round((registros / ingresosSemana) * 100);
    return { racs, ingresosMes, ingresosSemana, registros, globalPercentage };
  }, [reports]);

  // ─── Daily breakdown for detail modal ────────────────────────────────────────
  const dailyBreakdown = useMemo((): DailyBreakdown[] => {
    if (!detailCampaign) return [];

    const filtered = rawData.filter((row) => {
      if (fechaInicio && row.dateISO < fechaInicio) return false;
      if (fechaFin && row.dateISO > fechaFin) return false;
      return `${row.campana} ${row.modulo}` === detailCampaign;
    });

    const byDate: Record<string, Set<string>> = {};
    filtered.forEach((row) => {
      if (!byDate[row.dateISO]) byDate[row.dateISO] = new Set();
      if (row.usuario) byDate[row.dateISO].add(row.usuario);
    });

    return Object.keys(byDate)
      .sort()
      .map((date) => ({
        date,
        usuarios: Array.from(byDate[date]).sort(),
        count: byDate[date].size,
      }));
  }, [detailCampaign, rawData, fechaInicio, fechaFin]);

  // ─── Field update handler ─────────────────────────────────────────────────────
  const handleUpdate = (id: string, field: keyof CampaignReport, value: string | number) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    setManualOverrides((prev) => ({
      ...prev,
      [report.campana]: { ...prev[report.campana], [field]: value },
    }));
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 flex flex-col font-sans text-slate-800">

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Dashboard de Usabilidad
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Análisis de rendimiento y métricas de campañas · CONTROL_DE_ACCESOS
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white font-semibold shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Actualizar datos'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && rawData.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Cargando datos desde Google Sheets...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && rawData.length === 0 && !error && (
        <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-24">
          <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">No hay datos disponibles</h3>
          <p className="text-slate-500 mt-2 max-w-md text-center">
            Asegúrate de que la hoja <b>CONTROL_DE_ACCESOS</b> esté compartida públicamente y tenga registros.
          </p>
        </div>
      )}

      {/* Dashboard */}
      {rawData.length > 0 && (
        <>
          {/* KPI Cards */}
          <KpiCards totalCampanas={reports.length} kpis={kpis} />

          <div className="flex flex-col gap-1 mt-4">
            {/* Filter Bar */}
            <FilterBar
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              globalDiasMes={globalDiasMes}
              globalDiasSemana={globalDiasSemana}
              totalRegistros={rawData.length}
              loading={loading}
              onFechaInicioChange={setFechaInicio}
              onFechaFinChange={setFechaFin}
              onDiasMesChange={setGlobalDiasMes}
              onDiasSemanaChange={setGlobalDiasSemana}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortFieldChange={setSortField}
              onSortOrderChange={setSortOrder}
              onRefresh={loadData}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />


            {/* Campaign Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {reports.map((report) => (
                <CampaignCard
                  key={report.id}
                  report={report}
                  coordinadoresList={coordinadoresList}
                  isCollapsed={isCollapsed}
                  onUpdate={handleUpdate}
                  onViewDetail={setDetailCampaign}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {detailCampaign && (
        <DetailModal
          campana={detailCampaign}
          breakdown={dailyBreakdown}
          onClose={() => setDetailCampaign(null)}
        />
      )}
    </div>
  );
}
