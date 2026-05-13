import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
  isSameMonth,
  parseISO,
} from "date-fns";
import type { TrainingRecord } from "../utils/utils";

interface ActiveCampaign {
  campana: string;
  count: number;
  desarrolladores: Set<string>;
}

interface CalendarLogic {
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  selectedDay: Date | null;
  setSelectedDay: React.Dispatch<React.SetStateAction<Date | null>>;
  days: Date[];
  activeCampaigns: ActiveCampaign[];
  getEventsForDate: (date: Date) => TrainingRecord[];
}

function parseRecordDate(dateStr: string): Date | null {
  if (dateStr.includes("Date(")) {
    const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
    return null;
  }
  return parseISO(dateStr);
}

export function useCalendarLogic(data: TrainingRecord[]): CalendarLogic {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd }).filter(
    (day) => day.getDay() !== 0
  );

  const getEventsForDate = (date: Date): TrainingRecord[] => {
    return data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin) return false;
      try {
        const startDate = parseRecordDate(record.fechaInicio);
        const endDate = parseRecordDate(record.fechaFin);
        if (!startDate || !endDate) return false;
        return isWithinInterval(date, { start: startDate, end: endDate });
      } catch (error) {
        console.error("Error parseando fecha:", error, record);
        return false;
      }
    });
  };

  const activeCampaigns: ActiveCampaign[] = (() => {
    const campaignsMap = new Map<string, { count: number; desarrolladores: Set<string> }>();
    days.forEach((day) => {
      if (isSameMonth(day, currentMonth)) {
        getEventsForDate(day).forEach((event) => {
          if (event.campana) {
            if (!campaignsMap.has(event.campana)) {
              campaignsMap.set(event.campana, { count: 0, desarrolladores: new Set() });
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
    return Array.from(campaignsMap.entries()).map(([campana, { count, desarrolladores }]) => ({
      campana,
      count,
      desarrolladores,
    }));
  })();

  return {
    currentMonth,
    setCurrentMonth,
    selectedDay,
    setSelectedDay,
    days,
    activeCampaigns,
    getEventsForDate,
  };
}
