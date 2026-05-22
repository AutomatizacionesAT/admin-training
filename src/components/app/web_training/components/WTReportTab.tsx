import type { WTReportData } from "../hooks/useWTReportData";
import type { TrainingRecord } from "../utils/utils";
import { WTCoordinatorDetailTable } from "./WTCoordinatorDetailTable";

const DIR_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-indigo-500 to-purple-400",
  "from-emerald-500 to-teal-400",
  "from-orange-500 to-amber-400",
];
const DIR_BG_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-indigo-50 text-indigo-600",
  "bg-emerald-50 text-emerald-600",
  "bg-orange-50 text-orange-600",
];

interface StatusCardProps {
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
  dotClass: string;
  iconPath: string;
  rotateClass?: string;
}

function StatusCard({
  label,
  value,
  colorClass,
  bgClass,
  dotClass,
  iconPath,
  rotateClass = "",
}: StatusCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${colorClass} p-8 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}
    >
      <div
        className={`absolute -left-6 -bottom-6 w-24 h-24 ${bgClass} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${dotClass} ${
              label === "Finalizados" || label === "En proceso"
                ? "animate-pulse"
                : ""
            }`}
          />
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </h4>
        </div>
        <span className="text-5xl font-black text-gray-800 tracking-tight">
          {value}
        </span>
      </div>
      <div
        className={`relative z-10 w-16 h-16 ${bgClass} rounded-2xl flex items-center justify-center shadow-inner ${rotateClass} transition-transform duration-300`}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d={iconPath}
          />
        </svg>
      </div>
    </div>
  );
}

