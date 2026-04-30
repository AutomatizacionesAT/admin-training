import { useEffect, useState } from "react";
import {
  fetchGoogleSheetData,
  fetchSheetFestivosData,
  fetchSheetNovedades,
} from "./utils/utils";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "./utils/utils";
import Calendar from "./Calendar";
import {
  format,
  parseISO,
  isWithinInterval,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

type Tab = "calendar" | "report";

export default function Simulator() {
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [festivos, setFestivos] = useState<FestivoRecord[]>([]);
  const [novedades, setNovedades] = useState<NovedadesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedCoordinador, setSelectedCoordinador] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [records, festivosData, novedadesData] = await Promise.all([
          fetchGoogleSheetData(),
          fetchSheetFestivosData(),
          fetchSheetNovedades(),
        ]);
        setData(records);
        setFestivos(festivosData);
        setNovedades(novedadesData);
        setError(null);
      } catch (err) {
        setError("Error al cargar los datos de Google Sheets");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para obtener eventos activos en una fecha específica
  const getEventsForDate = (date: Date): TrainingRecord[] => {
    return data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin) return false;

      try {
        let startDate: Date;
        let endDate: Date;

        if (record.fechaInicio.includes("Date(")) {
          const startMatch = record.fechaInicio.match(
            /Date\((\d+),(\d+),(\d+)\)/
          );
          if (startMatch) {
            startDate = new Date(
              parseInt(startMatch[1]),
              parseInt(startMatch[2]),
              parseInt(startMatch[3])
            );
          } else {
            return false;
          }
        } else {
          startDate = parseISO(record.fechaInicio);
        }

        if (record.fechaFin.includes("Date(")) {
          const endMatch = record.fechaFin.match(/Date\((\d+),(\d+),(\d+)\)/);
          if (endMatch) {
            endDate = new Date(
              parseInt(endMatch[1]),
              parseInt(endMatch[2]),
              parseInt(endMatch[3])
            );
          } else {
            return false;
          }
        } else {
          endDate = parseISO(record.fechaFin);
        }

        return isWithinInterval(date, { start: startDate, end: endDate });
      } catch (error) {
        console.error("Error parseando fecha:", error, record);
        return false;
      }
    });
  };

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  }).filter((day) => day.getDay() !== 0);

  // Obtener todas las campañas activas en el mes actual
  const getActiveCampaignsInMonth = (): {
    campana: string;
    count: number;
    desarrolladores: Set<string>;
  }[] => {
    const campaignsMap = new Map<
      string,
      { count: number; desarrolladores: Set<string> }
    >();

    days.forEach((day) => {
      if (isSameMonth(day, currentMonth)) {
        const events = getEventsForDate(day);
        events.forEach((event) => {
          if (event.campana) {
            if (!campaignsMap.has(event.campana)) {
              campaignsMap.set(event.campana, {
                count: 0,
                desarrolladores: new Set(),
              });
            }
            const campaignData = campaignsMap.get(event.campana)!;
            campaignData.count++;
            if (event.desarrollador) {
              campaignData.desarrolladores.add(event.desarrollador);
            }
          }
        });
      }
    });

    return Array.from(campaignsMap.entries()).map(
      ([campana, { count, desarrolladores }]) => ({
        campana,
        count,
        desarrolladores,
      })
    );
  };

  const activeCampaigns = getActiveCampaignsInMonth();

  // Funciones para la pestaña de Reporte Gerencial
  const getReportData = () => {
    // 1. Calcular Coordinadores basados en TODA la data (para no perder la lista al filtrar)
    const coordinadoresMap = new Map<string, number>();
    data.forEach((record) => {
      const coord = record.coordinador || "Sin Asignar";
      coordinadoresMap.set(coord, (coordinadoresMap.get(coord) || 0) + 1);
    });
    const coordinadores = Array.from(coordinadoresMap.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);

    // 2. Filtrar data por el coordinador seleccionado (si lo hay)
    const filteredData = selectedCoordinador 
      ? data.filter(record => (record.coordinador || "Sin Asignar") === selectedCoordinador)
      : data;

    const totalSimuladores = filteredData.length;

    // 3. Calcular Direcciones y Estados basados en la data FILTRADA
    const direccionesMap = new Map<string, number>();
    let finalizados = 0;
    let enProceso = 0;
    let proyectados = 0;

    filteredData.forEach((record) => {
      // Direcciones
      const dir = record.direccion || "Sin Asignar";
      direccionesMap.set(dir, (direccionesMap.get(dir) || 0) + 1);

      // Estados
      const estado = record.estado?.toUpperCase() || "";
      if (estado === "FINALIZADA") {
        finalizados++;
      } else if (estado === "EN PROCESO") {
        enProceso++;
      } else if (estado === "SIN INICIAR") {
        proyectados++;
      }
    });

    const direcciones = Array.from(direccionesMap.entries())
      .map(([nombre, count]) => ({
        nombre,
        count,
        porcentaje: totalSimuladores > 0 ? ((count / totalSimuladores) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSimuladores,
      direcciones,
      coordinadores,
      finalizados,
      enProceso,
      proyectados,
    };
  };
  const reportData = getReportData();

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";

    try {
      if (dateString.includes("Date(")) {
        const match = dateString.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (match) {
          const date = new Date(
            parseInt(match[1]),
            parseInt(match[2]),
            parseInt(match[3])
          );
          return format(date, "dd/MM/yyyy", { locale: es });
        }
      } else {
        const date = parseISO(dateString);
        return format(date, "dd/MM/yyyy", { locale: es });
      }
    } catch (error) {
      console.error("Error al formatear fecha:", error);
    }

    return dateString;
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-8 flex flex-col font-sans">
      {/* Encabezado y Sistema de Pestañas */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-[1.2rem] shadow-lg flex items-center justify-center text-white transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Simulator
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Plataforma de gestión de simuladores</p>
          </div>
        </div>

        <nav className="flex bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 p-1.5 w-full lg:w-auto relative z-10">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center justify-center gap-2 flex-1 lg:flex-none lg:w-48 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === "calendar"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <svg className="w-5 h-5" fill={activeTab === "calendar" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === "calendar" ? 0 : 2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendario
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex items-center justify-center gap-2 flex-1 lg:flex-none lg:w-48 py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === "report"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <svg className="w-5 h-5" fill={activeTab === "report" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === "report" ? 0 : 2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reporte
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
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
          {/* Pestaña de Calendario */}
          {activeTab === "calendar" && (
            <>
              <div className="flex-1 bg-white rounded-xl shadow-xl p-8 overflow-hidden h-dvh border border-gray-100">
                <Calendar
                  data={data}
                  festivos={festivos}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  novedades={novedades}
                />
              </div>

              {/* Panel de información */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campañas activas en el mes */}
                <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Campañas Activas en{" "}
                    {format(currentMonth, "MMMM", { locale: es })}
                  </h3>
                  {activeCampaigns.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {activeCampaigns.map(
                        ({ campana, count, desarrolladores }) => (
                          <div
                            key={campana}
                            className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md border border-blue-100 hover:bg-white transition-all hover:shadow-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-bold text-blue-900 text-sm mb-1">
                                  {campana}
                                </p>
                                <div className="flex gap-3 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    📁 {count} proceso{count !== 1 ? "s" : ""}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    👥 {desarrolladores.size} dev
                                    {desarrolladores.size !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/90 rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">
                        No hay campañas activas este mes
                      </p>
                    </div>
                  )}
                </div>

                {/* Información del día seleccionado */}
                <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Día Seleccionado
                  </h3>
                  {selectedDay ? (
                    <div className="space-y-3">
                      <div className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md">
                        <p className="font-bold text-purple-900 mb-3 text-lg">
                          {format(selectedDay, "EEEE, d 'de' MMMM", {
                            locale: es,
                          })}
                        </p>
                        {getEventsForDate(selectedDay).length > 0 ? (
                          <>
                            <div className="mb-3 px-3 py-2 bg-purple-100 rounded-lg">
                              <p className="text-sm font-semibold text-purple-900">
                                {getEventsForDate(selectedDay).length} proceso
                                {getEventsForDate(selectedDay).length !== 1
                                  ? "s"
                                  : ""}{" "}
                                activo
                                {getEventsForDate(selectedDay).length !== 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                              {getEventsForDate(selectedDay)
                                .slice(0, 5)
                                .map((event, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs bg-linear-to-r from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-100"
                                  >
                                    <span className="font-bold text-purple-900">
                                      {event.campana}
                                    </span>
                                    <span className="text-gray-600">
                                      {" "}
                                      - {event.nombreProceso}
                                    </span>
                                  </div>
                                ))}
                              {getEventsForDate(selectedDay).length > 5 && (
                                <p className="text-xs text-purple-700 text-center font-semibold bg-purple-100 rounded py-1">
                                  +{getEventsForDate(selectedDay).length - 5}{" "}
                                  más...
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-600 text-center py-2">
                            Sin procesos activos este día
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/90 rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">
                        Haz clic en un día del calendario para ver su
                        información
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Pestaña de Reporte Gerencial */}
          {activeTab === "report" && (
            <div className="min-h-screen">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* TOTAL SIMULADORES */}
                <div className="col-span-1 lg:col-span-4 relative overflow-hidden bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
                  
                  <div className="relative z-10 flex items-center justify-between w-full mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Base SM25</span>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Simuladores</h3>
                    <div className="flex items-baseline gap-2">
                      <p className="text-7xl font-black text-transparent bg-clip-text bg-linear-to-br from-gray-900 to-gray-600 tracking-tight">
                        {reportData.totalSimuladores}
                      </p>
                      <span className="text-lg font-medium text-gray-400">registros</span>
                    </div>
                  </div>
                </div>

                {/* 4 Direcciones (2x2 grid inside a col-span-5) */}
                <div className="col-span-1 lg:col-span-5 grid grid-cols-2 gap-5">
                   {reportData.direcciones.slice(0, 4).map((dir, idx) => {
                      const colors = [
                        "from-blue-500 to-cyan-400",
                        "from-indigo-500 to-purple-400",
                        "from-emerald-500 to-teal-400",
                        "from-orange-500 to-amber-400"
                      ];
                      const bgColors = [
                        "bg-blue-50 text-blue-600",
                        "bg-indigo-50 text-indigo-600",
                        "bg-emerald-50 text-emerald-600",
                        "bg-orange-50 text-orange-600"
                      ];
                      return (
                        <div key={dir.nombre} className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                           <div className="flex justify-between items-start mb-4">
                             <div className={`p-2 rounded-xl ${bgColors[idx % 4]}`}>
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                               </svg>
                             </div>
                             <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                               {dir.porcentaje}%
                             </span>
                           </div>
                           
                           <div>
                             <h4 className="text-sm font-semibold text-gray-600 mb-1 line-clamp-1" title={dir.nombre}>{dir.nombre}</h4>
                             <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-gray-800 tracking-tight">{dir.count}</span>
                             </div>
                             {/* Progress bar */}
                             <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
                                <div className={`h-full rounded-full bg-linear-to-r ${colors[idx % 4]}`} style={{ width: `${dir.porcentaje}%` }}></div>
                             </div>
                           </div>
                        </div>
                      )
                   })}
                   {reportData.direcciones.length === 0 && (
                      <div className="col-span-2 flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-[1.5rem] border border-dashed border-gray-200 p-6">
                        No hay direcciones disponibles
                      </div>
                   )}
                </div>

                {/* Coordinadores */}
                <div className="col-span-1 lg:col-span-3 lg:row-span-2 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6 flex flex-col lg:h-[600px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Coordinadores</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">Simuladores por líder</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCoordinador && (
                          <button
                            onClick={() => setSelectedCoordinador(null)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-3 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                            title="Ver global"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar
                          </button>
                        )}
                        <div className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner">
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
                              onClick={() => setSelectedCoordinador(isSelected ? null : coord.nombre)}
                              className={`w-full group flex items-center p-3 rounded-2xl transition-all duration-200 border text-left ${
                                isSelected 
                                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                  : 'hover:bg-slate-50 border-transparent hover:border-slate-100 cursor-pointer'
                              }`}
                            >
                               <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm mr-3 transition-colors ${
                                 isSelected ? 'bg-indigo-600 text-white' : 'bg-linear-to-br from-gray-100 to-gray-200 text-gray-600'
                               }`}>
                                  {coord.nombre.charAt(0).toUpperCase()}
                                  {idx < 3 && (
                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-800' : 'bg-amber-600 text-white'}`}>
                                      ⭐
                                    </div>
                                  )}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className={`font-semibold truncate text-sm transition-colors ${
                                   isSelected ? 'text-indigo-900' : 'text-gray-800 group-hover:text-indigo-600'
                                 }`} title={coord.nombre}>
                                   {coord.nombre}
                                 </p>
                               </div>
                               <div className={`ml-2 flex-shrink-0 shadow-sm border px-3 py-1 rounded-xl transition-colors ${
                                 isSelected 
                                   ? 'bg-indigo-600 border-indigo-600 text-white' 
                                   : 'bg-white border-gray-100 group-hover:border-indigo-100 group-hover:bg-indigo-50 text-indigo-600'
                               }`}>
                                 <span className="text-sm font-black">{coord.count}</span>
                               </div>
                            </button>
                          );
                       })}
                       {reportData.coordinadores.length === 0 && (
                          <div className="text-center text-sm text-gray-400 mt-8">Sin líderes registrados</div>
                       )}
                    </div>
                </div>

                {/* Estados */}
                <div className="col-span-1 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Finalizados */}
                    <div className="relative overflow-hidden bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100/50 p-8 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                       <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                       <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                           <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Finalizados</h4>
                         </div>
                         <span className="text-5xl font-black text-gray-800 tracking-tight">{reportData.finalizados}</span>
                       </div>
                       <div className="relative z-10 w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:rotate-12 transition-transform duration-300">
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                    </div>

                    {/* En proceso */}
                    <div className="relative overflow-hidden bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100/50 p-8 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                       <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                       <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                           <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">En proceso</h4>
                         </div>
                         <span className="text-5xl font-black text-gray-800 tracking-tight">{reportData.enProceso}</span>
                       </div>
                       <div className="relative z-10 w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner group-hover:-rotate-12 transition-transform duration-300">
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                    </div>

                    {/* Proyectados */}
                    <div className="relative overflow-hidden bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 p-8 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                       <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                       <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                           <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Proyectados</h4>
                         </div>
                         <span className="text-5xl font-black text-gray-800 tracking-tight">{reportData.proyectados}</span>
                       </div>
                       <div className="relative z-10 w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                         </svg>
                       </div>
                    </div>
                </div>

              </div>

              {/* Detalle del Coordinador Seleccionado */}
              {selectedCoordinador && (
                <div className="mt-8 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">📋</span>
                      Detalle de Simuladores
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 ml-10">Desglose de campañas y direcciones para <b>{selectedCoordinador}</b></p>
                  </div>
                  
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 rounded-tl-2xl">Nombre del Proceso</th>
                          <th className="px-6 py-4">Campaña</th>
                          <th className="px-6 py-4">Dirección / Industria</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 rounded-tr-2xl">Desarrollador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {data.filter(r => (r.coordinador || "Sin Asignar") === selectedCoordinador).map((sim, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-gray-900">{sim.nombreProceso || "-"}</td>
                            <td className="px-6 py-4 text-gray-600">{sim.campana || "-"}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {sim.direccion || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                sim.estado?.toUpperCase() === 'FINALIZADA' ? 'bg-emerald-50 text-emerald-700' :
                                sim.estado?.toUpperCase() === 'EN PROCESO' ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  sim.estado?.toUpperCase() === 'FINALIZADA' ? 'bg-emerald-500' :
                                  sim.estado?.toUpperCase() === 'EN PROCESO' ? 'bg-amber-500' :
                                  'bg-slate-400'
                                }`}></div>
                                {sim.estado || "SIN INICIAR"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 group-hover:text-indigo-600 transition-colors">{sim.desarrollador || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de ayuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Encabezado */}
            <div className="sticky top-0 bg-linear-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center shadow-lg z-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">📚 Guía de Uso</h2>
                <p className="text-blue-100 text-sm">
                  Aprende a usar todas las funcionalidades del sistema
                </p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white hover:bg-white hover:text-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition-all text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-8 space-y-6">
              {/* Sección de Pestañas */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📑 Las Dos Pestañas Principales
                </h3>

                {/* Pestaña Calendario */}
                <div className="mb-6 bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-5 border-l-4 border-blue-500">
                  <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    📅 Pestaña: Calendario
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Vista del calendario:</strong> Muestra todos los
                        días del mes actual (excluyendo domingos).
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Días con procesos:</strong> Los días con
                        procesos activos se destacan con colores y puntos
                        indicadores.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Navegación:</strong> Usa las flechas ◀ ▶ en el
                        calendario para cambiar de mes.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Selección de día:</strong> Haz clic en cualquier
                        día para ver los procesos activos en ese día en el panel
                        inferior derecho.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Campañas Activas:</strong> En el panel inferior
                        izquierdo verás un resumen de todas las campañas activas
                        en el mes actual.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Pestaña Reporte Gerencial */}
                <div className="bg-linear-to-r from-purple-50 to-pink-100 rounded-lg p-5 border-l-4 border-purple-500">
                  <h4 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                    📊 Pestaña: Reporte Gerencial
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Visión Global:</strong> Un panel interactivo con el estado general de los simuladores.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Direcciones y Coordinadores:</strong> Visualiza la cantidad de simuladores asignados a cada dirección y coordinador, junto con sus porcentajes de participación.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Sección de Estados */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🚦 Estados de los Procesos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-linear-to-br from-green-100 to-green-200 rounded-lg p-4 border-2 border-green-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-bold text-green-900">
                        Completado
                      </span>
                    </div>
                    <p className="text-sm text-green-800">
                      El proceso ha finalizado exitosamente
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-yellow-100 to-orange-200 rounded-lg p-4 border-2 border-yellow-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⏳</span>
                      <span className="font-bold text-orange-900">
                        En Curso
                      </span>
                    </div>
                    <p className="text-sm text-orange-800">
                      El proceso está actualmente en desarrollo
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg p-4 border-2 border-gray-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📋</span>
                      <span className="font-bold text-gray-900">Pendiente</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      El proceso aún no ha comenzado
                    </p>
                  </div>
                </div>
              </div>

              {/* Consejos y Tips */}
              <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300">
                <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  💡 Consejos Útiles
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <strong>Colores en el calendario:</strong> Los días se
                      colorean según la cantidad de procesos activos. Más
                      intenso = más procesos.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <strong>Actualización automática:</strong> Los datos se
                      cargan automáticamente desde Google Sheets al abrir la
                      página.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <strong>Responsive:</strong> La interfaz se adapta a
                      diferentes tamaños de pantalla (móvil, tablet,
                      escritorio).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <strong>Búsqueda rápida:</strong> En la pestaña de
                      campañas, puedes buscar por nombre para encontrar
                      rápidamente lo que necesitas.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Atajos y funciones rápidas */}
              <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  ⚡ Funciones Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👆</div>
                    <div>
                      <p className="font-semibold text-gray-900">Clic en día</p>
                      <p className="text-sm text-gray-600">
                        Ver procesos activos ese día
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Flechas calendario
                      </p>
                      <p className="text-sm text-gray-600">
                        Navegar entre meses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Buscar campaña
                      </p>
                      <p className="text-sm text-gray-600">
                        Filtrar por nombre en tiempo real
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📊</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Clic en campaña
                      </p>
                      <p className="text-sm text-gray-600">
                        Ver estadísticas completas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="sticky bottom-0 bg-linear-to-r from-gray-100 to-gray-200 p-6 rounded-b-2xl flex justify-center border-t-2 border-gray-300">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-linear-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                ¡Entendido! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
