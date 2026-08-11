import { useState } from "react";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "../utils/utils";
import Calendar from "./Calendar";

interface CalendarTabProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  onEdit?: (record: TrainingRecord) => void;
  onUpdateRecord?: (record: TrainingRecord) => Promise<void>;
  onBatchUpdate?: (records: TrainingRecord[], deletedIds?: number[]) => Promise<void>;
  onAddRecord?: (record: TrainingRecord) => Promise<void>;
  estados?: string[];
  tiposDesarrollo?: string[];
}

export default function CalendarTab({
  data,
  festivos,
  novedades,
  onEdit,
  onUpdateRecord,
  onBatchUpdate,
  onAddRecord,
  estados,
  tiposDesarrollo,
}: CalendarTabProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
          onEdit={onEdit}
          onUpdateRecord={onUpdateRecord}
          onBatchUpdate={onBatchUpdate}
          onAddRecord={onAddRecord}
          estados={estados}
          tiposDesarrollo={tiposDesarrollo}
        />
      </div>

    </>
  );
}
