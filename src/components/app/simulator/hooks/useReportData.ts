import { useState } from "react";
import { parseISO } from "date-fns";
import type { TrainingRecord } from "../utils/utils";

export interface Coordinador {
  nombre: string;
  count: number;
}

export interface Industria {
  nombre: string;
  count: number;
  porcentaje: string;
}

export interface ReportData {
  totalSimuladores: number;
  industrias: Industria[];
  coordinadores: Coordinador[];
  finalizados: number;
  enProceso: number;
  proyectados: number;
}

interface UseReportData {
  reportData: ReportData;
  selectedCoordinador: string | null;
  setSelectedCoordinador: React.Dispatch<React.SetStateAction<string | null>>;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  selectedMonth: number | null;
  setSelectedMonth: React.Dispatch<React.SetStateAction<number | null>>;
  selectedDireccion: string | null;
  setSelectedDireccion: React.Dispatch<React.SetStateAction<string | null>>;
  availableYears: number[];
  availableDirecciones: string[];
  dateFilteredData: TrainingRecord[];
}

function parseRecordDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  if (dateStr.includes("Date(")) {
    const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
    return null;
  }
  return parseISO(dateStr);
}

export function useReportData(data: TrainingRecord[]): UseReportData {
  const [selectedCoordinador, setSelectedCoordinador] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDireccion, setSelectedDireccion] = useState<string | null>(null);

  const recordsWithDate = data.map(record => ({
    ...record,
    parsedDate: parseRecordDate(record.fechaInicio)
  }));

  const availableYearsSet = new Set<number>();
  recordsWithDate.forEach(r => {
    if (r.parsedDate && !isNaN(r.parsedDate.getTime())) {
      availableYearsSet.add(r.parsedDate.getFullYear());
    }
  });
  
  availableYearsSet.add(new Date().getFullYear());
  
  const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

  const availableDireccionesSet = new Set<string>();
  recordsWithDate.forEach(r => {
    if (r.direccion) {
      availableDireccionesSet.add(r.direccion);
    }
  });
  const availableDirecciones = Array.from(availableDireccionesSet).sort();

  const dateFilteredData = recordsWithDate.filter(record => {
    if (!record.parsedDate || isNaN(record.parsedDate.getTime())) return false;
    
    const year = record.parsedDate.getFullYear();
    const month = record.parsedDate.getMonth();
    
    if (year !== selectedYear) return false;
    if (selectedMonth !== null && month !== selectedMonth) return false;
    if (selectedDireccion !== null && record.direccion !== selectedDireccion) return false;
    
    return true;
  });

  const coordinadoresMap = new Map<string, number>();
  dateFilteredData.forEach((record) => {
    const coord = record.coordinador || "Sin Asignar";
    coordinadoresMap.set(coord, (coordinadoresMap.get(coord) || 0) + 1);
  });
  const coordinadores = Array.from(coordinadoresMap.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count);

  const filteredData = selectedCoordinador
    ? dateFilteredData.filter((record) => (record.coordinador || "Sin Asignar") === selectedCoordinador)
    : dateFilteredData;

  const totalSimuladores = filteredData.length;

  const industriasMap = new Map<string, number>();
  let finalizados = 0;
  let enProceso = 0;
  let proyectados = 0;

  filteredData.forEach((record) => {
    const ind = record.industria || "Sin Asignar";
    industriasMap.set(ind, (industriasMap.get(ind) || 0) + 1);

    const estado = record.estado?.toUpperCase() || "";
    if (estado === "FINALIZADA") finalizados++;
    else if (estado === "EN PROCESO") enProceso++;
    else if (estado === "SIN INICIAR") proyectados++;
  });

  const industrias = Array.from(industriasMap.entries())
    .map(([nombre, count]) => ({
      nombre,
      count,
      porcentaje: totalSimuladores > 0 ? ((count / totalSimuladores) * 100).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.count - a.count);

  return {
    reportData: { totalSimuladores, industrias, coordinadores, finalizados, enProceso, proyectados },
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
  };
}

