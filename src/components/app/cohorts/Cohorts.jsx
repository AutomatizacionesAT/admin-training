import { useEffect, useState } from "react";
import { fetchAllCohortData } from "./utils/utils";
import { useCohortData } from "./hooks/useCohortData";
import CohortKPICards from "./components/CohortKPICards";
import CohortFilters from "./components/CohortFilters";
import CohortTable from "./components/CohortTable";
import CohortResumenTab from "./components/CohortResumenTab";
import { RefreshCw, LayoutDashboard, Table2, Users } from "lucide-react";

const NAVY = "#1B365D";

/** @type {"resumen" | "tabla"} */
const TABS = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "tabla",   label: "Detalle",  icon: Table2 },
];

export default function Cohorts() {
  const [rawData, setRawData]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [lastUpdated, setLastUpdated] = useState(null);

  const {
    filters,
    setFilters,
    filteredData,
    kpis,
    byCampana,
    byIndicador,
    racPorCampana,
    availableAnios,
    availableCoordinadores,
    availableCampanas,
    availableDirecciones,
    availableIndicadores,
  } = useCohortData(rawData);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllCohortData();
      setRawData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError("No se pudieron cargar los datos. Verificá la conexión o que el Sheet sea público.");
      console.error("[COHORTS]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6 flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: NAVY }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: NAVY }}>
                Cohorts
              </h1>
              <p className="text-xs text-gray-400">
                Indicadores primeros 30 días
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && !loading && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Actualizado {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-[#1B365D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────── */}
      <CohortKPICards kpis={kpis} loading={loading} />

      {/* ── Filtros ─────────────────────────────────────────── */}
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
        />
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <nav className="flex space-x-1 p-1.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeTab === id
                      ? "bg-gradient-to-r from-[#1b355b] to-[#13253f] text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === "resumen" && (
            <CohortResumenTab
              byCampana={byCampana}
              byIndicador={byIndicador}
              racPorCampana={racPorCampana}
              filteredData={filteredData}
            />
          )}

          {activeTab === "tabla" && (
            <CohortTable data={filteredData} />
          )}
        </>
      )}

      {/* ── Loading skeleton ────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
        </div>
      )}
    </div>
  );
}
