import { useState } from "react";
import { parseDateString } from "../utils/utils";
import type { TrainingRecord } from "../utils/utils";

export interface WTCoordinador {
  nombre: string;
  count: number;
}

export interface WTIndustria {
  nombre: string;
  count: number;
  porcentaje: string;
}

export interface WTReportData {
  totalEntrenamientos: number;
  industrias: WTIndustria[];
  coordinadores: WTCoordinador[];
  finalizados: number;
  enProceso: number;
  proyectados: number;
}

interface UseWTReportData {
  reportData: WTReportData;
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

function classifyEstado(estado: string | null): "finalizado" | "enProceso" | "proyectado" {
  const s = estado?.trim().toUpperCase() ?? "";
  if (s === "FINALIZADA" || s === "COMPLETADO" || s === "FINALIZADO") return "finalizado";
  if (s === "EN PROCESO" || s === "EN CURSO") return "enProceso";
  return "proyectado"; // SIN INICIAR, PENDIENTE, etc.
}

export function useWTReportData(data: TrainingRecord[]): UseWTReportData {
  const [selectedCoordinador, setSelectedCoordinador] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDireccion, setSelectedDireccion] = useState<string | null>(null);

  // Parsear fechas: los datos de WT vienen como DD/MM/YYYY tras normalizeGvizDate
  const recordsWithDate = data.map((record) => ({
    ...record,
    parsedDate: parseDateString(record.fechaInicio),
  }));

  // Años disponibles
  const availableYearsSet = new Set<number>();
  recordsWithDate.forEach((r) => {
    if (r.parsedDate && !isNaN(r.parsedDate.getTime())) {
      availableYearsSet.add(r.parsedDate.getFullYear());
    }
  });
  availableYearsSet.add(new Date().getFullYear());
  const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

  // Direcciones disponibles (col Q)
  const availableDireccionesSet = new Set<string>();
  recordsWithDate.forEach((r) => {
    if (r.direccion) availableDireccionesSet.add(r.direccion);
  });
  const availableDirecciones = Array.from(availableDireccionesSet).sort();

  // Filtro por año, mes y dirección
  const dateFilteredData = recordsWithDate.filter((record) => {
    if (!record.parsedDate || isNaN(record.parsedDate.getTime())) return false;

    const year = record.parsedDate.getFullYear();
    const month = record.parsedDate.getMonth();

    if (year !== selectedYear) return false;
    if (selectedMonth !== null && month !== selectedMonth) return false;
    if (selectedDireccion !== null && record.direccion !== selectedDireccion) return false;

    return true;
  });

  // Coordinadores (agrupados del conjunto filtrado por fecha/dirección)
  const coordinadoresMap = new Map<string, number>();
  dateFilteredData.forEach((record) => {
    const coord = record.coordinador || "Sin Asignar";
    coordinadoresMap.set(coord, (coordinadoresMap.get(coord) || 0) + 1);
  });
  const coordinadores = Array.from(coordinadoresMap.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count);

  // Filtro adicional por coordinador seleccionado
  const filteredData = selectedCoordinador
    ? dateFilteredData.filter(
        (record) => (record.coordinador || "Sin Asignar") === selectedCoordinador
      )
    : dateFilteredData;

  const totalEntrenamientos = filteredData.length;

  // Industrias y estados
  const industriasMap = new Map<string, number>();
  let finalizados = 0;
  let enProceso = 0;
  let proyectados = 0;

  filteredData.forEach((record) => {
    const ind = record.industria || "Sin Asignar";
    industriasMap.set(ind, (industriasMap.get(ind) || 0) + 1);

    const clase = classifyEstado(record.estado);
    if (clase === "finalizado") finalizados++;
    else if (clase === "enProceso") enProceso++;
    else proyectados++;
  });

  const industrias = Array.from(industriasMap.entries())
    .map(([nombre, count]) => ({
      nombre,
      count,
      porcentaje:
        totalEntrenamientos > 0
          ? ((count / totalEntrenamientos) * 100).toFixed(1)
          : "0.0",
    }))
    .sort((a, b) => b.count - a.count);

  return {
    reportData: {
      totalEntrenamientos,
      industrias,
      coordinadores,
      finalizados,
      enProceso,
      proyectados,
    },
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
    dateFilteredData,
  };
}
