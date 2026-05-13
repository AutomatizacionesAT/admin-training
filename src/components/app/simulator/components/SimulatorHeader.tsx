import type { Tab } from "../types";

interface SimulatorHeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TAB_ICON_CALENDAR =
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
const TAB_ICON_REPORT =
  "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z";

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "calendar", label: "Calendario", icon: TAB_ICON_CALENDAR },
  { key: "report", label: "Reporte", icon: TAB_ICON_REPORT },
];

export function SimulatorHeader({ activeTab, onTabChange }: SimulatorHeaderProps) {
  return (
    <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-[1.2rem] shadow-lg flex items-center justify-center text-white transform -rotate-6 hover:rotate-0 transition-transform duration-300">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Simulator</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Plataforma de gestión de simuladores</p>
        </div>
      </div>

      <nav className="flex bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 p-1.5 w-full lg:w-auto relative z-10">
        {tabs.map(({ key, label, icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center justify-center gap-2 flex-1 lg:flex-none lg:w-48 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
                isActive ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <svg className="w-5 h-5" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d={icon} />
              </svg>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
