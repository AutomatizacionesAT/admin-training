import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { TrainingRecord } from "../utils/utils";

interface ActiveCampaign {
  campana: string;
  count: number;
  desarrolladores: Set<string>;
}

interface ActiveCampaignsPanelProps {
  activeCampaigns: ActiveCampaign[];
  currentMonth: Date;
}

export function ActiveCampaignsPanel({ activeCampaigns, currentMonth }: ActiveCampaignsPanelProps) {
  return (
    <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        Campañas Activas en {format(currentMonth, "MMMM", { locale: es })}
      </h3>
      {activeCampaigns.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {activeCampaigns.map(({ campana, count, desarrolladores }) => (
            <div
              key={campana}
              className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md border border-blue-100 hover:bg-white transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-sm mb-1">{campana}</p>
                  <div className="flex gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      📁 {count} proceso{count !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      👥 {desarrolladores.size} dev{desarrolladores.size !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/90 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">No hay campañas activas este mes</p>
        </div>
      )}
    </div>
  );
}

interface SelectedDayPanelProps {
  selectedDay: Date | null;
  getEventsForDate: (date: Date) => TrainingRecord[];
}

export function SelectedDayPanel({ selectedDay, getEventsForDate }: SelectedDayPanelProps) {
  const events = selectedDay ? getEventsForDate(selectedDay) : [];

  return (
    <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📅</span>
        Día Seleccionado
      </h3>
      {selectedDay ? (
        <div className="space-y-3">
          <div className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md">
            <p className="font-bold text-purple-900 mb-3 text-lg">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: es })}
            </p>
            {events.length > 0 ? (
              <>
                <div className="mb-3 px-3 py-2 bg-purple-100 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900">
                    {events.length} proceso{events.length !== 1 ? "s" : ""} activo
                    {events.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {events.slice(0, 5).map((event, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-linear-to-r from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-100"
                    >
                      <span className="font-bold text-purple-900">{event.campana}</span>
                      <span className="text-gray-600"> - {event.nombreProceso}</span>
                    </div>
                  ))}
                  {events.length > 5 && (
                    <p className="text-xs text-purple-700 text-center font-semibold bg-purple-100 rounded py-1">
                      +{events.length - 5} más...
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600 text-center py-2">Sin procesos activos este día</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/90 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">
            Haz clic en un día del calendario para ver su información
          </p>
        </div>
      )}
    </div>
  );
}
