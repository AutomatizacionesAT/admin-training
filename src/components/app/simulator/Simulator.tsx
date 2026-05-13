import { useState } from "react";
import type { Tab } from "./types";
import { useSimulatorData } from "./hooks/useSimulatorData";
import { useReportData } from "./hooks/useReportData";
import { SimulatorHeader } from "./components/SimulatorHeader";
import { CalendarTab } from "./components/CalendarTab";
import { ReportTab } from "./components/ReportTab";
import { HelpModal } from "./components/HelpModal";

export default function Simulator() {
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [showHelp, setShowHelp] = useState(false);

  const { data, festivos, novedades, loading, error } = useSimulatorData();
  const {
    reportData,
    selectedCoordinador,
    setSelectedCoordinador,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedDireccion,
    setSelectedDireccion,
    availableYears,
    availableDirecciones,
    dateFilteredData
  } = useReportData(data);

  return (
    <div className="min-h-screen bg-gray-50/30 p-8 flex flex-col font-sans">
      <SimulatorHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === "calendar" && (
            <CalendarTab data={data} festivos={festivos} novedades={novedades} />
          )}

          {activeTab === "report" && (
            <ReportTab
              reportData={reportData}
              selectedCoordinador={selectedCoordinador}
              onSelectCoordinador={setSelectedCoordinador}
              data={dateFilteredData}
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

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
