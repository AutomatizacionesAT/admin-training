import { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Fingerprint, DatabaseBackup, Table2, LayoutList } from 'lucide-react';

import type { BiometricRow, BiometricKpis, ColaboradorSummary, ViewMode, SortField, SortOrder } from './utils/types';
import { fetchInformeBiometrico } from './utils/fetchData';

import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import BiometricTable from './components/BiometricTable';
import SummaryTable from './components/SummaryTable';

export default function InformeBiometrico() {
  const [rawData, setRawData] = useState<BiometricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [semanaSeleccionada, setSemanaSeleccionada] = useState('');
  const [colaboradorSearch, setColaboradorSearch] = useState('');
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState('');
  const [observacionFiltro, setObservacionFiltro] = useState('');

  // Vista
  const [viewMode, setViewMode] = useState<ViewMode>('resumen');

  // Ordenamiento (Tabla cruda)
  const [rawSortField, setRawSortField] = useState<SortField>('dateISO');
  const [rawSortOrder, setRawSortOrder] = useState<SortOrder>('desc');

  // Ordenamiento (Resumen)
  const [summarySortField, setSummarySortField] = useState<keyof ColaboradorSummary>('diasTrabajados');
  const [summarySortOrder, setSummarySortOrder] = useState<SortOrder>('desc');

  // ─── Data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const parsed = await fetchInformeBiometrico();
      setRawData(parsed);

      if (parsed.length > 0) {
        // Encontrar la fecha mínima y máxima para poblar el filtro inicial
        const dates = parsed.map((r) => r.dateISO).filter(Boolean).sort();
        if (dates.length > 0) {
          setFechaInicio(dates[0]);
          setFechaFin(dates[dates.length - 1]);
        }
      }
    } catch {
      setError('No se pudieron cargar los datos. Verifica que la hoja INFORME BIOMETRICO exista y el formato sea correcto.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listas para filtros dinámicos
  const { semanasDisponibles, colaboradoresList, observacionesDisponibles } = useMemo(() => {
    const sems = new Set<string>();
    const cols = new Set<string>();
    const obs = new Set<string>();

    rawData.forEach(r => {
      if (r.semana) sems.add(r.semana);
      if (r.colaborador) cols.add(r.colaborador);

      const obUpper = r.observacion?.toUpperCase() || '';
      if (obUpper && obUpper !== 'NINGUNO' && obUpper !== 'NO') {
        obs.add(obUpper);
      }
    });

    return {
      semanasDisponibles: Array.from(sems).sort((a, b) => Number(a) - Number(b)),
      colaboradoresList: Array.from(cols).sort(),
      observacionesDisponibles: Array.from(obs).sort()
    };
  }, [rawData]);

  // Data filtrada primaria
  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      // Por rango fechas
      if (fechaInicio && row.dateISO < fechaInicio) return false;
      if (fechaFin && row.dateISO > fechaFin) return false;

      // Select dropdowns
      if (semanaSeleccionada && row.semana !== semanaSeleccionada) return false;
      if (colaboradorSeleccionado && row.colaborador !== colaboradorSeleccionado) return false;

      // Filtrar observacion
      if (observacionFiltro) {
        const obsUpper = row.observacion?.toUpperCase() || '';
        if (observacionFiltro === '__SIN_NOVEDAD__') {
          if (obsUpper && obsUpper !== 'NINGUNO' && obsUpper !== 'NO') return false;
        } else {
          if (obsUpper !== observacionFiltro) return false;
        }
      }

      // Input busqueda (nombre o cc)
      if (colaboradorSearch) {
        const term = colaboradorSearch.toLowerCase();
        if (!row.colaborador.toLowerCase().includes(term) && !row.cc.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [rawData, fechaInicio, fechaFin, semanaSeleccionada, colaboradorSearch, colaboradorSeleccionado, observacionFiltro]);

  // Data cruda ordenada para vista "tabla"
  const sortedRawData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const field = rawSortField;
      if (a[field] < b[field]) return rawSortOrder === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return rawSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, rawSortField, rawSortOrder]);

  // ─── Resumen generado agrupado por Colaorador (Para la vista "resumen") ─────
  const summaryData = useMemo(() => {
    const byUser: Record<string, ColaboradorSummary> = {};

    // Obtener la fecha de hoy en formato YYYY-MM-DD
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const todayISO = `${d.getFullYear()}-${mm}-${dd}`;

    filteredData.forEach(row => {
      const id = row.cc || row.colaborador;
      if (!byUser[id]) {
        byUser[id] = {
          colaborador: row.colaborador,
          cc: row.cc,
          diasRegistrados: 0,
          diasTrabajados: 0,
          llegadasTarde: 0,
          ausencias: 0,
          totalHoras: 0,
          promedioHoras: 0,
          observaciones: []
        };
      }

      const user = byUser[id];
      user.diasRegistrados++;

      // Validar si cuenta como trabajado (tener horas o no tener novedad excluyente)
      const obsUpper = row.observacion.toUpperCase();
      let esNovedad = false;

      if (obsUpper && obsUpper !== 'NINGUNO' && obsUpper !== 'NO') {
        if (!user.observaciones.includes(obsUpper)) user.observaciones.push(obsUpper);

        if (obsUpper.includes('TARDE')) {
          user.llegadasTarde++;
        }
        if (obsUpper.includes('VACACION') || obsUpper.includes('HOME OFFICE') || obsUpper.includes('INCAPACIDAD') || obsUpper.includes('AUSENCIA') || obsUpper.includes('PERMISO')) {
          user.ausencias++;
          esNovedad = true;
        }
      }

      // Solo contar como posible día a devengar si la fecha de la fila ya pasó (dateISO <= todayISO)
      if (row.dateISO <= todayISO) {
        if (row.horasDecimal > 0 || !esNovedad) {
          user.diasTrabajados++;
        }
      }
      user.totalHoras += row.horasDecimal;
    });

    Object.values(byUser).forEach(u => {
      u.promedioHoras = u.diasTrabajados > 0 ? (u.totalHoras / u.diasTrabajados) : 0;
    });

    const arr = Object.values(byUser);

    // Sort summary
    return arr.sort((a, b) => {
      const field = summarySortField;
      if (a[field] < b[field]) return summarySortOrder === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return summarySortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  }, [filteredData, summarySortField, summarySortOrder]);

  // Nombres de los colaboradores que ingresaron tarde (> 9:00 AM) en el set de datos filtrados
  const colaboradoresIngresoTarde = useMemo(() => {
    const tardeCount: Record<string, number> = {};
    filteredData.forEach(row => {
      if (!row.ingreso) return;
      const parts = row.ingreso.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const decimalIngreso = h + (m / 60);
        if (decimalIngreso > 9.0) {
          tardeCount[row.colaborador] = (tardeCount[row.colaborador] || 0) + 1;
        }
      }
    });

    return Object.entries(tardeCount)
      .map(([nombre, count]) => {
        const nombreTruncado = nombre.split(' ').filter(Boolean).slice(0, 3).join(' ');
        return { nombreOriginal: nombre, nombreTruncado, count };
      })
      .sort((a, b) => b.count - a.count || a.nombreOriginal.localeCompare(b.nombreOriginal));
  }, [filteredData]);


  // ─── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo((): BiometricKpis => {
    let totalLlegadasTarde = 0;
    let totalAusencias = 0;
    let sumaTotalHoras = 0;
    let sumaDiasTrab = 0;

    summaryData.forEach((s) => {
      totalLlegadasTarde += s.llegadasTarde;
      totalAusencias += s.ausencias;
      sumaTotalHoras += s.totalHoras;
      sumaDiasTrab += s.diasTrabajados;
    });

    const promedio = sumaDiasTrab > 0 ? (sumaTotalHoras / sumaDiasTrab) : 0;

    return {
      totalColaboradores: summaryData.length,
      totalRegistros: filteredData.length,
      totalLlegadasTarde,
      totalAusencias,
      promedioHorasDiarias: promedio,
      totalHorasTrabajadas: sumaTotalHoras
    };
  }, [summaryData, filteredData.length]);


  // Funciones helpers
  const handleLimpiarFiltros = () => {
    setSemanaSeleccionada('');
    setColaboradorSearch('');
    setColaboradorSeleccionado('');
    setObservacionFiltro('');
  };

  const handleRawSort = (field: SortField) => {
    if (rawSortField === field) setRawSortOrder(rawSortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setRawSortField(field);
      setRawSortOrder('asc');
    }
  };

  const handleSummarySort = (field: keyof ColaboradorSummary) => {
    if (summarySortField === field) setSummarySortOrder(summarySortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSummarySortField(field);
      setSummarySortOrder('desc'); // Por defecto los numéricos es mejor descendente
    }
  };

  // ─── Render ───
  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8 flex flex-col font-sans text-slate-800">

      {/* Header con gradiente premium */}
      <div className="bg-linear-to-r from-blue-800 via-indigo-700 to-indigo-900 -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 p-6 pb-12 md:p-8 md:pb-16 shadow-inner relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <Fingerprint className="w-7 h-7 text-blue-100" />
              </div>
              Control Biométrico
            </h1>
            <p className="text-sm text-blue-100 mt-2 font-medium opacity-90 max-w-xl">
              Monitor analítico de asistencia, horarios y validación de novedades del personal
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading && rawData.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Cargando registros biométricos...</p>
        </div>
      )}

      {!loading && rawData.length === 0 && !error && (
        <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-24">
          <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <DatabaseBackup className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">Sin datos de asistencia</h3>
          <p className="text-slate-500 mt-2 max-w-md text-center">
            Verifica la conexión con la hoja INFORME BIOMETRICO.
          </p>
        </div>
      )}

      {rawData.length > 0 && (
        <div className="flex flex-col relative z-20 -mt-10 md:-mt-14">
          <KpiCards kpis={kpis} />

          <FilterBar
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            semana={semanaSeleccionada}
            semanasDisponibles={semanasDisponibles}
            colaboradorSearch={colaboradorSearch}
            colaboradorSeleccionado={colaboradorSeleccionado}
            colaboradoresList={colaboradoresList}
            observacionFiltro={observacionFiltro}
            observacionesDisponibles={observacionesDisponibles}
            totalRegistros={rawData.length}
            totalFiltrados={filteredData.length}
            loading={loading}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
            onSemanaChange={setSemanaSeleccionada}
            onColaboradorSearchChange={setColaboradorSearch}
            onColaboradorSeleccionadoChange={setColaboradorSeleccionado}
            onObservacionFiltroChange={setObservacionFiltro}
            onLimpiarFiltros={handleLimpiarFiltros}
            onRefresh={loadData}
          />

          {/* Tags de ingresos > 9:00 AM */}
          {colaboradoresIngresoTarde.length > 0 && (
            <div className="mb-4 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-slate-400" />
                Tardanzas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {colaboradoresIngresoTarde.map(c => (
                  <span key={c.nombreOriginal} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-slate-500 text-[9px] font-medium border border-slate-200 shadow-sm transition-all hover:bg-slate-100">
                    <span className="truncate max-w-[120px]" title={c.nombreOriginal}>{c.nombreTruncado}</span>
                    <span className="bg-slate-100 text-slate-400 rounded px-1 py-px text-[8px] font-bold">
                      {c.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* View Toggles */}
          <div className="flex items-center gap-2 mb-4 bg-white p-1.5 rounded-xl shadow border border-slate-200 self-start">
            <button
              onClick={() => setViewMode('resumen')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'resumen' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
            >
              <LayoutList className="w-4 h-4" />
              Consolidado
            </button>
            <button
              onClick={() => setViewMode('tabla')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'tabla' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              <Table2 className="w-4 h-4" />
              Vista Detallada (Log)
            </button>
          </div>

          {/* Tables */}
          <div className="flex-1">
            {viewMode === 'resumen' ? (
              <SummaryTable
                data={summaryData}
                sortField={summarySortField}
                sortOrder={summarySortOrder}
                onSort={handleSummarySort}
              />
            ) : (
              <BiometricTable
                data={sortedRawData}
                sortField={rawSortField}
                sortOrder={rawSortOrder}
                onSort={handleRawSort}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
