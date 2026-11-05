import { useState } from "react";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "../utils/utils";
import Calendar from "./Calendar";
import ProjectedCampaignsTable from "./GraficasWeb/ProjectedCampaignsTable";
import WebTrainingCharts from "./GraficasWeb/WebTrainingCharts";
import Migracion from "./Migracion";
import type { EnviosServidoresRecord } from "../utils/utils";

interface CalendarTabProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  enviosServidores: EnviosServidoresRecord[];
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
  enviosServidores,
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
    <div className="flex-1 space-y-6 px-8 py-2 pb-8">
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
      <ProjectedCampaignsTable data={data} />
      <WebTrainingCharts data={data} />
      <Migracion enviosServidores={enviosServidores} data={data} />
    </div>
  );
}
