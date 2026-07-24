import { useState, useEffect, useCallback } from 'react';
import { Building2, RefreshCw, AlertCircle, Loader2, Download } from 'lucide-react';
import type { SalaRecord, AsignacionRecord } from './utils/types';
import { fetchSalasCatalogo, fetchSalasAsignaciones } from './utils/fetchData';
import { exportToExcel } from './utils/exportExcel';
import { useAuth } from '@/context/AuthContext';
import PublicView from './components/PublicView';
import CoordinadorView from './components/CoordinadorView';
import SuperAdminView from './components/SuperAdminView';

type TimelineRequestPreset = {
  sala: SalaRecord;
  sede: string;
  horario: string;
  fechaInicial: string;
  fechaFin: string;
};

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
  const [activeView, setActiveView] = useState<'general' | 'coordinador' | 'superadmin'>('general');
  const [timelinePreset, setTimelinePreset] = useState<TimelineRequestPreset | null>(null);

  useEffect(() => {
    setActiveView('general');
  }, [user?.documento]);

  useEffect(() => {
    if (activeView !== 'coordinador') {
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
      <div className="bg-linear-to-r from-slate-800 via-slate-900 to-indigo-950 px-6 md:px-8 py-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-300" />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Salas 2026</h1>
            </div>
            <p className="text-slate-400 text-sm">
              {activeView === 'general'
                ? 'Vista general de salas'
                : isSuperAdmin
                  ? '🔐 Vista Super Administrador — gestión y control'
                  : 'Vista de coordinador — solicitudes y seguimiento'
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={handleExportExcel}
                disabled={loading || refreshing || isExporting}
                className="flex items-center gap-2 bg-[#F37021] hover:bg-[#d95f10] text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 shadow-md"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Descargar Formato Seguridad
              </button>
            )}
            <button
              onClick={() => loadData(false)}
              disabled={loading || refreshing || isExporting}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 py-8">

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
