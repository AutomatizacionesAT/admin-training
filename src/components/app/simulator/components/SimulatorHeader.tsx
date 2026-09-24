import type { Tab } from "../types";

interface SimulatorHeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function SimulatorHeader({ activeTab, onTabChange }: SimulatorHeaderProps) {
  return (
    <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100">
      <nav className="flex space-x-1 p-2">
        <button
          onClick={() => onTabChange("calendar")}
          className={`${
            activeTab === "calendar"
              ? "bg-gradient-to-r from-[#1b355b] to-[#13253f] text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
          } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 cursor-pointer`}
        >
          📅 Calendario
        </button>
        <button
          onClick={() => onTabChange("simuladores")}
          className={`${
            activeTab === "simuladores"
              ? "bg-gradient-to-r from-[#1b355b] to-[#13253f] text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
          } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 cursor-pointer`}
        >
          📊 Reporte Simuladores
        </button>
        <button
          onClick={() => onTabChange("campanas")}
          className={`${
            activeTab === "campanas"
              ? "bg-gradient-to-r from-[#1b355b] to-[#13253f] text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
          } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 cursor-pointer`}
        >
          📊 Reporte Campañas
        </button>
      </nav>
    </div>
  );
}
