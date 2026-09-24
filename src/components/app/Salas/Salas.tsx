import { useState, useEffect, useCallback } from 'react';
import { Building2, RefreshCw, AlertCircle, Loader2, Download, BarChart3, ShieldCheck, ClipboardList } from 'lucide-react';
import type { SalaRecord, AsignacionRecord } from './utils/types';
import { fetchSalasCatalogo, fetchSalasAsignaciones } from './utils/fetchData';
import { exportToExcel } from './utils/exportExcel';
import { useAuth } from '@/context/AuthContext';
import PublicView from './components/PublicView';
import CoordinadorView from './components/CoordinadorView';
import SuperAdminView from './components/SuperAdminView';
import UsabilidadCoordinadoresView from './components/UsabilidadCoordinadoresView';

type TimelineRequestPreset = {
  sala: SalaRecord;
  sede: string;
  horario: string;
  fechaInicial: string;
  fechaFin: string;
};

type SalasActiveView = 'general' | 'usabilidad' | 'coordinador' | 'superadmin';

export default function Salas() {
  const { salasUser } = useAuth();

  // ─── Data ─────────────────────────────────────────────────────────────────
  const [salas, setSalas] = useState<SalaRecord[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionRecord[]>([]);
  const [loading, setLoading] = useState(true);      // solo carga inicial
  const [refreshing, setRefreshing] = useState(false); // refresh silencioso
  const [isExporting, setIsExporting] = useState(false); // estado exportación Excel
  const [error, setError] = useState<string | null>(null);

  // ─── Roles ─────────────────────────────────────────────────────────────────
  const user = salasUser;
  const isSuperAdmin = user?.rol === 'SUPER_ADMIN';
  const isCoordinador = user?.rol === 'COORDINADOR';
  const [activeView, setActiveView] = useState<SalasActiveView>('general');
  const [timelinePreset, setTimelinePreset] = useState<TimelineRequestPreset | null>(null);

  useEffect(() => {
    setActiveView('general');
  }, [user?.documento]);

  useEffect(() => {
    if (activeView !== 'coordinador' && activeView !== 'superadmin') {
      setTimelinePreset(null);
    }
  }, [activeView]);

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [cat, asig] = await Promise.all([
        fetchSalasCatalogo(),
        fetchSalasAsignaciones(),
      ]);
      setSalas(cat);
      setAsignaciones(asig);
    } catch {
      setError('No se pudieron cargar los datos de Salas. Verifica que las hojas existen y son públicas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(salas, asignaciones);
    } catch (error) {
      console.error('Error exporting Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // onRefresh silencioso: no desmonta las vistas
  const onRefresh = useCallback(() => loadData(true), [loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Page Header */}
      <div className="bg-linear-to-r from-slate-800 via-slate-900 to-indigo-950 px-6 md:px-8 pt-6 pb-0 shadow-lg border-b border-slate-800 relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">Salas 2026</h1>
              <p className="text-slate-400 text-xs mt-1">
                {activeView === 'general' ? 'Vista general de salas, disponibilidad y cronograma' : activeView === 'usabilidad' ? 'Análisis de usabilidad y rendimiento de coordinadores' : isSuperAdmin ? 'Panel de control y gestión' : 'Seguimiento de solicitudes'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setActiveView(activeView === 'superadmin' ? 'general' : 'superadmin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeView === 'superadmin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-200 hover:text-white bg-white/5 hover:bg-white/10 border border-indigo-400/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                {activeView === 'superadmin' ? 'Volver a Salas' : 'Gestión Admin'}
              </button>
            )}

            {isCoordinador && (
              <button
                type="button"
                onClick={() => setActiveView(activeView === 'coordinador' ? 'general' : 'coordinador')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeView === 'coordinador'
                    ? 'bg-[#005082] text-white shadow-md'
                    : 'text-sky-200 hover:text-white bg-white/5 hover:bg-white/10 border border-sky-400/20'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-sky-300" />
                {activeView === 'coordinador' ? 'Volver a Salas' : 'Mis Solicitudes'}
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={handleExportExcel}
                disabled={loading || refreshing || isExporting}
                className="flex items-center gap-2 bg-[#F37021] hover:bg-[#d95f10] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                title="Descargar Formato Seguridad"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Descargar Formato Seguridad
              </button>
            )}

            <button
              onClick={() => loadData(false)}
              disabled={loading || refreshing || isExporting}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Elegant Underline Navigation Tabs */}
        <div className="flex items-center gap-8 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveView('general')}
            className={`flex items-center gap-2 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeView === 'general'
                ? 'border-[#F37021] text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeView === 'general' ? 'text-[#F37021]' : 'text-slate-400'}`} />
            Cronograma y Salas
          </button>

          <button
            type="button"
            onClick={() => setActiveView('usabilidad')}
            className={`flex items-center gap-2 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeView === 'usabilidad'
                ? 'border-[#F37021] text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeView === 'usabilidad' ? 'text-[#F37021]' : 'text-slate-400'}`} />
            Usabilidad y Coordinadores
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 py-5">

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Cargando salas...</p>
          </div>
        )}

        {/* Indicador de refresh silencioso — no desmonta las vistas */}
        {refreshing && (
          <div className="flex items-center gap-2 mb-4 text-indigo-400 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Actualizando datos...</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeView === 'general' && (
              <PublicView
                salas={salas}
                asignaciones={asignaciones}
                canSolicitar={!!user && (isCoordinador || isSuperAdmin)}
                canGestionar={!!user && isSuperAdmin}
                onSolicitar={() => {
                  setTimelinePreset(null);
                  setActiveView(isSuperAdmin ? 'superadmin' : 'coordinador');
                }}
                onGestionar={() => setActiveView('superadmin')}
                onTimelineRequest={(preset) => {
                  setTimelinePreset(preset);
                  setActiveView(isSuperAdmin ? 'superadmin' : 'coordinador');
                }}
              />
            )}
            {activeView === 'usabilidad' && (
              <UsabilidadCoordinadoresView
                salas={salas}
                asignaciones={asignaciones}
              />
            )}
            {activeView === 'superadmin' && isSuperAdmin && (
              <SuperAdminView
                user={user!}
                salas={salas}
                asignaciones={asignaciones}
                onRefresh={onRefresh}
                onBackToGeneral={() => setActiveView('general')}
                timelinePreset={timelinePreset}
              />
            )}
            {activeView === 'coordinador' && isCoordinador && (
              <CoordinadorView
                user={user!}
                salas={salas}
                asignaciones={asignaciones}
                onRefresh={onRefresh}
                onBackToGeneral={() => setActiveView('general')}
                timelinePreset={timelinePreset}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
