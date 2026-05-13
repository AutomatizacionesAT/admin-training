import Calendar from "../Calendar";
import { ActiveCampaignsPanel, SelectedDayPanel } from "./CalendarInfoPanels";
import type { TrainingRecord, FestivoRecord, NovedadesRecord } from "../utils/utils";
import { useCalendarLogic } from "../hooks/useCalendarLogic";

interface CalendarTabProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
}

export function CalendarTab({ data, festivos, novedades }: CalendarTabProps) {
  const { currentMonth, setCurrentMonth, selectedDay, setSelectedDay, activeCampaigns, getEventsForDate } =
    useCalendarLogic(data);

  return (
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveCampaignsPanel activeCampaigns={activeCampaigns} currentMonth={currentMonth} />
        <SelectedDayPanel selectedDay={selectedDay} getEventsForDate={getEventsForDate} />
      </div>
    </>
  );
}
