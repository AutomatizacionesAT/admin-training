import { useEffect, useState, useMemo } from "react";
import { fetchAllCohortData, matchCoordinatorName, type CohortRecord } from "./utils/utils";
import { useCohortData } from "./hooks/useCohortData";
import CohortFilters from "./components/CohortFilters";
import CohortTable from "./components/CohortTable";
import CohortResumenTab from "./components/CohortResumenTab";
import CohortReportModal from "./components/CohortReportModal";
import GlobalLoginModal from "@/components/web/GlobalLoginModal";
import { useAuth } from "@/context/AuthContext";
import { RefreshCw, AlertCircle, ShieldCheck, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function Cohorts() {
  const { isAuthenticated, isSuperAdmin, isCoordinador, salasUser, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [rawData, setRawData] = useState<CohortRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resumen" | "tabla">("resumen");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Lista temporal de coordinadores extraídos del rawData para el matcher
  const allCoordinadorNames = useMemo(() => {
    const s = new Set<string>();
    rawData.forEach((r) => {
      const v = r.coordinador?.trim() || r.sheetName?.trim();
      if (v) s.add(v);
    });
    return Array.from(s);
  }, [rawData]);

  // Si el usuario es un Coordinador, cruzar su nombre y bloquear la vista
  const lockedCoordinador = useMemo(() => {
    if (isCoordinador && salasUser?.nombre) {
      const matched = matchCoordinatorName(salasUser.nombre, allCoordinadorNames);
      return matched || salasUser.nombre.split(" ").slice(0, 2).join(" ");
    }
    return null;
  }, [isCoordinador, salasUser?.nombre, allCoordinadorNames]);

  const {
    filters,
    setFilters,
    filteredData,
    kpis,
    byCampana,
    byIndicador,
    racPorCampana,
    byCoordinador,
    byFormador,
    stagesEvolution,
    availableAnios,
    availableCoordinadores,
    availableCampanas,
    availableDirecciones,
    availableIndicadores,
  } = useCohortData(rawData, lockedCoordinador);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllCohortData();
      setRawData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        "No se pudieron cargar los datos de Google Sheets. Verificá la conexión o los permisos de la hoja."
      );
      console.error("[COHORTS]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoginSuccess = (input: any) => {
    const ok = login(input);
    if (ok) {
      toast.success("Sesión iniciada", {
        description: "Acceso concedido al módulo de Cohortes.",
      });
      setShowLoginModal(false);
    }
    return ok;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-sans">
      {/* ── Banner de Rol / Estado de Autenticación ───────────────────── */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a355b] px-3.5 py-1 text-xs font-bold text-amber-300 shadow-xs border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Super Admin — Visualización Global Completa</span>
              </span>
            ) : isCoordinador ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-blue-900 border border-blue-200">
                <Lock className="w-3.5 h-3.5 text-blue-700" />
                <span>Vista de Coordinador: <strong>{lockedCoordinador ?? salasUser?.nombre}</strong></span>
              </span>
            ) : null
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Modo Consulta Pública. Para filtrar por tu asignación, inicia sesión.</span>
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="font-bold text-[#F37021] hover:underline cursor-pointer flex items-center gap-1 ml-1"
              >
                <LogIn className="w-3 h-3" />
                Iniciar Sesión
              </button>
            </div>
          )}
        </div>

        {/* Pestañas de Vista */}
        <div className="flex items-center gap-2 bg-white/80 p-1 rounded-xl border border-gray-200/80 shadow-2xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab("resumen")}
            className={`${activeTab === "resumen"
              ? "bg-gradient-to-r from-[#1b355b] to-[#13253f] text-white shadow-md font-bold"
              : "text-gray-600 hover:bg-gray-100 font-medium"
              } py-2 px-5 rounded-lg text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5`}
          >
            📊 Reporte
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tabla")}
            className={`${activeTab === "tabla"
              ? "bg-gradient-to-r from-[#1b355b] to-[#13253f] text-white shadow-md font-bold"
              : "text-gray-600 hover:bg-gray-100 font-medium"
              } py-2 px-5 rounded-lg text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5`}
          >
            📋 Detalle
          </button>
        </div>
      </div>

      {/* ── Barra de Filtros ──────────────────────────────────────── */}
      {!loading && (
        <CohortFilters
          filters={filters}
          onChange={setFilters}
          availableAnios={availableAnios}
          availableCoordinadores={availableCoordinadores}
          availableCampanas={availableCampanas}
          availableDirecciones={availableDirecciones}
          availableIndicadores={availableIndicadores}
          totalFiltered={filteredData.length}
          totalAll={rawData.length}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          lockedCoordinador={lockedCoordinador}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* ── Estado de Carga ───────────────────────────────────────── */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-[#1a355b] mb-4"></div>
          <p className="text-sm font-semibold text-gray-600">Cargando datos de Cohortes...</p>
          <p className="text-xs text-gray-400 mt-1">Consultando registros en Google Sheets</p>
        </div>
      )}

      {/* ── Mensaje de Error ──────────────────────────────────────── */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Error al cargar datos</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Contenido Principal de Pestañas ───────────────────────── */}
      {!loading && !error && (
        <>
          {activeTab === "resumen" && (
            <CohortResumenTab
              kpis={kpis}
              racPorCampana={racPorCampana}
              byCampana={byCampana}
              byIndicador={byIndicador}
              byCoordinador={byCoordinador}
              byFormador={byFormador}
              stagesEvolution={stagesEvolution}
              filteredData={filteredData}
              selectedCoordinador={filters.coordinador}
              onSelectCoordinador={(coord) => {
                if (!lockedCoordinador) {
                  setFilters((prev: any) => ({ ...prev, coordinador: coord }));
                }
              }}
              selectedCampana={filters.campana}
              onSelectCampana={(campana) =>
                setFilters((prev: any) => ({ ...prev, campana }))
              }
            />
          )}

          {activeTab === "tabla" && <CohortTable data={filteredData} />}

          {/* ── Modal de Informe Ejecutivo ─────────────────────────────── */}
          <CohortReportModal
            open={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            filters={filters}
            kpis={kpis}
            racPorCampana={racPorCampana}
            byIndicador={byIndicador}
            byCoordinador={byCoordinador}
            byFormador={byFormador}
            filteredData={filteredData}
          />
        </>
      )}

      {/* ── Footer con Info de Sincronización ─────────────────────── */}
      {!loading && (
        <div className="mt-8 flex items-center justify-between text-xs text-gray-400 border-t border-gray-200/60 pt-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Módulo Cohorts — Primeros 30 días</span>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span>
                Actualizado {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 hover:text-[#1a355b] transition-colors cursor-pointer font-medium"
              title="Recargar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Recargar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Login */}
      {showLoginModal && (
        <GlobalLoginModal
          onLogin={handleLoginSuccess}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
