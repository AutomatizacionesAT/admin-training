import { useState, useMemo, useEffect, useCallback } from "react";
import type { TrainingRecord, EnviosServidoresRecord } from "../../utils/utils";
import { parseDateString } from "../../utils/utils";
import { fetchControlDeAccesos } from "../../../usabilidad_web_training/utils/fetchData";
import type { EstadoServidorFilter } from "../EnviosServidoresReportDialog";
import type {
  UnifiedCampana,
  ActividadFilter,
  CoordinadorMetric,
  IndustriaMetric,
  ServerMetrics,
  ActividadCounts,
} from "./types";
import { normalizarCampana, normalizeEstadoServidor } from "./utils";

interface UseUnifiedCampanasParams {
  data: TrainingRecord[];
  availableCampanas: string[];
  enviosServidores: EnviosServidoresRecord[];
  selectedYear: number;
  selectedMonth: number | null;
  selectedDireccion: string | null;
  selectedCampana: string | null;
  selectedCoordinador: string | null;
  selectedIndustria: string | null;
  selectedActividad: ActividadFilter;
  selectedEstadoServidor: EstadoServidorFilter | null;
  tableSearch: string;
}

export function useUnifiedCampanas({
  data,
  availableCampanas,
  enviosServidores,
  selectedYear,
  selectedMonth,
  selectedDireccion,
  selectedCampana,
  selectedCoordinador,
  selectedIndustria,
  selectedActividad,
  selectedEstadoServidor,
  tableSearch,
}: UseUnifiedCampanasParams) {
  // Carga de campañas activas desde CONTROL_DE_ACCESOS (Usabilidad Web Training)
  const [activeCampanasSet, setActiveCampanasSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    fetchControlDeAccesos()
      .then((rows) => {
        if (!isMounted) return;
        const set = new Set<string>();
        rows.forEach((r) => {
          // En UsabilidadWebTraining la clave de campaña activa es `${r.campana} ${r.modulo}`
          const cardKey = `${r.campana || ""} ${r.modulo || ""}`;
          const norm = normalizarCampana(cardKey);
          if (norm) {
            set.add(norm);
          }
        });
        setActiveCampanasSet(set);
      })
      .catch((err) => {
        console.error("Error al cargar campañas activas desde Control de Accesos:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const isCampanaActiva = useCallback(
    (campOrKey: UnifiedCampana | string) => {
      if (activeCampanasSet.size === 0) return false;
      if (typeof campOrKey === "string") {
        const norm = normalizarCampana(campOrKey);
        return activeCampanasSet.has(norm);
      }
      const hasMatchUsabilidad =
        Boolean(campOrKey.usabilidadKey && activeCampanasSet.has(campOrKey.usabilidadKey));
      const hasMatchNombre = activeCampanasSet.has(campOrKey.normalizedKey);
      return Boolean(hasMatchUsabilidad || hasMatchNombre);
    },
    [activeCampanasSet],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // UNIFICACIÓN DE FUENTES DE DATOS (availableCampanas + data + enviosServidores)
  // ══════════════════════════════════════════════════════════════════════════
  const allUnifiedCampanas = useMemo(() => {
    const map = new Map<string, UnifiedCampana>();

    // 1. Cargar desde enviosServidores (~63 registros)
    enviosServidores.forEach((es) => {
      const campName = es.campana?.trim() || "";
      const normKey = normalizarCampana(campName);
      if (!normKey) return;

      // Clave para cruce con Usabilidad (campanasDos + segmentosDos)
      const cDos = es.campanasDos?.trim() || "";
      const sDos = es.segmentosDos?.trim() || "";
      const claveDos = sDos ? `${cDos} ${sDos}`.trim() : cDos;
      const usabilidadKey = normalizarCampana(claveDos);

      const status = normalizeEstadoServidor(es.estadoServidor);
      map.set(normKey, {
        nombre: campName,
        normalizedKey: normKey,
        usabilidadKey: usabilidadKey || normKey,
        isActiva: false,
        estadoServidor: status,
        rawEstadoServidor: es.estadoServidor || "",
        url: es.url || "",
        bases: es.bases || "",
        coordinadores: [],
        coordinadorPrincipal: "Sin Asignar",
        industrias: [],
        industriaPrincipal: "Sin Asignar",
        direcciones: [],
        direccionPrincipal: "Sin Asignar",
        totalDesarrollos: 0,
        desarrollos: [],
        finalizados: 0,
        enProceso: 0,
        proyectados: 0,
      });
    });

    // 2. Unificar con data (Base WT25 / TrainingRecord[])
    data.forEach((rec) => {
      const campName = rec.campana?.trim() || "";
      const normKey = normalizarCampana(campName);
      if (!normKey) return;

      let camp = map.get(normKey);
      if (!camp) {
        camp = {
          nombre: campName,
          normalizedKey: normKey,
          usabilidadKey: normKey,
          isActiva: false,
          estadoServidor: "NO",
          rawEstadoServidor: "",
          url: "",
          bases: "",
          coordinadores: [],
          coordinadorPrincipal: "Sin Asignar",
          industrias: [],
          industriaPrincipal: "Sin Asignar",
          direcciones: [],
          direccionPrincipal: "Sin Asignar",
          totalDesarrollos: 0,
          desarrollos: [],
          finalizados: 0,
          enProceso: 0,
          proyectados: 0,
        };
        map.set(normKey, camp);
      }

      if (!camp.nombre && campName) {
        camp.nombre = campName;
      }

      camp.desarrollos.push(rec);
      camp.totalDesarrollos++;

      const coord = rec.coordinador?.trim();
      if (coord && !camp.coordinadores.includes(coord)) {
        camp.coordinadores.push(coord);
      }

      const ind = rec.industria?.trim();
      if (ind && !camp.industrias.includes(ind)) {
        camp.industrias.push(ind);
      }

      const dir = rec.direccion?.trim();
      if (dir && !camp.direcciones.includes(dir)) {
        camp.direcciones.push(dir);
      }

      const est = rec.estado?.trim().toUpperCase() ?? "";
      if (
        est === "FINALIZADA" ||
        est === "COMPLETADO" ||
        est === "FINALIZADO" ||
        est === "ENTREGADO"
      ) {
        camp.finalizados++;
      } else if (est === "EN PROCESO" || est === "EN CURSO") {
        camp.enProceso++;
      } else {
        camp.proyectados++;
      }
    });

    // 3. Incluir cualquier campaña en availableCampanas
    availableCampanas.forEach((cName) => {
      const normKey = normalizarCampana(cName);
      if (normKey && !map.has(normKey)) {
        map.set(normKey, {
          nombre: cName.trim(),
          normalizedKey: normKey,
          usabilidadKey: normKey,
          isActiva: false,
          estadoServidor: "NO",
          rawEstadoServidor: "",
          url: "",
          bases: "",
          coordinadores: [],
          coordinadorPrincipal: "Sin Asignar",
          industrias: [],
          industriaPrincipal: "Sin Asignar",
          direcciones: [],
          direccionPrincipal: "Sin Asignar",
          totalDesarrollos: 0,
          desarrollos: [],
          finalizados: 0,
          enProceso: 0,
          proyectados: 0,
        });
      }
    });

    // 4. Asignar principales y calcular isActiva
    map.forEach((camp) => {
      if (camp.coordinadores.length > 0) {
        camp.coordinadorPrincipal = camp.coordinadores[0];
      }
      if (camp.industrias.length > 0) {
        camp.industriaPrincipal = camp.industrias[0];
      }
      if (camp.direcciones.length > 0) {
        camp.direccionPrincipal = camp.direcciones[0];
      }
      camp.isActiva = isCampanaActiva(camp);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }, [enviosServidores, data, availableCampanas, isCampanaActiva]);

  // Lista unificada para el SearchableSelect del filtro de campañas
  const unifiedCampanasOptions = useMemo(() => {
    return allUnifiedCampanas.map((c) => c.nombre);
  }, [allUnifiedCampanas]);

  // Conteo de campañas activas e inactivas globales
  const actividadCounts: ActividadCounts = useMemo(() => {
    let activas = 0;
    let inactivas = 0;
    allUnifiedCampanas.forEach((c) => {
      if (c.isActiva) activas++;
      else inactivas++;
    });
    return { activas, inactivas };
  }, [allUnifiedCampanas]);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTRADO DE CAMPAÑAS
  // ══════════════════════════════════════════════════════════════════════════
  const filteredCampanas = useMemo(() => {
    return allUnifiedCampanas.filter((camp) => {
      // Filtro de Actividad (Activas / Inactivas)
      if (selectedActividad === "ACTIVAS") {
        if (!camp.isActiva) return false;
      } else if (selectedActividad === "INACTIVAS") {
        if (camp.isActiva) return false;
      }

      // Filtro de Dirección
      if (selectedDireccion) {
        const matchesDir =
          camp.direcciones.some(
            (d) => normalizarCampana(d) === normalizarCampana(selectedDireccion),
          ) || normalizarCampana(camp.direccionPrincipal) === normalizarCampana(selectedDireccion);
        if (!matchesDir) return false;
      }

      // Filtro de Coordinador
      if (selectedCoordinador) {
        const matchesCoord =
          camp.coordinadores.some(
            (c) => normalizarCampana(c) === normalizarCampana(selectedCoordinador),
          ) || normalizarCampana(camp.coordinadorPrincipal) === normalizarCampana(selectedCoordinador);
        if (!matchesCoord) return false;
      }

      // Filtro de Industria (seleccionable en las tarjetas)
      if (selectedIndustria) {
        const matchesInd =
          camp.industrias.some(
            (i) => normalizarCampana(i) === normalizarCampana(selectedIndustria),
          ) || normalizarCampana(camp.industriaPrincipal) === normalizarCampana(selectedIndustria);
        if (!matchesInd) return false;
      }

      // Filtro de Campaña seleccionada
      if (selectedCampana) {
        if (
          normalizarCampana(camp.nombre) !== normalizarCampana(selectedCampana)
        ) {
          return false;
        }
      }

      // Filtro de Estado de Servidor
      if (selectedEstadoServidor) {
        if (camp.estadoServidor !== selectedEstadoServidor) {
          return false;
        }
      }

      // Filtro por Fecha (Año / Mes si tiene desarrollos asociados)
      if (selectedMonth !== null) {
        const hasDateMatch = camp.desarrollos.some((d) => {
          const parsed = parseDateString(d.fechaInicio);
          return (
            parsed &&
            parsed.getFullYear() === selectedYear &&
            parsed.getMonth() === selectedMonth
          );
        });
        if (camp.desarrollos.length > 0 && !hasDateMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    allUnifiedCampanas,
    selectedActividad,
    selectedDireccion,
    selectedCoordinador,
    selectedIndustria,
    selectedCampana,
    selectedEstadoServidor,
    selectedYear,
    selectedMonth,
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTRICAS CALCULADAS POR CAMPAÑAS
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Coordinadores: Cantidad de campañas ÚNICAS por coordinador
  const coordinadoresMetrics: CoordinadorMetric[] = useMemo(() => {
    const coordMap = new Map<string, Set<string>>();

    const source = allUnifiedCampanas.filter((camp) => {
      if (selectedActividad === "ACTIVAS" && !camp.isActiva) return false;
      if (selectedActividad === "INACTIVAS" && camp.isActiva) return false;
      if (selectedDireccion) {
        const matchesDir =
          camp.direcciones.some(
            (d) => normalizarCampana(d) === normalizarCampana(selectedDireccion),
          ) || normalizarCampana(camp.direccionPrincipal) === normalizarCampana(selectedDireccion);
        if (!matchesDir) return false;
      }
      if (selectedIndustria) {
        const matchesInd =
          camp.industrias.some(
            (i) => normalizarCampana(i) === normalizarCampana(selectedIndustria),
          ) || normalizarCampana(camp.industriaPrincipal) === normalizarCampana(selectedIndustria);
        if (!matchesInd) return false;
      }
      return true;
    });

    source.forEach((camp) => {
      camp.coordinadores.forEach((coord) => {
        if (!coordMap.has(coord)) {
          coordMap.set(coord, new Set<string>());
        }
        coordMap.get(coord)!.add(camp.normalizedKey);
      });
    });

    return Array.from(coordMap.entries())
      .map(([nombre, campanasSet]) => ({
        nombre,
        count: campanasSet.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allUnifiedCampanas, selectedActividad, selectedDireccion, selectedIndustria]);

  // 2. Industrias: Cantidad de campañas ÚNICAS por industria
  const industriasMetrics: IndustriaMetric[] = useMemo(() => {
    const indMap = new Map<string, Set<string>>();

    const source = allUnifiedCampanas.filter((camp) => {
      if (selectedActividad === "ACTIVAS" && !camp.isActiva) return false;
      if (selectedActividad === "INACTIVAS" && camp.isActiva) return false;
      if (selectedDireccion) {
        const matchesDir =
          camp.direcciones.some(
            (d) => normalizarCampana(d) === normalizarCampana(selectedDireccion),
          ) || normalizarCampana(camp.direccionPrincipal) === normalizarCampana(selectedDireccion);
        if (!matchesDir) return false;
      }
      if (selectedCoordinador) {
        const matchesCoord =
          camp.coordinadores.some(
            (c) => normalizarCampana(c) === normalizarCampana(selectedCoordinador),
          ) || normalizarCampana(camp.coordinadorPrincipal) === normalizarCampana(selectedCoordinador);
        if (!matchesCoord) return false;
      }
      if (selectedCampana) {
        if (normalizarCampana(camp.nombre) !== normalizarCampana(selectedCampana)) return false;
      }
      if (selectedEstadoServidor) {
        if (camp.estadoServidor !== selectedEstadoServidor) return false;
      }
      if (selectedMonth !== null) {
        const hasDateMatch = camp.desarrollos.some((d) => {
          const parsed = parseDateString(d.fechaInicio);
          return (
            parsed &&
            parsed.getFullYear() === selectedYear &&
            parsed.getMonth() === selectedMonth
          );
        });
        if (camp.desarrollos.length > 0 && !hasDateMatch) return false;
      }
      return true;
    });

    const total = source.length;

    source.forEach((camp) => {
      const ind = camp.industriaPrincipal || "Sin Asignar";
      if (!indMap.has(ind)) {
        indMap.set(ind, new Set<string>());
      }
      indMap.get(ind)!.add(camp.normalizedKey);
    });

    return Array.from(indMap.entries())
      .map(([nombre, campSet]) => ({
        nombre,
        count: campSet.size,
        porcentaje: total > 0 ? ((campSet.size / total) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.count - a.count);
  }, [
    allUnifiedCampanas,
    selectedActividad,
    selectedDireccion,
    selectedCoordinador,
    selectedCampana,
    selectedEstadoServidor,
    selectedYear,
    selectedMonth,
  ]);

  // 3. Estados de Servidores de las campañas
  const serverMetrics: ServerMetrics = useMemo(() => {
    let enServidor = 0;
    let sinServidor = 0;
    let enMigracion = 0;

    const source = allUnifiedCampanas.filter((camp) => {
      if (selectedActividad === "ACTIVAS" && !camp.isActiva) return false;
      if (selectedActividad === "INACTIVAS" && camp.isActiva) return false;
      if (selectedDireccion) {
        const matchesDir =
          camp.direcciones.some(
            (d) => normalizarCampana(d) === normalizarCampana(selectedDireccion),
          ) || normalizarCampana(camp.direccionPrincipal) === normalizarCampana(selectedDireccion);
        if (!matchesDir) return false;
      }
      if (selectedCoordinador) {
        const matchesCoord =
          camp.coordinadores.some(
            (c) => normalizarCampana(c) === normalizarCampana(selectedCoordinador),
          ) || normalizarCampana(camp.coordinadorPrincipal) === normalizarCampana(selectedCoordinador);
        if (!matchesCoord) return false;
      }
      if (selectedIndustria) {
        const matchesInd =
          camp.industrias.some(
            (i) => normalizarCampana(i) === normalizarCampana(selectedIndustria),
          ) || normalizarCampana(camp.industriaPrincipal) === normalizarCampana(selectedIndustria);
        if (!matchesInd) return false;
      }
      if (selectedCampana) {
        if (normalizarCampana(camp.nombre) !== normalizarCampana(selectedCampana)) return false;
      }
      if (selectedMonth !== null) {
        const hasDateMatch = camp.desarrollos.some((d) => {
          const parsed = parseDateString(d.fechaInicio);
          return (
            parsed &&
            parsed.getFullYear() === selectedYear &&
            parsed.getMonth() === selectedMonth
          );
        });
        if (camp.desarrollos.length > 0 && !hasDateMatch) return false;
      }
      return true;
    });

    source.forEach((camp) => {
      if (camp.estadoServidor === "SI") enServidor++;
      else if (camp.estadoServidor === "MIGRACION") enMigracion++;
      else sinServidor++;
    });

    const total = source.length || 1;

    return {
      enServidor,
      sinServidor,
      enMigracion,
      pctEnServidor: Math.round((enServidor / total) * 100),
      pctSinServidor: Math.round((sinServidor / total) * 100),
      pctEnMigracion: Math.round((enMigracion / total) * 100),
    };
  }, [
    allUnifiedCampanas,
    selectedActividad,
    selectedDireccion,
    selectedCoordinador,
    selectedIndustria,
    selectedCampana,
    selectedYear,
    selectedMonth,
  ]);

  // Filtrado de la tabla local por buscador
  const tableFilteredCampanas = useMemo(() => {
    if (!tableSearch.trim()) return filteredCampanas;
    const term = normalizarCampana(tableSearch);
    return filteredCampanas.filter(
      (c) =>
        normalizarCampana(c.nombre).includes(term) ||
        normalizarCampana(c.coordinadorPrincipal).includes(term) ||
        normalizarCampana(c.industriaPrincipal).includes(term) ||
        c.coordinadores.some((coord) => normalizarCampana(coord).includes(term)),
    );
  }, [filteredCampanas, tableSearch]);

  return {
    allUnifiedCampanas,
    unifiedCampanasOptions,
    actividadCounts,
    filteredCampanas,
    coordinadoresMetrics,
    industriasMetrics,
    serverMetrics,
    tableFilteredCampanas,
  };
}