const STATUS_CARDS: Omit<StatusCardProps, "value">[] = [
  {
    label: "Finalizados",
    colorClass: "border-emerald-100/50",
    bgClass: "bg-emerald-50 text-emerald-500",
    dotClass: "bg-emerald-500",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    rotateClass: "group-hover:rotate-12",
  },
  {
    label: "En proceso",
    colorClass: "border-amber-100/50",
    bgClass: "bg-amber-50 text-amber-500",
    dotClass: "bg-amber-500",
    iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    rotateClass: "group-hover:-rotate-12",
  },
  {
    label: "Proyectados",
    colorClass: "border-slate-100/50",
    bgClass: "bg-slate-50 text-slate-500",
    dotClass: "bg-slate-400",
    iconPath:
      "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
    rotateClass: "group-hover:scale-110",
  },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface WTReportTabProps {
  reportData: WTReportData;
  selectedCoordinador: string | null;
  onSelectCoordinador: (name: string | null) => void;
  data: TrainingRecord[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  selectedDireccion: string | null;
  setSelectedDireccion: (dir: string | null) => void;
  availableYears: number[];
  availableDirecciones: string[];
}

export function WTReportTab({
  reportData,
  selectedCoordinador,
  onSelectCoordinador,
  data,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDireccion,
  setSelectedDireccion,
  availableYears,
  availableDirecciones,
}: WTReportTabProps) {
  const statusValues = [
    reportData.finalizados,
    reportData.enProceso,
    reportData.proyectados,
  ];

  return (
    <div className="min-h-screen">
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Año
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none hover:border-blue-300 transition-colors cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Mes
          </label>
          <select
            value={selectedMonth === null ? "" : selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none hover:border-blue-300 transition-colors cursor-pointer"
          >
            <option value="">Todos los meses</option>
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Dirección
          </label>
          <select
            value={selectedDireccion === null ? "" : selectedDireccion}
            onChange={(e) =>
              setSelectedDireccion(
                e.target.value === "" ? null : e.target.value
              )
            }
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none hover:border-blue-300 transition-colors cursor-pointer"
          >
            <option value="">Todas las direcciones</option>
            {availableDirecciones.map((dir) => (
              <option key={dir} value={dir}>
                {dir}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Entrenamientos */}
        <div className="col-span-1 lg:col-span-4 relative overflow-hidden bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-60 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 flex items-center justify-between w-full mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              Base WT25
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Total Entrenamientos
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-7xl font-black text-transparent bg-clip-text bg-linear-to-br from-gray-900 to-gray-600 tracking-tight">
                {reportData.totalEntrenamientos}
              </p>
              <span className="text-lg font-medium text-gray-400">
                registros
              </span>
            </div>
          </div>
        </div>

        {/* Industrias */}
        <div className="col-span-1 lg:col-span-5 h-full">
          <div
            className="grid gap-4 h-full"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
          >
            {reportData.industrias.map((ind, idx) => (
              <div
                key={ind.nombre}
                className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div
                    className={`p-2 rounded-xl ${
                      DIR_BG_COLORS[idx % DIR_BG_COLORS.length]
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    {ind.porcentaje}%
                  </span>
                </div>
                <div>
                  <h4
                    className="text-sm font-semibold text-gray-600 mb-1 line-clamp-2 leading-tight"
                    title={ind.nombre}
                  >
                    {ind.nombre}
                  </h4>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-3xl font-black text-gray-800 tracking-tight">
                      {ind.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${
                        DIR_COLORS[idx % DIR_COLORS.length]
                      }`}
                      style={{ width: `${ind.porcentaje}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {reportData.industrias.length === 0 && (
              <div className="col-span-full flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-[1.5rem] border border-dashed border-gray-200 p-6 h-full min-h-[160px]">
                No hay industrias disponibles para el período seleccionado
              </div>
            )}
          </div>
        </div>

        {/* Coordinadores */}
        <div className="col-span-1 lg:col-span-3 lg:row-span-2 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6 flex flex-col lg:h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Coordinadores</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Entrenamientos por líder
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCoordinador && (
                <button
                  onClick={() => onSelectCoordinador(null)}
                  className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-3 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                  title="Ver global"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Limpiar
                </button>
              )}
              <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner">
                {reportData.coordinadores.length}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {reportData.coordinadores.map((coord, idx) => {
              const isSelected = selectedCoordinador === coord.nombre;
              return (
                <button
                  key={coord.nombre}
                  onClick={() =>
                    onSelectCoordinador(isSelected ? null : coord.nombre)
                  }
                  className={`w-full group flex items-center p-3 rounded-2xl transition-all duration-200 border text-left ${
                    isSelected
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "hover:bg-slate-50 border-transparent hover:border-slate-100 cursor-pointer"
                  }`}
                >
                  <div
                    className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm mr-3 transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-linear-to-br from-gray-100 to-gray-200 text-gray-600"
                    }`}
                  >
                    {coord.nombre.charAt(0).toUpperCase()}
                    {idx < 3 && (
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${
                          idx === 0
                            ? "bg-yellow-400 text-yellow-900"
                            : idx === 1
                            ? "bg-gray-300 text-gray-800"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        ⭐
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate text-sm transition-colors ${
                        isSelected
                          ? "text-blue-900"
                          : "text-gray-800 group-hover:text-blue-600"
                      }`}
                      title={coord.nombre}
                    >
                      {coord.nombre}
                    </p>
                  </div>
                  <div
                    className={`ml-2 flex-shrink-0 shadow-sm border px-3 py-1 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-100 group-hover:border-blue-100 group-hover:bg-blue-50 text-blue-600"
                    }`}
                  >
                    <span className="text-sm font-black">{coord.count}</span>
                  </div>
                </button>
              );
            })}
            {reportData.coordinadores.length === 0 && (
              <div className="text-center text-sm text-gray-400 mt-8">
                Sin coordinadores registrados
              </div>
            )}
          </div>
        </div>

        {/* Tarjetas de estado */}
        <div className="col-span-1 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUS_CARDS.map((card, idx) => (
            <StatusCard key={card.label} {...card} value={statusValues[idx]} />
          ))}
        </div>
      </div>

      {/* Tabla de detalle por coordinador */}
      {selectedCoordinador && (
        <WTCoordinatorDetailTable
          data={data}
          selectedCoordinador={selectedCoordinador}
        />
      )}
    </div>
  );
}
