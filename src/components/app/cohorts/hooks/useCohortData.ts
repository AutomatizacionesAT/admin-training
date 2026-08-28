import { useState, useMemo, useEffect } from "react";
import type { CohortRecord } from "../utils/utils";
import { toPct, semaforo, mesNumero } from "../utils/utils";

export interface CohortFilters {
  anio: number | null;
  mes: number | null;          // 1–12
  coordinador: string | null;
  campana: string | null;
  direccion: string | null;
  indicador: string | null;    // combinado: "REQ / INDICADOR"
}

/** Valor interno del filtro combinado req+indicador → "40967-1 / VENTAS" */
export const buildReqIndicadorKey = (req: string | null, indicador: string | null): string =>
  `${req ?? "—"} / ${indicador ?? "—"}`;

export interface CohortKPIs {
  totalCohortes: number;
  totalPersonas: number;   // RACs únicos (por documento)
  pctCumplimiento70: number;
  promedioCierre: number | null;
  verde: number;
  amarillo: number;
  rojo: number;
}

export interface RacPorCampana {
  campana: string;
  racs: number;            // personas únicas (documentos distintos)
  registros: number;       // filas totales (puede haber varios indicadores por RAC)
  promCierre: number | null;
}

// Normalización para comparaciones: sin tildes, sin espacios extra, mayúsculas
const norm = (s: string | null | undefined) =>
  (s ?? "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function useCohortData(data: CohortRecord[], lockedCoordinador: string | null = null) {
  const [filters, setFilters] = useState<CohortFilters>({
    anio: new Date().getFullYear(),
    mes: null,
    coordinador: lockedCoordinador,
    campana: null,
    direccion: null,
    indicador: null,
  });

  // Si entra o cambia el coordinador bloqueado por login, forzar su filtro
  useEffect(() => {
    if (lockedCoordinador) {
      setFilters((prev) => ({ ...prev, coordinador: lockedCoordinador }));
    }
  }, [lockedCoordinador]);

  // ── Opciones GLOBALES (sin filtro) ───────────────────────
  const availableAnios = useMemo(() => {
    const s = new Set<number>();
    data.forEach((r) => { if (r.anio !== null) s.add(Math.round(r.anio)); });
    s.add(new Date().getFullYear());
    return Array.from(s).sort((a, b) => b - a);
  }, [data]);

  // ── Paso 1: filtrar solo por año ─────────────────────────
  const afterAnio = useMemo(() =>
    data.filter((r) =>
      filters.anio === null || Math.round(r.anio ?? 0) === filters.anio
    ),
    [data, filters.anio]);

  // ── Paso 2: filtrar por año + mes ────────────────────────
  const afterMes = useMemo(() =>
    afterAnio.filter((r) => {
      if (filters.mes === null) return true;
      return mesNumero(r.mes) === filters.mes;
    }),
    [afterAnio, filters.mes]);

  // ── Paso 3: filtrar por año + mes + coordinador ──────────
  const activeCoordFilter = lockedCoordinador ?? filters.coordinador;
  const afterCoord = useMemo(() =>
    afterMes.filter((r) => {
      if (!activeCoordFilter) return true;
      const recCoord = norm(r.coordinador) || norm(r.sheetName);
      return recCoord === norm(activeCoordFilter);
    }),
    [afterMes, activeCoordFilter]);

  // ── Paso 4: filtrar por + dirección ─────────────────────
  const afterDireccion = useMemo(() =>
    afterCoord.filter((r) =>
      !filters.direccion || norm(r.direccion) === norm(filters.direccion)
    ),
    [afterCoord, filters.direccion]);

  // ── Paso 5: filtrar por + campaña ───────────────────────
  const afterCampana = useMemo(() =>
    afterDireccion.filter((r) =>
      !filters.campana || norm(r.campana) === norm(filters.campana)
    ),
    [afterDireccion, filters.campana]);

  // ── Datos finales (todos los filtros) ────────────────────
  const filteredData = useMemo(() =>
    afterCampana.filter((r) => {
      if (!filters.indicador) return true;
      const key = buildReqIndicadorKey(r.req, r.indicador);
      return key === filters.indicador;
    }),
    [afterCampana, filters.indicador]);

  // ── Opciones EN CASCADA (dependen del contexto actual) ───
  const availableCoordinadores = useMemo(() => {
    if (lockedCoordinador) return [lockedCoordinador];
    const s = new Set<string>();
    afterMes.forEach((r) => {
      const v = r.coordinador?.trim() || r.sheetName?.trim();
      if (v) s.add(v);
    });
    return Array.from(s).sort();
  }, [afterMes, lockedCoordinador]);

  const availableDirecciones = useMemo(() => {
    const s = new Set<string>();
    afterCoord.forEach((r) => { if (r.direccion) s.add(r.direccion); });
    return Array.from(s).sort();
  }, [afterCoord]);

  const availableCampanas = useMemo(() => {
    const s = new Set<string>();
    afterDireccion.forEach((r) => { if (r.campana) s.add(r.campana); });
    return Array.from(s).sort();
  }, [afterDireccion]);

  // Opciones combinadas REQ / INDICADOR
  const availableIndicadores = useMemo(() => {
    const s = new Set<string>();
    afterCampana.forEach((r) => {
      const key = buildReqIndicadorKey(r.req, r.indicador);
      s.add(key);
    });
    return Array.from(s).sort();
  }, [afterCampana]);

  // ── setFilters con limpieza en cascada ───────────────────
  const setFiltersWithCascade = (newFilters: CohortFilters | ((prev: CohortFilters) => CohortFilters)) => {
    setFilters((prev) => {
      const next = typeof newFilters === "function" ? newFilters(prev) : newFilters;

      // Si está bloqueado como coordinador, nunca permitir resetear o cambiar de coordinador
      if (lockedCoordinador) {
        next.coordinador = lockedCoordinador;
      }

      // Si cambió el año → limpiar todo lo demás
      if (next.anio !== prev.anio) {
        return { ...next, mes: null, coordinador: lockedCoordinador ?? null, direccion: null, campana: null, indicador: null };
      }
      // Si cambió el mes → limpiar coordinador en adelante
      if (next.mes !== prev.mes) {
        return { ...next, coordinador: lockedCoordinador ?? null, direccion: null, campana: null, indicador: null };
      }
      // Si cambió el coordinador → limpiar dirección en adelante
      if (next.coordinador !== prev.coordinador) {
        return { ...next, direccion: null, campana: null, indicador: null };
      }
      // Si cambió la dirección → limpiar campaña e indicador
      if (next.direccion !== prev.direccion) {
        return { ...next, campana: null, indicador: null };
      }
      // Si cambió la campaña → limpiar indicador
      if (next.campana !== prev.campana) {
        return { ...next, indicador: null };
      }
      return next;
    });
  };

  // ── KPIs ─────────────────────────────────────────────────
  const kpis = useMemo((): CohortKPIs => {
    if (filteredData.length === 0) {
      return { totalCohortes: 0, totalPersonas: 0, pctCumplimiento70: 0, promedioCierre: null, verde: 0, amarillo: 0, rojo: 0 };
    }

    const uniqueReqs = new Set(filteredData.map((r) => r.req).filter(Boolean));
    const uniqueDocs = new Set(filteredData.map((r) => r.documento).filter(Boolean));

    let cumple70 = 0;
    let totalCierre = 0;
    let countCierre = 0;
    let verde = 0, amarillo = 0, rojo = 0;

    filteredData.forEach((r) => {
      if (r.cumplimiento70 !== null) {
        // El campo puede ser 1.0 (= cumple) o 0 (= no cumple), o un %
        const val = toPct(r.cumplimiento70) ?? 0;
        if (val >= 70 || r.cumplimiento70 === 1) cumple70++;
      }
      if (r.cumplimientoCierre !== null) {
        const p = toPct(r.cumplimientoCierre) ?? 0;
        totalCierre += p;
        countCierre++;
        const s = semaforo(r.cumplimientoCierre);
        if (s === "green") verde++;
        else if (s === "yellow") amarillo++;
        else if (s === "red") rojo++;
      }
    });

    return {
      totalCohortes: uniqueReqs.size,
      totalPersonas: uniqueDocs.size,
      pctCumplimiento70: Math.round((cumple70 / filteredData.length) * 100),
      promedioCierre: countCierre > 0 ? Math.round(totalCierre / countCierre) : null,
      verde,
      amarillo,
      rojo,
    };
  }, [filteredData]);

  // ── Agrupaciones ─────────────────────────────────────────
  const byCampana = useMemo(() => {
    const map = new Map<string, { campana: string; total: number; cumpliendo: number; promCierre: number | null }>();
    const promedios = new Map<string, { sum: number; count: number }>();

    filteredData.forEach((r) => {
      const key = r.campana ?? "Sin campaña";
      const entry = map.get(key) ?? { campana: key, total: 0, cumpliendo: 0, promCierre: null };
      entry.total++;
      if (r.cumplimientoCierre !== null && (toPct(r.cumplimientoCierre) ?? 0) >= 70) entry.cumpliendo++;
      map.set(key, entry);

      if (r.cumplimientoCierre !== null) {
        const p = toPct(r.cumplimientoCierre) ?? 0;
        const prev = promedios.get(key) ?? { sum: 0, count: 0 };
        promedios.set(key, { sum: prev.sum + p, count: prev.count + 1 });
      }
    });
    promedios.forEach((v, k) => {
      const entry = map.get(k);
      if (entry) entry.promCierre = Math.round(v.sum / v.count);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  const byIndicador = useMemo(() => {
    const map = new Map<string, { indicador: string; total: number; promCierre: number | null }>();
    const promedios = new Map<string, { sum: number; count: number }>();

    filteredData.forEach((r) => {
      const key = r.indicador ?? "Sin indicador";
      const entry = map.get(key) ?? { indicador: key, total: 0, promCierre: null };
      entry.total++;
      map.set(key, entry);

      if (r.cumplimientoCierre !== null) {
        const p = toPct(r.cumplimientoCierre) ?? 0;
        const prev = promedios.get(key) ?? { sum: 0, count: 0 };
        promedios.set(key, { sum: prev.sum + p, count: prev.count + 1 });
      }
    });
    promedios.forEach((v, k) => {
      const entry = map.get(k);
      if (entry) entry.promCierre = Math.round(v.sum / v.count);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // ── RACs por campaña ─────────────────────────────────────
  // RAC = persona única identificada por documento dentro de cada campaña
  const racPorCampana = useMemo((): RacPorCampana[] => {
    // Mapa: campana → Set de documentos únicos
    const racsMap = new Map<string, Set<string>>();
    const registrosMap = new Map<string, number>();
    const promedios = new Map<string, { sum: number; count: number }>();

    filteredData.forEach((r) => {
      const key = r.campana ?? "Sin campaña";
      const doc = r.documento ?? r.nombre ?? "desconocido";

      // RACs únicos
      if (!racsMap.has(key)) racsMap.set(key, new Set());
      racsMap.get(key)!.add(doc);

      // Registros totales
      registrosMap.set(key, (registrosMap.get(key) ?? 0) + 1);

      // Promedio cierre
      if (r.cumplimientoCierre !== null) {
        const p = toPct(r.cumplimientoCierre) ?? 0;
        const prev = promedios.get(key) ?? { sum: 0, count: 0 };
        promedios.set(key, { sum: prev.sum + p, count: prev.count + 1 });
      }
    });

    return Array.from(racsMap.entries())
      .map(([campana, docs]) => ({
        campana,
        racs: docs.size,
        registros: registrosMap.get(campana) ?? 0,
        promCierre: (() => {
          const p = promedios.get(campana);
          return p ? Math.round(p.sum / p.count) : null;
        })(),
      }))
      .sort((a, b) => b.racs - a.racs);
  }, [filteredData]);

  // ── Coordinadores y Formadores ──────────────────────────
  const byCoordinador = useMemo(() => {
    const map = new Map<string, { nombre: string; count: number; racs: Set<string>; sumCierre: number; countCierre: number }>();
    filteredData.forEach((r) => {
      const name = r.coordinador?.trim() || r.sheetName?.trim() || "Sin asignar";
      if (!map.has(name)) {
        map.set(name, { nombre: name, count: 0, racs: new Set(), sumCierre: 0, countCierre: 0 });
      }
      const entry = map.get(name)!;
      entry.count++;
      if (r.documento) entry.racs.add(r.documento);
      if (r.cumplimientoCierre !== null) {
        const p = toPct(r.cumplimientoCierre) ?? 0;
        entry.sumCierre += p;
        entry.countCierre++;
      }
    });

    return Array.from(map.values())
      .map((e) => ({
        nombre: e.nombre,
        count: e.racs.size > 0 ? e.racs.size : e.count,
        registros: e.count,
        promCierre: e.countCierre > 0 ? Math.round(e.sumCierre / e.countCierre) : null,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const byFormador = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((r) => {
      if (r.formador) map.set(r.formador, (map.get(r.formador) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([formador, total]) => ({ formador, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // ── Evolución por Etapas (OJT, S1, S2, S3, S4, Cierre) ─────
  const stagesEvolution = useMemo(() => {
    const stagesDef = [
      { stage: "OJT (Inducción)", shortName: "OJT", metaKey: "metaOjt", resKey: "resultadoOjt", cumpKey: "cumplimientoOjt" },
      { stage: "Semana 1", shortName: "S1", metaKey: "metaS1", resKey: "resultadoS1", cumpKey: "cumplimientoS1" },
      { stage: "Semana 2", shortName: "S2", metaKey: "metaS2", resKey: "resultadoS2", cumpKey: "cumplimientoS2" },
      { stage: "Semana 3", shortName: "S3", metaKey: "metaS3", resKey: "resultadoS3", cumpKey: "cumplimientoS3" },
      { stage: "Semana 4", shortName: "S4", metaKey: "metaS4", resKey: "resultadoS4", cumpKey: "cumplimientoS4" },
      { stage: "Cierre Final 30D", shortName: "Cierre", metaKey: "metaCierre", resKey: "resultadoCierre", cumpKey: "cumplimientoCierre" },
    ] as const;

    return stagesDef.map((def) => {
      let sumMeta = 0, countMeta = 0;
      let sumRes = 0, countRes = 0;
      let sumCump = 0, countCump = 0;
      let verde = 0, amarillo = 0, rojo = 0;

      filteredData.forEach((r) => {
        const metaVal = r[def.metaKey as keyof CohortRecord] as number | null;
        const resVal = r[def.resKey as keyof CohortRecord] as number | null;
        const cumpVal = r[def.cumpKey as keyof CohortRecord] as number | null;

        if (metaVal !== null && !isNaN(Number(metaVal))) {
          sumMeta += Number(metaVal);
          countMeta++;
        }
        if (resVal !== null && !isNaN(Number(resVal))) {
          sumRes += Number(resVal);
          countRes++;
        }
        if (cumpVal !== null) {
          const pct = toPct(cumpVal);
          if (pct !== null) {
            sumCump += pct;
            countCump++;
            const s = semaforo(cumpVal);
            if (s === "green") verde++;
            else if (s === "yellow") amarillo++;
            else if (s === "red") rojo++;
          }
        }
      });

      return {
        stage: def.stage,
        shortName: def.shortName,
        promMeta: countMeta > 0 ? Math.round((sumMeta / countMeta) * 10) / 10 : null,
        promResultado: countRes > 0 ? Math.round((sumRes / countRes) * 10) / 10 : null,
        promCumplimiento: countCump > 0 ? Math.round(sumCump / countCump) : null,
        verde,
        amarillo,
        rojo,
        totalValid: countCump,
      };
    });
  }, [filteredData]);

  return {
    filters,
    setFilters: setFiltersWithCascade,
    filteredData,
    kpis,
    byCampana,
    byIndicador,
    racPorCampana,
    byCoordinador,
    byFormador,
    stagesEvolution,
    availableAnios,
    availableCoordinadores,
    availableCampanas,
    availableDirecciones,
    availableIndicadores,
  };
}

