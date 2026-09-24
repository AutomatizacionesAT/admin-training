import { useState, useMemo } from "react";
import type { Tab } from "./types";
import { useSimulatorData } from "./hooks/useSimulatorData";
import { SimulatorHeader } from "./components/SimulatorHeader";
import SimulatorTimeline from "./components/SimulatorTimeline";
import SimulatorReportTab from "./components/SimulatorReportTab";
import SimulatorCampaignsTab from "./components/SimulatorCampaignsTab";
import { parseDateString } from "./utils/utils";

export default function Simulator() {
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const { data, festivos, novedades, loading, error } = useSimulatorData();

  // Filtros globales para los reportes (null = Todos los años / Histórico)
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDireccion, setSelectedDireccion] = useState<string | null>(null);

  // Años disponibles a partir de la data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());

    data.forEach((r) => {
      const d = parseDateString(r.fechaInicio);
      if (d && !isNaN(d.getTime())) {
        yearsSet.add(d.getFullYear());
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [data]);

  // Direcciones disponibles a partir de la data
  const availableDirecciones = useMemo(() => {
    const dirSet = new Set<string>();
    data.forEach((r) => {
      if (r.direccion && r.direccion.trim()) {
        dirSet.add(r.direccion.trim());
      }
    });
    return Array.from(dirSet).sort();
  }, [data]);

  return (
    <div className="p-8 flex flex-col font-sans">
      <SimulatorHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {loading && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">Cargando datos de Simuladores...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Pestaña 1: Calendario (Timeline Gantt) */}
          {activeTab === "calendar" && (
            <SimulatorTimeline
              data={data}
              festivos={festivos}
              novedades={novedades}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
            />
          )}

          {/* Pestaña 2: Reporte Simuladores */}
          {activeTab === "simuladores" && (
            <SimulatorReportTab
              data={data}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedDireccion={selectedDireccion}
              setSelectedDireccion={setSelectedDireccion}
              availableYears={availableYears}
              availableDirecciones={availableDirecciones}
            />
          )}

          {/* Pestaña 3: Reporte Campañas */}
          {activeTab === "campanas" && (
            <SimulatorCampaignsTab
              data={data}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedDireccion={selectedDireccion}
              setSelectedDireccion={setSelectedDireccion}
              availableYears={availableYears}
              availableDirecciones={availableDirecciones}
            />
          )}
        </>
      )}
    </div>
  );
}
