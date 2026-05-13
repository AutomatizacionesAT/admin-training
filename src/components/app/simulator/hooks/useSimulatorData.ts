import { useEffect, useState } from "react";
import {
  fetchGoogleSheetData,
  fetchSheetFestivosData,
  fetchSheetNovedades,
} from "../utils/utils";
import type { TrainingRecord, FestivoRecord, NovedadesRecord } from "../utils/utils";

interface SimulatorData {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  loading: boolean;
  error: string | null;
}

export function useSimulatorData(): SimulatorData {
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [festivos, setFestivos] = useState<FestivoRecord[]>([]);
  const [novedades, setNovedades] = useState<NovedadesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { data, festivos, novedades, loading, error };
}
