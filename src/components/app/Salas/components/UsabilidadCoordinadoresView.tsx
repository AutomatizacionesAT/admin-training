import { useState, useMemo } from 'react';
import {
  Trophy, Medal, Users, Calendar, Clock,
  ArrowUpDown, Search, Download, ChevronLeft, ChevronRight,
  AlertCircle, TrendingUp, TrendingDown, Sun, Moon, MapPin, Eye,
  X, Layers, UserCheck, Building2, ShieldAlert
} from 'lucide-react';
import type { SalaRecord, AsignacionRecord } from '../utils/types';
import { parseAsignacionDate, formatAsignacionRango } from '../utils/asignacionUtils';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { SALAS_USERS } from '../../../../context/AuthContext';

const EXCLUDED_SUPER_ADMINS = new Set([
  'JHON JAIRO GIRALDO RODRIGUEZ',
  'DIANA MARITZA PEDREROS CUERVO',
  'SEBASTIAN SANTOS POLANIA',
  'SINDY JULIETH ROJAS OROZCO',
  'ALVARO JAVIER GARZON ZAMBRANO',
  'CARLOS DASTE',
  'JOHAN SEBASTIAN QUINCHIA VARGAS',
  'ADMINISTRADOR',
  'ADMIN',
]);

interface Props {
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
}

type DimensionMode = 'coordinadores' | 'salas' | 'sedes';
type TimeframeMode = 'semanal' | 'mensual' | 'historico';
type SortOrder = 'mas_uso' | 'menos_uso';
type EstadoFilter = 'APROBADAS' | 'TODAS';
type TurnoFilter = 'ALL' | 'AM' | 'PM';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface CoordinatorStats {
  nombre: string;
  totalAsignaciones: number;
  aprobadas: number;
  pendientes: number;
  rechazadas: number;
  diasOcupados: number;
  totalPersonas: number;
  turnos: { am: number; pm: number };
  sedes: Record<string, number>;
  sedePrincipal: string;
  salasUsadas: Record<string, number>;
  salaPrincipal: string;
  campanas: string[];
  asignaciones: AsignacionRecord[];
}

interface SalaStats {
  sala: string;
  sede: string;
  tipo: string;
  capacidad: string;
  equipos: string;
  totalAsignaciones: number;
  aprobadas: number;
  pendientes: number;
  diasOcupados: number;
  totalPersonas: number;
  turnos: { am: number; pm: number };
  coordinadores: Record<string, number>;
  coordinadorPrincipal: string;
  campanas: string[];
  asignaciones: AsignacionRecord[];
}

interface SedeStats {
  sede: string;
  totalSalasFisicas: number;
  salasConUsoCount: number;
  totalAsignaciones: number;
  aprobadas: number;
  pendientes: number;
  diasOcupados: number;
  totalPersonas: number;
  turnos: { am: number; pm: number };
  coordinadores: Record<string, number>;
  coordinadorPrincipal: string;
  salasUsadas: Record<string, number>;
  salaPrincipal: string;
  campanas: string[];
  asignaciones: AsignacionRecord[];
}

function getTurnoFromHorario(horario: string): 'AM' | 'PM' {
  const h = (horario || '').toUpperCase();
  return h.startsWith('14') || h.startsWith('15') || h.startsWith('16') ? 'PM' : 'AM';
}

function isCoordinatorUnassigned(name?: string): boolean {
  if (!name) return true;
  const n = name.trim().toLowerCase();
  return (
    n === '' ||
    n === 'sin coordinador' ||
    n === 'sin cordinador' ||
    n === 'no asignado' ||
    n === 'sin asignar' ||
    n === '-' ||
    n === 'n/a' ||
    n === 'na' ||
    n === 'ninguno'
  );
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-purple-600 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-600 to-red-600',
    'from-cyan-600 to-blue-600',
    'from-violet-600 to-purple-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'CO';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function UsabilidadCoordinadoresView({ salas, asignaciones }: Props) {
  // ─── Analytics Dimension (Coordinadores vs Salas vs Sedes) ──────────────────
  const [dimension, setDimension] = useState<DimensionMode>('coordinadores');

  // ─── Timeframe State ────────────────────────────────────────────────────────
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>('mensual');

  // Month navigation: default to September 2026
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 = Septiembre

  // Week navigation: base date within week
  const [weekBaseDate, setWeekBaseDate] = useState<Date>(() => new Date(2026, 8, 23));

  // ─── Filters & Search ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [sedeFilter, setSedeFilter] = useState<string>('ALL');
  const [turnoFilter, setTurnoFilter] = useState<TurnoFilter>('ALL');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('APROBADAS');
  const [sortOrder, setSortOrder] = useState<SortOrder>('mas_uso');
  const [coordFilterTab, setCoordFilterTab] = useState<'all' | 'con_uso' | 'sin_uso'>('all');

  // Detail Modals
  const [selectedCoordDetail, setSelectedCoordDetail] = useState<CoordinatorStats | null>(null);
  const [selectedSalaDetail, setSelectedSalaDetail] = useState<SalaStats | null>(null);
  const [selectedSedeDetail, setSelectedSedeDetail] = useState<SedeStats | null>(null);
  const [showUnassignedModal, setShowUnassignedModal] = useState<boolean>(false);

  // Histórico de reservas sin coordinador asignado
  const allHistoricalUnassigned = useMemo(() => {
    return asignaciones.filter(a => isCoordinatorUnassigned(a.coordinador));
  }, [asignaciones]);

  // ─── Available Sedes ───────────────────────────────────────────────────────
  const sedesList = useMemo(() => {
    const s = new Set<string>();
    salas.forEach(sala => { if (sala.sede) s.add(sala.sede.trim()); });
    asignaciones.forEach(a => { if (a.sede) s.add(a.sede.trim()); });
    return Array.from(s).sort();
  }, [salas, asignaciones]);

  // ─── Date Range Determination ──────────────────────────────────────────────
  const { dateRangeStart, dateRangeEnd, labelPeriodo } = useMemo(() => {
    if (timeframeMode === 'mensual') {
      const start = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        labelPeriodo: `${MONTH_NAMES[selectedMonth]} de ${selectedYear}`,
      };
    }

    if (timeframeMode === 'semanal') {
      const d = new Date(weekBaseDate);
      const day = d.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const formatD = (date: Date) =>
        `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

      return {
        dateRangeStart: monday,
        dateRangeEnd: sunday,
        labelPeriodo: `Semana ${formatD(monday)} - ${formatD(sunday)} de ${monday.getFullYear()}`,
      };
    }

    // Histórico
    return {
      dateRangeStart: null,
      dateRangeEnd: null,
      labelPeriodo: 'Histórico Completo (Todas las fechas)',
    };
  }, [timeframeMode, selectedYear, selectedMonth, weekBaseDate]);

  // ─── Navigation Handlers ───────────────────────────────────────────────────
  const handlePrevPeriod = () => {
    if (timeframeMode === 'mensual') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(y => y - 1);
      } else {
        setSelectedMonth(m => m - 1);
      }
    } else if (timeframeMode === 'semanal') {
      setWeekBaseDate(prev => {
        const next = new Date(prev);
        next.setDate(prev.getDate() - 7);
        return next;
      });
    }
  };

  const handleNextPeriod = () => {
    if (timeframeMode === 'mensual') {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(y => y + 1);
      } else {
        setSelectedMonth(m => m + 1);
      }
    } else if (timeframeMode === 'semanal') {
      setWeekBaseDate(prev => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + 7);
        return next;
      });
    }
  };

  const handleResetCurrent = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setWeekBaseDate(now);
  };

  // ─── Process and Aggregate Data ────────────────────────────────────────────
  const {
    coordinatorsData,
    salasData,
    sedesData,
    totalSalasPeriodo,
    totalDiasGlobales,
    totalPersonasGlobales,
    unassignedStats,
  } = useMemo(() => {
    const coordMap = new Map<string, CoordinatorStats>();
    const salasMap = new Map<string, SalaStats>();
    const sedesMap = new Map<string, SedeStats>();

    // Pre-cargar todos los coordinadores oficiales de SALAS_USERS (excluyendo Super Admins)
    SALAS_USERS.forEach(u => {
      const norm = u.nombre.trim().toUpperCase();
      if (u.rol === 'COORDINADOR' && !EXCLUDED_SUPER_ADMINS.has(norm)) {
        const cName = u.nombre.trim();
        if (!coordMap.has(cName)) {
          coordMap.set(cName, {
            nombre: cName,
            totalAsignaciones: 0,
            aprobadas: 0,
            pendientes: 0,
            rechazadas: 0,
            diasOcupados: 0,
            totalPersonas: 0,
            turnos: { am: 0, pm: 0 },
            sedes: {},
            sedePrincipal: 'Sin registros',
            salasUsadas: {},
            salaPrincipal: 'Sin reservas',
            campanas: [],
            asignaciones: [],
          });
        }
      }
    });

    // Inicializar mapa de salas con el catálogo completo
    salas.forEach(s => {
      const roomKey = s.sala.trim();
      if (!salasMap.has(roomKey)) {
        salasMap.set(roomKey, {
          sala: roomKey,
          sede: s.sede || 'N/A',
          tipo: s.tipo || 'ROTATIVA',
          capacidad: s.capacidad || '0',
          equipos: s.equipos || '0',
          totalAsignaciones: 0,
          aprobadas: 0,
          pendientes: 0,
          diasOcupados: 0,
          totalPersonas: 0,
          turnos: { am: 0, pm: 0 },
          coordinadores: {},
          coordinadorPrincipal: 'Sin reservas',
          campanas: [],
          asignaciones: [],
        });
      }
    });

    // Inicializar mapa de sedes con las sedes disponibles
    sedesList.forEach(sName => {
      const salasSede = salas.filter(s => s.sede?.trim().toUpperCase() === sName.toUpperCase());
      const uniqueRooms = new Set(salasSede.map(s => s.sala.trim())).size;
      sedesMap.set(sName, {
        sede: sName,
        totalSalasFisicas: uniqueRooms,
        salasConUsoCount: 0,
        totalAsignaciones: 0,
        aprobadas: 0,
        pendientes: 0,
        diasOcupados: 0,
        totalPersonas: 0,
        turnos: { am: 0, pm: 0 },
        coordinadores: {},
        coordinadorPrincipal: 'Sin reservas',
        salasUsadas: {},
        salaPrincipal: 'Sin reservas',
        campanas: [],
        asignaciones: [],
      });
    });

    let diasAcumulados = 0;
    let personasAcumuladas = 0;
    let unassignedCount = 0;
    let unassignedDias = 0;
    let unassignedPersonas = 0;
    const unassignedList: AsignacionRecord[] = [];
    const salasSet = new Set<string>();

    asignaciones.forEach(asig => {
      const estado = asig.estadoAsignacion?.trim().toUpperCase() || 'APROBADO';
      if (estadoFilter === 'APROBADAS' && estado !== 'APROBADO') return;

      if (sedeFilter !== 'ALL' && asig.sede?.trim().toUpperCase() !== sedeFilter.toUpperCase()) {
        return;
      }

      const asigTurno = getTurnoFromHorario(asig.horario);
      if (turnoFilter !== 'ALL' && asigTurno !== turnoFilter) {
        return;
      }

      const ini = parseAsignacionDate(asig.fechaInicial);
      const fin = parseAsignacionDate(asig.fechaFin) || ini;

      let effectiveDays = 1;

      if (dateRangeStart && dateRangeEnd) {
        if (!ini && !fin) return;
        const startCompare = ini || fin!;
        const endCompare = fin || ini!;

        if (startCompare > dateRangeEnd || endCompare < dateRangeStart) {
          return;
        }

        const clampStart = Math.max(startCompare.getTime(), dateRangeStart.getTime());
        const clampEnd = Math.min(endCompare.getTime(), dateRangeEnd.getTime());
        const ms = clampEnd - clampStart;
        effectiveDays = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
      } else if (ini && fin) {
        const ms = fin.getTime() - ini.getTime();
        effectiveDays = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
      }

      const personas = parseInt(asig.dPersonas) || 0;
      diasAcumulados += effectiveDays;
      personasAcumuladas += personas;
      if (asig.sala) salasSet.add(asig.sala);

      const isUnassigned = isCoordinatorUnassigned(asig.coordinador);
      const coordName = !isUnassigned ? asig.coordinador.trim() : '';
      const isSuperAdmin = coordName ? EXCLUDED_SUPER_ADMINS.has(coordName.toUpperCase()) : false;

      if (isUnassigned) {
        unassignedCount += 1;
        unassignedDias += effectiveDays;
        unassignedPersonas += personas;
        unassignedList.push(asig);
      }

      // ── 1. Agrupar por Coordinador (excluyendo Super Admins) ──
      if (!isUnassigned && coordName && !isSuperAdmin) {
        // Encontrar clave existente insensible a mayúsculas
        let matchedKey = '';
        for (const key of coordMap.keys()) {
          if (key.toUpperCase() === coordName.toUpperCase()) {
            matchedKey = key;
            break;
          }
        }
        const coordKey = matchedKey || coordName;

        if (!coordMap.has(coordKey)) {
          coordMap.set(coordKey, {
            nombre: coordKey,
            totalAsignaciones: 0,
            aprobadas: 0,
            pendientes: 0,
            rechazadas: 0,
            diasOcupados: 0,
            totalPersonas: 0,
            turnos: { am: 0, pm: 0 },
            sedes: {},
            sedePrincipal: 'Sin registros',
            salasUsadas: {},
            salaPrincipal: 'Sin reservas',
            campanas: [],
            asignaciones: [],
          });
        }
        const cStat = coordMap.get(coordKey)!;
        cStat.totalAsignaciones += 1;
        if (estado === 'APROBADO') cStat.aprobadas += 1;
        else if (estado === 'PENDIENTE') cStat.pendientes += 1;
        else if (estado === 'RECHAZADO') cStat.rechazadas += 1;

        cStat.diasOcupados += effectiveDays;
        cStat.totalPersonas += personas;
        if (asigTurno === 'AM') cStat.turnos.am += 1;
        else cStat.turnos.pm += 1;

        if (asig.sede) cStat.sedes[asig.sede] = (cStat.sedes[asig.sede] || 0) + 1;
        if (asig.sala) cStat.salasUsadas[asig.sala] = (cStat.salasUsadas[asig.sala] || 0) + 1;
        if (asig.campana && !cStat.campanas.includes(asig.campana)) cStat.campanas.push(asig.campana);
        cStat.asignaciones.push(asig);
      }

      // ── 2. Agrupar por Sala ──
      const roomKey = asig.sala?.trim();
      if (roomKey) {
        if (!salasMap.has(roomKey)) {
          salasMap.set(roomKey, {
            sala: roomKey,
            sede: asig.sede || 'N/A',
            tipo: 'ROTATIVA',
            capacidad: asig.dPersonas || '0',
            equipos: '0',
            totalAsignaciones: 0,
            aprobadas: 0,
            pendientes: 0,
            diasOcupados: 0,
            totalPersonas: 0,
            turnos: { am: 0, pm: 0 },
            coordinadores: {},
            coordinadorPrincipal: 'Sin reservas',
            campanas: [],
            asignaciones: [],
          });
        }
        const rStat = salasMap.get(roomKey)!;
        rStat.totalAsignaciones += 1;
        if (estado === 'APROBADO') rStat.aprobadas += 1;
        else if (estado === 'PENDIENTE') rStat.pendientes += 1;

        rStat.diasOcupados += effectiveDays;
        rStat.totalPersonas += personas;
        if (asigTurno === 'AM') rStat.turnos.am += 1;
        else rStat.turnos.pm += 1;

        if (coordName) {
          rStat.coordinadores[coordName] = (rStat.coordinadores[coordName] || 0) + 1;
        }
        if (asig.campana && !rStat.campanas.includes(asig.campana)) {
          rStat.campanas.push(asig.campana);
        }
        rStat.asignaciones.push(asig);
      }

      // ── 3. Agrupar por Sede ──
      const sedeKey = asig.sede?.trim();
      if (sedeKey) {
        if (!sedesMap.has(sedeKey)) {
          sedesMap.set(sedeKey, {
            sede: sedeKey,
            totalSalasFisicas: 0,
            salasConUsoCount: 0,
            totalAsignaciones: 0,
            aprobadas: 0,
            pendientes: 0,
            diasOcupados: 0,
            totalPersonas: 0,
            turnos: { am: 0, pm: 0 },
            coordinadores: {},
            coordinadorPrincipal: 'Sin reservas',
            salasUsadas: {},
            salaPrincipal: 'Sin reservas',
            campanas: [],
            asignaciones: [],
          });
        }
        const sStat = sedesMap.get(sedeKey)!;
        sStat.totalAsignaciones += 1;
        if (estado === 'APROBADO') sStat.aprobadas += 1;
        else if (estado === 'PENDIENTE') sStat.pendientes += 1;

        sStat.diasOcupados += effectiveDays;
        sStat.totalPersonas += personas;
        if (asigTurno === 'AM') sStat.turnos.am += 1;
        else sStat.turnos.pm += 1;

        if (coordName) {
          sStat.coordinadores[coordName] = (sStat.coordinadores[coordName] || 0) + 1;
        }
        if (asig.sala) {
          sStat.salasUsadas[asig.sala] = (sStat.salasUsadas[asig.sala] || 0) + 1;
        }
        if (asig.campana && !sStat.campanas.includes(asig.campana)) {
          sStat.campanas.push(asig.campana);
        }
        sStat.asignaciones.push(asig);
      }
    });

    // Finalizar lista de coordinadores
    const coordList = Array.from(coordMap.values()).map(item => {
      let maxSede = 'N/A';
      let maxSCount = 0;
      Object.entries(item.sedes).forEach(([s, c]) => {
        if (c > maxSCount) { maxSCount = c; maxSede = s; }
      });
      let maxSala = 'N/A';
      let maxRCount = 0;
      Object.entries(item.salasUsadas).forEach(([s, c]) => {
        if (c > maxRCount) { maxRCount = c; maxSala = s; }
      });
      return { ...item, sedePrincipal: maxSede, salaPrincipal: maxSala };
    });

    // Finalizar lista de salas
    const salasResultList = Array.from(salasMap.values()).map(item => {
      let maxCoord = 'Sin reservas';
      let maxCCount = 0;
      Object.entries(item.coordinadores).forEach(([c, count]) => {
        if (count > maxCCount) { maxCCount = count; maxCoord = c; }
      });
      return { ...item, coordinadorPrincipal: maxCoord };
    });

    // Finalizar lista de sedes
    const sedesResultList = Array.from(sedesMap.values()).map(item => {
      let maxCoord = 'Sin reservas';
      let maxCCount = 0;
      Object.entries(item.coordinadores).forEach(([c, count]) => {
        if (count > maxCCount) { maxCCount = count; maxCoord = c; }
      });
      let maxSala = 'Sin reservas';
      let maxRCount = 0;
      Object.entries(item.salasUsadas).forEach(([s, count]) => {
        if (count > maxRCount) { maxRCount = count; maxSala = s; }
      });
      return {
        ...item,
        salasConUsoCount: Object.keys(item.salasUsadas).length,
        coordinadorPrincipal: maxCoord,
        salaPrincipal: maxSala,
      };
    });

    return {
      coordinatorsData: coordList,
      salasData: salasResultList,
      sedesData: sedesResultList,
      totalSalasPeriodo: salasSet.size,
      totalDiasGlobales: diasAcumulados,
      totalPersonasGlobales: personasAcumuladas,
      unassignedStats: {
        count: unassignedCount,
        dias: unassignedDias,
        personas: unassignedPersonas,
        asignaciones: unassignedList,
      },
    };
  }, [salas, asignaciones, estadoFilter, sedeFilter, turnoFilter, sedesList, dateRangeStart, dateRangeEnd]);

  // ─── Filtered and Sorted Coordinators ──────────────────────────────────────
  const processedCoordinators = useMemo(() => {
    let result = [...coordinatorsData];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        c =>
          c.nombre.toLowerCase().includes(q) ||
          c.campanas.some(camp => camp.toLowerCase().includes(q)) ||
          c.salaPrincipal.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortOrder === 'mas_uso') {
        if (b.diasOcupados !== a.diasOcupados) return b.diasOcupados - a.diasOcupados;
        if (b.totalAsignaciones !== a.totalAsignaciones) return b.totalAsignaciones - a.totalAsignaciones;
        return b.totalPersonas - a.totalPersonas;
      } else {
        if (a.diasOcupados !== b.diasOcupados) return a.diasOcupados - b.diasOcupados;
        if (a.totalAsignaciones !== b.totalAsignaciones) return a.totalAsignaciones - b.totalAsignaciones;
        return a.totalPersonas - b.totalPersonas;
      }
    });
    return result;
  }, [coordinatorsData, search, sortOrder]);

  const rankedCoordDesc = useMemo(() => {
    return [...coordinatorsData].sort((a, b) => {
      if (b.diasOcupados !== a.diasOcupados) return b.diasOcupados - a.diasOcupados;
      return b.totalAsignaciones - a.totalAsignaciones;
    });
  }, [coordinatorsData]);

  // ─── Filtered and Sorted Salas ─────────────────────────────────────────────
  const processedSalas = useMemo(() => {
    let result = [...salasData];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        s =>
          s.sala.toLowerCase().includes(q) ||
          s.sede.toLowerCase().includes(q) ||
          s.coordinadorPrincipal.toLowerCase().includes(q) ||
          s.campanas.some(camp => camp.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      if (sortOrder === 'mas_uso') {
        if (b.diasOcupados !== a.diasOcupados) return b.diasOcupados - a.diasOcupados;
        return b.totalAsignaciones - a.totalAsignaciones;
      } else {
        if (a.diasOcupados !== b.diasOcupados) return a.diasOcupados - b.diasOcupados;
        return a.totalAsignaciones - b.totalAsignaciones;
      }
    });
    return result;
  }, [salasData, search, sortOrder]);

  const rankedSalasDesc = useMemo(() => {
    return [...salasData].sort((a, b) => {
      if (b.diasOcupados !== a.diasOcupados) return b.diasOcupados - a.diasOcupados;
      return b.totalAsignaciones - a.totalAsignaciones;
    });
  }, [salasData]);

  // ─── Filtered and Sorted Sedes ─────────────────────────────────────────────
  const processedSedes = useMemo(() => {
    let result = [...sedesData];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        s =>
          s.sede.toLowerCase().includes(q) ||
          s.coordinadorPrincipal.toLowerCase().includes(q) ||
          s.salaPrincipal.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortOrder === 'mas_uso') {
        return b.diasOcupados - a.diasOcupados;
      } else {
        return a.diasOcupados - b.diasOcupados;
      }
    });
    return result;
  }, [sedesData, search, sortOrder]);

  // ─── Stats and Podium Highlights ───────────────────────────────────────────
  // Coordinadores
  const activeCoordinators = useMemo(() => {
    return rankedCoordDesc.filter(c => c.diasOcupados > 0);
  }, [rankedCoordDesc]);

  const top1Coord = activeCoordinators[0] || null;
  const top2Coord = activeCoordinators[1] || null;
  const top3Coord = activeCoordinators[2] || null;
  const maxDaysCoord = top1Coord ? Math.max(top1Coord.diasOcupados, 1) : 1;
  const coordsSinUsoCount = coordinatorsData.filter(c => c.diasOcupados === 0).length;
  const coordsConUsoCount = coordinatorsData.filter(c => c.diasOcupados > 0).length;
  const leastUsedCoord = activeCoordinators.length > 1 ? activeCoordinators[activeCoordinators.length - 1] : null;

  const displayCoordinators = useMemo(() => {
    if (coordFilterTab === 'con_uso') return processedCoordinators.filter(c => c.diasOcupados > 0);
    if (coordFilterTab === 'sin_uso') return processedCoordinators.filter(c => c.diasOcupados === 0);
    return processedCoordinators;
  }, [processedCoordinators, coordFilterTab]);

  // Salas
  const top1Sala = rankedSalasDesc[0] || null;
  const top2Sala = rankedSalasDesc[1] || null;
  const top3Sala = rankedSalasDesc[2] || null;
  const salasSinUsoCount = salasData.filter(s => s.diasOcupados === 0).length;
  const leastUsedSala = useMemo(() => {
    const withUse = rankedSalasDesc.filter(s => s.diasOcupados > 0);
    return withUse.length > 1 ? withUse[withUse.length - 1] : null;
  }, [rankedSalasDesc]);

  // ─── Export to Excel ───────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Admin Training';
      workbook.created = new Date();

      if (dimension === 'coordinadores') {
        const sheet = workbook.addWorksheet('Usabilidad Coordinadores');
        sheet.addRow(['REPORTE DE USABILIDAD Y RENDIMIENTO DE COORDINADORES EN SALAS']);
        sheet.addRow([`Período: ${labelPeriodo}`]);
        sheet.addRow([`Generado el: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`]);
        sheet.addRow([]);

        const headerRow = sheet.addRow([
          'Ranking', 'Coordinador', 'Total Asignaciones', 'Aprobadas', 'Pendientes',
          'Días de Sala Ocupados', 'Personas Formadas', 'Sede Principal', 'Sala Más Usada',
          'Turno Preferente', 'Campañas Asociadas',
        ]);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '005082' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        processedCoordinators.forEach((coord, idx) => {
          const turnoText = coord.turnos.am > coord.turnos.pm ? 'Mañana (AM)' : coord.turnos.pm > coord.turnos.am ? 'Tarde (PM)' : 'Mixto';
          sheet.addRow([
            idx + 1, coord.nombre, coord.totalAsignaciones, coord.aprobadas, coord.pendientes,
            coord.diasOcupados, coord.totalPersonas, coord.sedePrincipal, coord.salaPrincipal,
            turnoText, coord.campanas.join(', '),
          ]);
        });
        sheet.columns.forEach(col => { col.width = 22; });
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reporte_Usabilidad_Coordinadores_${Date.now()}.xlsx`);
      } else if (dimension === 'salas') {
        const sheet = workbook.addWorksheet('Usabilidad Salas');
        sheet.addRow(['REPORTE DE USABILIDAD Y OCUPACIÓN DE SALAS']);
        sheet.addRow([`Período: ${labelPeriodo}`]);
        sheet.addRow([]);

        const headerRow = sheet.addRow([
          'Ranking', 'Sala', 'Sede', 'Tipo', 'Capacidad', 'Reservas', 'Días Ocupados', 'Personas Formadas', 'Turno Preferente', 'Coordinador Más Frecuente',
        ]);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F37021' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        processedSalas.forEach((sala, idx) => {
          const turnoText = sala.turnos.am > sala.turnos.pm ? 'Mañana' : sala.turnos.pm > sala.turnos.am ? 'Tarde' : 'Mixto';
          sheet.addRow([
            idx + 1, sala.sala, sala.sede, sala.tipo, sala.capacidad, sala.totalAsignaciones, sala.diasOcupados, sala.totalPersonas, turnoText, sala.coordinadorPrincipal,
          ]);
        });
        sheet.columns.forEach(col => { col.width = 22; });
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reporte_Usabilidad_Salas_${Date.now()}.xlsx`);
      } else {
        const sheet = workbook.addWorksheet('Usabilidad Sedes');
        sheet.addRow(['REPORTE DE USABILIDAD Y OCUPACIÓN POR SEDES']);
        sheet.addRow([`Período: ${labelPeriodo}`]);
        sheet.addRow([]);

        const headerRow = sheet.addRow([
          'Sede', 'Salas Físicas', 'Salas con Ocupación', 'Total Reservas', 'Días de Sala Acumulados', 'Personas Formadas', 'Sala Más Usada', 'Coordinador Líder',
        ]);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        processedSedes.forEach(sede => {
          sheet.addRow([
            sede.sede, sede.totalSalasFisicas, sede.salasConUsoCount, sede.totalAsignaciones, sede.diasOcupados, sede.totalPersonas, sede.salaPrincipal, sede.coordinadorPrincipal,
          ]);
        });
        sheet.columns.forEach(col => { col.width = 24; });
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reporte_Usabilidad_Sedes_${Date.now()}.xlsx`);
      }
    } catch (err) {
      console.error('Error al exportar reporte:', err);
    }
  };

  const handleExportUnassigned = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Admin Training';
      workbook.created = new Date();
      const sheet = workbook.addWorksheet('Sin Coordinador');
      sheet.addRow(['REPORTE DE ASIGNACIONES HISTÓRICAS SIN COORDINADOR REGISTRADO (GOOGLE SHEETS)']);
      sheet.addRow([`Generado el: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`]);
      sheet.addRow([`Total de registros: ${allHistoricalUnassigned.length} reservas`]);
      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Fila Sheet', 'Campaña', 'Requerimiento', 'Sala', 'Sede', 'Formador',
        'Fecha Inicio', 'Fecha Fin', 'Horario / Turno', 'Aforo (Personas)', 'Estado'
      ]);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D97706' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      allHistoricalUnassigned.forEach(asig => {
        sheet.addRow([
          asig.rowIndex,
          asig.campana,
          asig.req || 'N/A',
          asig.sala,
          asig.sede,
          asig.formador || 'Sin Formador',
          asig.fechaInicial,
          asig.fechaFin,
          asig.horario,
          asig.dPersonas,
          asig.estadoAsignacion,
        ]);
      });
      sheet.columns.forEach(col => { col.width = 22; });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Reservas_Sin_Coordinador_${Date.now()}.xlsx`);
    } catch (err) {
      console.error('Error al exportar reservas sin coordinador:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── HEADER DE CONTROLES, DIMENSIONES Y FILTROS ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-[#F37021]">
                Métricas de Rendimiento & Ocupación
              </span>
            </div>

            {/* Dimension Selector Tabs (Coordinadores | Salas | Sedes) */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDimension('coordinadores')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${dimension === 'coordinadores'
                    ? 'bg-[#005082] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  Por Coordinadores
                </button>

                <button
                  type="button"
                  onClick={() => setDimension('salas')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${dimension === 'salas'
                    ? 'bg-[#005082] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                  <Building2 className="w-4 h-4" />
                  Por Salas
                </button>

                <button
                  type="button"
                  onClick={() => setDimension('sedes')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${dimension === 'sedes'
                    ? 'bg-[#005082] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                  <MapPin className="w-4 h-4" />
                  Por Sedes
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-400 pl-2">
                {dimension === 'coordinadores' && `• ${processedCoordinators.length} coordinadores evaluados`}
                {dimension === 'salas' && `• ${processedSalas.length} salas analizadas (${salasSinUsoCount} sin uso)`}
                {dimension === 'sedes' && `• ${processedSedes.length} sedes operativas`}
              </span>
            </div>
          </div>

          {/* Timeframe Mode Selector Pills & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTimeframeMode('semanal')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${timeframeMode === 'semanal'
                  ? 'bg-[#005082] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Semanal
              </button>
              <button
                type="button"
                onClick={() => setTimeframeMode('mensual')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${timeframeMode === 'mensual'
                  ? 'bg-[#005082] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setTimeframeMode('historico')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${timeframeMode === 'historico'
                  ? 'bg-[#005082] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Histórico
              </button>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Descargar reporte en Excel según dimensión activa"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Temporal Navigation Banner & Quick Filter Controls */}
        <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {timeframeMode !== 'historico' && (
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrevPeriod}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-xs transition cursor-pointer"
                  title="Período anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 text-xs font-bold text-[#005082] min-w-[200px] text-center select-none">
                  {labelPeriodo}
                </div>
                <button
                  type="button"
                  onClick={handleNextPeriod}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-xs transition cursor-pointer"
                  title="Siguiente período"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {timeframeMode !== 'historico' && (
              <button
                type="button"
                onClick={handleResetCurrent}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#005082] bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Hoy
              </button>
            )}

            {timeframeMode === 'historico' && (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">
                📊 Mostrando todos los registros históricos
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sede */}
            <select
              value={sedeFilter}
              onChange={e => setSedeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#005082]"
            >
              <option value="ALL">Todas las Sedes</option>
              {sedesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Turno */}
            <select
              value={turnoFilter}
              onChange={e => setTurnoFilter(e.target.value as TurnoFilter)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#005082]"
            >
              <option value="ALL">Todos los Turnos</option>
              <option value="AM">☀️ Mañana (06:00 - 14:00)</option>
              <option value="PM">🌙 Tarde (14:00 - 22:00)</option>
            </select>

            {/* Estado */}
            <select
              value={estadoFilter}
              onChange={e => setEstadoFilter(e.target.value as EstadoFilter)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#005082]"
            >
              <option value="APROBADAS">Solo Aprobadas</option>
              <option value="TODAS">Aprobadas + Pendientes</option>
            </select>

            {/* Sort order toggle (Más uso vs Menos uso) */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'mas_uso' ? 'menos_uso' : 'mas_uso')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${sortOrder === 'mas_uso'
                ? 'bg-blue-50 text-[#005082] border-blue-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === 'mas_uso' ? 'Mayor Ocupación' : 'Menor Ocupación'}
            </button>

            {/* Live Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={dimension === 'coordinadores' ? 'Buscar coordinador...' : dimension === 'salas' ? 'Buscar sala...' : 'Buscar sede...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005082]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTA SI HAY REGISTROS SIN COORDINADOR (Solo en vista coordinadores) ── */}
      {dimension === 'coordinadores' && unassignedStats.count > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl px-5 py-3 text-xs text-amber-900 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p>
            Nota: Existen <strong>{unassignedStats.count} reservas</strong> ({unassignedStats.dias} días de sala) que no tenían un coordinador especificado en el registro original. Se excluyen del ranking individual para evaluar únicamente a los coordinadores reales.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DIMENSIÓN 1: COORDINADORES
      ═══════════════════════════════════════════════════════════════════════ */}
      {dimension === 'coordinadores' && (
        <>
          {/* AVISO / ACCESO A REGISTROS SIN COORDINADOR */}
          {allHistoricalUnassigned.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50 border border-amber-200/90 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Datos Históricos sin Coordinador
                    </span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300/50">
                      {allHistoricalUnassigned.length} reservas ({allHistoricalUnassigned.reduce((acc, a) => {
                        const ini = parseAsignacionDate(a.fechaInicial);
                        const fin = parseAsignacionDate(a.fechaFin) || ini;
                        let d = 1;
                        if (ini && fin) {
                          const ms = fin.getTime() - ini.getTime();
                          d = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
                        }
                        return acc + d;
                      }, 0)} días de sala)
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Existen <strong className="font-extrabold text-amber-950">{allHistoricalUnassigned.length} reservas</strong> provenientes de Google Sheets sin coordinador asignado en el registro original. Se excluyen del ranking individual para evaluar únicamente a los coordinadores reales.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnassignedModal(true)}
                className="shrink-0 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Ver Detalle de las {allHistoricalUnassigned.length} Reservas
              </button>
            </div>
          )}

          {/* KPI HIGHLIGHTS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Top 1 Coordinator */}
            <div className="bg-gradient-to-br from-amber-500 via-[#F37021] to-orange-600 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                  Líder en Uso
                </span>
                <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  #1 Ranking
                </span>
              </div>
              <div className="my-2">
                <h3 className="text-lg font-black leading-tight line-clamp-1" title={top1Coord?.nombre || 'Sin datos'}>
                  {top1Coord?.nombre || 'Sin datos'}
                </h3>
                <p className="text-xs text-orange-100 mt-0.5">
                  {top1Coord ? `${top1Coord.diasOcupados} días · ${top1Coord.totalAsignaciones} reservas` : 'Sin actividad'}
                </p>
              </div>
              <div className="text-[11px] text-orange-100/90 flex items-center justify-between border-t border-white/20 pt-2">
                <span>Sala pref.:</span>
                <span className="font-bold truncate max-w-[120px]">{top1Coord?.salaPrincipal || 'N/A'}</span>
              </div>
            </div>

            {/* Coordinadores Activos */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Coordinadores
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#005082] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-slate-800">
                  {coordsConUsoCount} <span className="text-sm font-semibold text-slate-400">/ {coordinatorsData.length}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  con uso de salas en el período
                </p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Coordinadores sin uso:</span>
                <span className={`font-bold ${coordsSinUsoCount > 0 ? 'text-red-600' : 'text-slate-600'}`}>{coordsSinUsoCount} en rojo</span>
              </div>
            </div>

            {/* Total Días de Ocupación */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Días de Sala Ocupados
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-slate-800">
                  {totalDiasGlobales}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  días-sala acumulados
                </p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Salas involucradas:</span>
                <span className="font-bold text-indigo-600">{totalSalasPeriodo} salas</span>
              </div>
            </div>

            {/* Total Personas Formadas */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Personas Convocadas
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-slate-800">
                  {totalPersonasGlobales.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  puestos / alumnos formados
                </p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Prom. por reserva:</span>
                <span className="font-bold text-emerald-600">
                  {totalDiasGlobales > 0 ? Math.round(totalPersonasGlobales / totalDiasGlobales) : 0} pax/día
                </span>
              </div>
            </div>

            {/* Coordinadores Sin Uso / Menor Utilización */}
            <div className={`p-5 rounded-3xl shadow-sm flex flex-col justify-between ${coordsSinUsoCount > 0 ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white' : 'bg-slate-900 text-white'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${coordsSinUsoCount > 0 ? 'text-red-100' : 'text-slate-400'}`}>
                  <TrendingDown className={`w-3.5 h-3.5 ${coordsSinUsoCount > 0 ? 'text-red-200' : 'text-amber-400'}`} />
                  {coordsSinUsoCount > 0 ? 'Sin Uso de Salas' : 'Menor Uso'}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${coordsSinUsoCount > 0 ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {coordsSinUsoCount > 0 ? `${coordsSinUsoCount} Inactivos` : 'Oportunidad'}
                </span>
              </div>
              <div className="my-2">
                {coordsSinUsoCount > 0 ? (
                  <>
                    <div className="text-3xl font-black text-white">
                      {coordsSinUsoCount}
                    </div>
                    <p className="text-xs text-red-100 mt-0.5">
                      coordinadores con 0 días ocupados
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-black leading-tight text-white line-clamp-1" title={leastUsedCoord?.nombre || 'N/A'}>
                      {leastUsedCoord?.nombre || 'N/A'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {leastUsedCoord ? `${leastUsedCoord.diasOcupados} días · ${leastUsedCoord.totalAsignaciones} req` : 'Sin datos'}
                    </p>
                  </>
                )}
              </div>
              <div className={`text-[11px] border-t pt-2 flex items-center justify-between ${coordsSinUsoCount > 0 ? 'border-white/20 text-red-100' : 'border-slate-800 text-slate-400'}`}>
                <span>Estado:</span>
                <span className="font-bold">{coordsSinUsoCount > 0 ? 'En tabla en rojo (0 d)' : leastUsedCoord?.sedePrincipal || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* PODIO DE HONOR (TOP 3 COORDINADORES) */}
          {rankedCoordDesc.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Podio de Honor · Top Coordinadores con Mayor Demanda de Salas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top1Coord && (
                  <div className="bg-gradient-to-b from-amber-50/80 via-white to-white border-2 border-amber-300/80 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-yellow-500 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1.5">
                      <Medal className="w-4 h-4" /> 1° PUESTO · ORO
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(top1Coord.nombre)} text-white flex items-center justify-center font-black text-xl shadow-md`}>
                          {getInitials(top1Coord.nombre)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-900 truncate" title={top1Coord.nombre}>{top1Coord.nombre}</h4>
                          <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> Sede: {top1Coord.sedePrincipal}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-amber-50/60 rounded-2xl p-3 border border-amber-100 text-center mb-4">
                        <div><div className="text-lg font-black text-slate-800">{top1Coord.diasOcupados}</div><div className="text-[10px] text-slate-500">Días Sala</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top1Coord.totalAsignaciones}</div><div className="text-[10px] text-slate-500">Reservas</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top1Coord.totalPersonas}</div><div className="text-[10px] text-slate-500">Aforo</div></div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between"><span className="text-slate-400">Sala más usada:</span><span className="font-bold text-slate-800 truncate max-w-[170px]">{top1Coord.salaPrincipal}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Turno preferido:</span><span className="font-semibold text-slate-700 flex items-center gap-1">{top1Coord.turnos.am >= top1Coord.turnos.pm ? <><Sun className="w-3.5 h-3.5 text-amber-500" /> Mañana ({top1Coord.turnos.am})</> : <><Moon className="w-3.5 h-3.5 text-indigo-500" /> Tarde ({top1Coord.turnos.pm})</>}</span></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedCoordDetail(top1Coord)} className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Ver Historial de Reservas
                    </button>
                  </div>
                )}
                {top2Coord && (
                  <div className="bg-gradient-to-b from-slate-100/70 via-white to-white border border-slate-300 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-slate-500 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-xs flex items-center gap-1.5">
                      <Medal className="w-4 h-4 text-slate-200" /> 2° PUESTO · PLATA
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(top2Coord.nombre)} text-white flex items-center justify-center font-black text-xl shadow-md`}>
                          {getInitials(top2Coord.nombre)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-900 truncate" title={top2Coord.nombre}>{top2Coord.nombre}</h4>
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> Sede: {top2Coord.sedePrincipal}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center mb-4">
                        <div><div className="text-lg font-black text-slate-800">{top2Coord.diasOcupados}</div><div className="text-[10px] text-slate-500">Días Sala</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top2Coord.totalAsignaciones}</div><div className="text-[10px] text-slate-500">Reservas</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top2Coord.totalPersonas}</div><div className="text-[10px] text-slate-500">Aforo</div></div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between"><span className="text-slate-400">Sala más usada:</span><span className="font-bold text-slate-800 truncate max-w-[170px]">{top2Coord.salaPrincipal}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Turno preferido:</span><span className="font-semibold text-slate-700 flex items-center gap-1">{top2Coord.turnos.am >= top2Coord.turnos.pm ? <><Sun className="w-3.5 h-3.5 text-amber-500" /> Mañana ({top2Coord.turnos.am})</> : <><Moon className="w-3.5 h-3.5 text-indigo-500" /> Tarde ({top2Coord.turnos.pm})</>}</span></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedCoordDetail(top2Coord)} className="mt-5 w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Ver Historial de Reservas
                    </button>
                  </div>
                )}
                {top3Coord && (
                  <div className="bg-gradient-to-b from-orange-50/60 via-white to-white border border-amber-700/30 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-[#A0522D] text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-xs flex items-center gap-1.5">
                      <Medal className="w-4 h-4 text-amber-200" /> 3° PUESTO · BRONCE
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(top3Coord.nombre)} text-white flex items-center justify-center font-black text-xl shadow-md`}>
                          {getInitials(top3Coord.nombre)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-900 truncate" title={top3Coord.nombre}>{top3Coord.nombre}</h4>
                          <p className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> Sede: {top3Coord.sedePrincipal}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-amber-50/50 rounded-2xl p-3 border border-amber-200/50 text-center mb-4">
                        <div><div className="text-lg font-black text-slate-800">{top3Coord.diasOcupados}</div><div className="text-[10px] text-slate-500">Días Sala</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top3Coord.totalAsignaciones}</div><div className="text-[10px] text-slate-500">Reservas</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top3Coord.totalPersonas}</div><div className="text-[10px] text-slate-500">Aforo</div></div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between"><span className="text-slate-400">Sala más usada:</span><span className="font-bold text-slate-800 truncate max-w-[170px]">{top3Coord.salaPrincipal}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Turno preferido:</span><span className="font-semibold text-slate-700 flex items-center gap-1">{top3Coord.turnos.am >= top3Coord.turnos.pm ? <><Sun className="w-3.5 h-3.5 text-amber-500" /> Mañana ({top3Coord.turnos.am})</> : <><Moon className="w-3.5 h-3.5 text-indigo-500" /> Tarde ({top3Coord.turnos.pm})</>}</span></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedCoordDetail(top3Coord)} className="mt-5 w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Ver Historial de Reservas
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BARRAS DE RANKING DE COORDINADORES */}
          {activeCoordinators.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#005082]" />
                Ranking de Intensidad por Coordinadores (Días de Sala Ocupados)
              </h3>
              <div className="space-y-3.5">
                {activeCoordinators.slice(0, 10).map((coord, idx) => {
                  const pct = Math.round((coord.diasOcupados / maxDaysCoord) * 100);
                  const totalShare = totalDiasGlobales > 0 ? Math.round((coord.diasOcupados / totalDiasGlobales) * 100) : 0;
                  return (
                    <div key={coord.nombre} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 font-black text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-slate-800 group-hover:text-[#005082] transition truncate max-w-[220px] md:max-w-md">
                            {coord.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-400 font-medium hidden sm:inline">{coord.totalAsignaciones} req · {coord.totalPersonas} pax</span>
                          <span className="font-black text-slate-900">{coord.diasOcupados} días</span>
                          <span className="text-slate-400 font-semibold w-8 text-right">{totalShare}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#005082] to-[#F37021] transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TABLA DE COORDINADORES */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#005082]" />
                  Tabla General de Coordinadores
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Orden: <strong className="text-slate-700">{sortOrder === 'mas_uso' ? 'Mayor uso' : 'Menor uso'}</strong> ({displayCoordinators.length} de {processedCoordinators.length} coordinadores)
                </p>
              </div>

              {/* Pestañas de filtrado rápido */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setCoordFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    coordFilterTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Todos ({processedCoordinators.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCoordFilterTab('con_uso')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    coordFilterTab === 'con_uso'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  Con Uso ({coordsConUsoCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCoordFilterTab('sin_uso')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    coordFilterTab === 'sin_uso'
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  🔴 Sin Uso ({coordsSinUsoCount})
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 text-center">Pos</th>
                    <th className="py-3 px-4">Coordinador</th>
                    <th className="py-3 px-4 text-center">Reservas</th>
                    <th className="py-3 px-4 text-center">Días de Sala</th>
                    <th className="py-3 px-4 text-center">Aforo Pax</th>
                    <th className="py-3 px-4">Sede Principal</th>
                    <th className="py-3 px-4">Sala Más Frecuente</th>
                    <th className="py-3 px-4 text-center">Turno</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayCoordinators.map((coord, idx) => {
                    const isZero = coord.diasOcupados === 0;
                    return (
                      <tr
                        key={coord.nombre}
                        className={isZero ? "bg-red-50/25 hover:bg-red-50/60 transition-colors" : "hover:bg-slate-50/80 transition-colors"}
                      >
                        <td className="py-3 px-4 text-center font-black text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${getAvatarColor(coord.nombre)} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                              {getInitials(coord.nombre)}
                            </div>
                            <span className="font-extrabold text-slate-800">{coord.nombre}</span>
                            {isZero && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                                Sin uso
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-extrabold text-xs">
                              0
                            </span>
                          ) : (
                            <span className="font-extrabold text-slate-700">{coord.totalAsignaciones}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200 font-black text-xs inline-flex items-center gap-1 shadow-2xs">
                              0 d · Sin uso
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#005082] border border-blue-100 font-black">
                              {coord.diasOcupados} d
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="text-slate-400 font-medium">0 pax</span>
                          ) : (
                            <span className="font-bold text-slate-700">{coord.totalPersonas.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">
                          {isZero ? <span className="text-slate-400 italic text-xs">Sin registros</span> : coord.sedePrincipal}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold truncate max-w-[180px]">
                          {isZero ? <span className="text-slate-400 italic text-xs">Sin reservas</span> : coord.salaPrincipal}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              Sin actividad
                            </span>
                          ) : coord.turnos.am >= coord.turnos.pm ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <Sun className="w-3 h-3 text-amber-500" /> AM ({coord.turnos.am})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              <Moon className="w-3 h-3 text-indigo-500" /> PM ({coord.turnos.pm})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCoordDetail(coord)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#005082] hover:text-white text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DIMENSIÓN 2: POR SALAS
      ═══════════════════════════════════════════════════════════════════════ */}
      {dimension === 'salas' && (
        <>
          {/* KPI HIGHLIGHTS CARDS FOR SALAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Sala Líder */}
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-300" /> Sala Más Solicitada
                </span>
                <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">#1 Ocupación</span>
              </div>
              <div className="my-2">
                <h3 className="text-lg font-black leading-tight line-clamp-1" title={top1Sala?.sala || 'N/A'}>
                  {top1Sala?.sala || 'Sin actividad'}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {top1Sala ? `${top1Sala.diasOcupados} días · ${top1Sala.totalAsignaciones} reservas` : 'Sin datos'}
                </p>
              </div>
              <div className="text-[11px] text-indigo-200/90 flex items-center justify-between border-t border-white/20 pt-2">
                <span>Sede:</span>
                <span className="font-bold">{top1Sala?.sede || 'N/A'}</span>
              </div>
            </div>

            {/* Total Salas Activas */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Salas Con Ocupación</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#005082] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-slate-800">{totalSalasPeriodo}</div>
                <p className="text-xs text-slate-400 mt-0.5">de {salasData.length} salas registradas</p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Tasa activa:</span>
                <span className="font-bold text-[#005082]">
                  {salasData.length > 0 ? `${Math.round((totalSalasPeriodo / salasData.length) * 100)}% en uso` : '0%'}
                </span>
              </div>
            </div>

            {/* Salas Sin Uso (Oportunidad) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Salas Sin Uso (Disponibles)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-amber-700">{salasSinUsoCount}</div>
                <p className="text-xs text-slate-400 mt-0.5">salas 100% desocupadas en el período</p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Disponibilidad:</span>
                <span className="font-bold text-amber-700">Libres para programar</span>
              </div>
            </div>

            {/* Días Totales */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Días Sala Acumulados</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-slate-800">{totalDiasGlobales}</div>
                <p className="text-xs text-slate-400 mt-0.5">días de uso totales</p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Prom. por sala activa:</span>
                <span className="font-bold text-indigo-600">
                  {totalSalasPeriodo > 0 ? Math.round(totalDiasGlobales / totalSalasPeriodo) : 0} días/sala
                </span>
              </div>
            </div>

            {/* Sala con Menor Uso */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Menor Demanda
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">Bajo Uso</span>
              </div>
              <div className="my-2">
                <h3 className="text-sm font-black leading-tight text-white line-clamp-1" title={leastUsedSala?.sala || 'N/A'}>
                  {leastUsedSala?.sala || 'N/A'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {leastUsedSala ? `${leastUsedSala.diasOcupados} días · ${leastUsedSala.totalAsignaciones} req` : 'Sin datos'}
                </p>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>Sede:</span>
                <span className="font-bold text-amber-400">{leastUsedSala?.sede || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* PODIO DE SALAS (TOP 3) */}
          {rankedSalasDesc.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Podio de Ocupación · Top 3 Salas con Mayor Utilización
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top1Sala && (
                  <div className="bg-gradient-to-b from-amber-50/80 via-white to-white border-2 border-amber-300/80 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-yellow-500 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1.5">
                      <Medal className="w-4 h-4" /> 1° SALA MÁS USADA
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-900 truncate" title={top1Sala.sala}>{top1Sala.sala}</h4>
                          <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> Sede: {top1Sala.sede} ({top1Sala.tipo})
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-amber-50/60 rounded-2xl p-3 border border-amber-100 text-center mb-4">
                        <div><div className="text-lg font-black text-slate-800">{top1Sala.diasOcupados}</div><div className="text-[10px] text-slate-500">Días Uso</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top1Sala.totalAsignaciones}</div><div className="text-[10px] text-slate-500">Reservas</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top1Sala.totalPersonas}</div><div className="text-[10px] text-slate-500">Aforo</div></div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between"><span className="text-slate-400">Coord. principal:</span><span className="font-bold text-slate-800 truncate max-w-[170px]">{top1Sala.coordinadorPrincipal}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Turno preferido:</span><span className="font-semibold text-slate-700 flex items-center gap-1">{top1Sala.turnos.am >= top1Sala.turnos.pm ? <>☀️ Mañana ({top1Sala.turnos.am})</> : <>🌙 Tarde ({top1Sala.turnos.pm})</>}</span></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedSalaDetail(top1Sala)} className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Ver Reservas en esta Sala
                    </button>
                  </div>
                )}
                {top2Sala && (
                  <div className="bg-gradient-to-b from-slate-100/70 via-white to-white border border-slate-300 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-slate-500 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-xs flex items-center gap-1.5">
                      <Medal className="w-4 h-4 text-slate-200" /> 2° LUGAR
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-900 truncate" title={top2Sala.sala}>{top2Sala.sala}</h4>
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> Sede: {top2Sala.sede} ({top2Sala.tipo})
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center mb-4">
                        <div><div className="text-lg font-black text-slate-800">{top2Sala.diasOcupados}</div><div className="text-[10px] text-slate-500">Días Uso</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top2Sala.totalAsignaciones}</div><div className="text-[10px] text-slate-500">Reservas</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top2Sala.totalPersonas}</div><div className="text-[10px] text-slate-500">Aforo</div></div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between"><span className="text-slate-400">Coord. principal:</span><span className="font-bold text-slate-800 truncate max-w-[170px]">{top2Sala.coordinadorPrincipal}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Turno preferido:</span><span className="font-semibold text-slate-700 flex items-center gap-1">{top2Sala.turnos.am >= top2Sala.turnos.pm ? <>☀️ Mañana ({top2Sala.turnos.am})</> : <>🌙 Tarde ({top2Sala.turnos.pm})</>}</span></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedSalaDetail(top2Sala)} className="mt-5 w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Ver Reservas en esta Sala
                    </button>
                  </div>
                )}
                {top3Sala && (
                  <div className="bg-gradient-to-b from-orange-50/60 via-white to-white border border-amber-700/30 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 bg-[#A0522D] text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-xs flex items-center gap-1.5">
                      <Medal className="w-4 h-4 text-amber-200" /> 3° LUGAR
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-800 text-white flex items-center justify-center font-black text-lg shadow-md">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-900 truncate" title={top3Sala.sala}>{top3Sala.sala}</h4>
                          <p className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> Sede: {top3Sala.sede} ({top3Sala.tipo})
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-amber-50/50 rounded-2xl p-3 border border-amber-200/50 text-center mb-4">
                        <div><div className="text-lg font-black text-slate-800">{top3Sala.diasOcupados}</div><div className="text-[10px] text-slate-500">Días Uso</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top3Sala.totalAsignaciones}</div><div className="text-[10px] text-slate-500">Reservas</div></div>
                        <div><div className="text-lg font-black text-slate-800">{top3Sala.totalPersonas}</div><div className="text-[10px] text-slate-500">Aforo</div></div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between"><span className="text-slate-400">Coord. principal:</span><span className="font-bold text-slate-800 truncate max-w-[170px]">{top3Sala.coordinadorPrincipal}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Turno preferido:</span><span className="font-semibold text-slate-700 flex items-center gap-1">{top3Sala.turnos.am >= top3Sala.turnos.pm ? <>☀️ Mañana ({top3Sala.turnos.am})</> : <>🌙 Tarde ({top3Sala.turnos.pm})</>}</span></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedSalaDetail(top3Sala)} className="mt-5 w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Ver Reservas en esta Sala
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TABLA DE SALAS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#005082]" />
                  Tabla General de Ocupación por Salas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Orden: <strong className="text-slate-700">{sortOrder === 'mas_uso' ? 'Mayor ocupación' : 'Menor ocupación'}</strong> ({processedSalas.length} salas)
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 text-center">Pos</th>
                    <th className="py-3 px-4">Sala</th>
                    <th className="py-3 px-4">Sede</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-center">Capacidad</th>
                    <th className="py-3 px-4 text-center">Reservas</th>
                    <th className="py-3 px-4 text-center">Días Ocupada</th>
                    <th className="py-3 px-4 text-center">Turno</th>
                    <th className="py-3 px-4">Coordinador Principal</th>
                    <th className="py-3 px-4 text-center">Estado Uso</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {processedSalas.map((sala, idx) => {
                    const isZero = sala.diasOcupados === 0;
                    return (
                      <tr key={sala.sala} className={`hover:bg-slate-50/80 transition-colors ${isZero ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="py-3 px-4 text-center font-black text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-black text-slate-800">{sala.sala}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{sala.sede}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sala.tipo === 'EXCLUSIVA' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {sala.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{sala.capacidad} pax</td>
                        <td className="py-3 px-4 text-center font-extrabold text-slate-700">{sala.totalAsignaciones}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-lg font-black ${isZero ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700'}`}>
                            {sala.diasOcupados} d
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="text-slate-400 text-[10px]">Libre</span>
                          ) : sala.turnos.am >= sala.turnos.pm ? (
                            <span className="text-amber-700 text-[11px] font-semibold">☀️ AM ({sala.turnos.am})</span>
                          ) : (
                            <span className="text-indigo-700 text-[11px] font-semibold">🌙 PM ({sala.turnos.pm})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">{sala.coordinadorPrincipal}</td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">Sin Uso</span>
                          ) : sala.diasOcupados > 20 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">Alta Demanda</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">Uso Medio</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedSalaDetail(sala)}
                            disabled={isZero}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#005082] hover:text-white text-slate-700 text-xs font-bold transition shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DIMENSIÓN 3: POR SEDES
      ═══════════════════════════════════════════════════════════════════════ */}
      {dimension === 'sedes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processedSedes.map(sede => {
              const pctOcupacionSede = totalDiasGlobales > 0 ? Math.round((sede.diasOcupados / totalDiasGlobales) * 100) : 0;
              return (
                <div key={sede.sede} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-800">{sede.sede}</h4>
                          <span className="text-xs text-slate-400 font-semibold">{sede.totalSalasFisicas} salas físicas</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {pctOcupacionSede}% del total
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                      <div>
                        <div className="text-2xl font-black text-slate-800">{sede.diasOcupados}</div>
                        <div className="text-[11px] text-slate-400 font-semibold">Días Acumulados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800">{sede.totalAsignaciones}</div>
                        <div className="text-[11px] text-slate-400 font-semibold">Reservas Totales</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-700">{sede.salasConUsoCount} / {sede.totalSalasFisicas}</div>
                        <div className="text-[11px] text-slate-400 font-semibold">Salas Utilizadas</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-700">{sede.totalPersonas.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400 font-semibold">Aforo Capacitado</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Sala más solicitada:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[160px]">{sede.salaPrincipal}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Coordinador líder:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[160px]">{sede.coordinadorPrincipal}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Turnos:</span>
                        <span className="font-semibold text-slate-700">☀️ AM ({sede.turnos.am}) · 🌙 PM ({sede.turnos.pm})</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSedeDetail(sede)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Detalle de Sede
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE DE COORDINADOR ────────────────────────────────────── */}
      {selectedCoordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-[#005082] to-slate-900 text-white p-6 relative">
              <button type="button" onClick={() => setSelectedCoordDetail(null)} className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedCoordDetail.nombre)} text-white flex items-center justify-center font-black text-xl shadow-lg`}>
                  {getInitials(selectedCoordDetail.nombre)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-orange-200 font-bold">Historial de Usabilidad y Reservas</div>
                  <h3 className="text-xl font-black text-white">{selectedCoordDetail.nombre}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedCoordDetail.totalAsignaciones} reservas · {selectedCoordDetail.diasOcupados} días efectivos · {selectedCoordDetail.totalPersonas} personas formadas
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedCoordDetail.asignaciones.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 border border-red-200 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-800">Sin Reservas de Salas</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {selectedCoordDetail.nombre} no registra ninguna solicitud o reserva de salas en el período seleccionado ({labelPeriodo}).
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    0 días de sala ocupados
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedCoordDetail.asignaciones.map((asig, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-800">{asig.sala || 'Sala no especificada'}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{asig.sede}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${asig.estadoAsignacion === 'APROBADO' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                          {asig.estadoAsignacion || 'PENDIENTE'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                        <div><span className="text-slate-400">Fechas:</span> <strong>{formatAsignacionRango(asig.fechaInicial, asig.fechaFin)}</strong></div>
                        <div><span className="text-slate-400">Horario:</span> <strong>{asig.horario || 'N/A'}</strong></div>
                        <div><span className="text-slate-400">Campaña / Req:</span> <strong>{asig.campana || '—'} ({asig.req || 's/n'})</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button type="button" onClick={() => setSelectedCoordDetail(null)} className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer">
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE DE SALA ───────────────────────────────────────────── */}
      {selectedSalaDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
              <button type="button" onClick={() => setSelectedSalaDetail(null)} className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-indigo-300 font-bold">Ocupación y Programación de Sala</div>
                  <h3 className="text-xl font-black text-white">{selectedSalaDetail.sala}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Sede {selectedSalaDetail.sede} · Capacidad: {selectedSalaDetail.capacidad} pax · {selectedSalaDetail.diasOcupados} días ocupada
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Reservas programadas en el período</h4>
              <div className="space-y-2.5">
                {selectedSalaDetail.asignaciones.map((asig, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-sm text-slate-800">Coordinador: {asig.coordinador || 'Sin coordinador'}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{asig.estadoAsignacion}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div><span className="text-slate-400">Fechas:</span> <strong>{formatAsignacionRango(asig.fechaInicial, asig.fechaFin)}</strong></div>
                      <div><span className="text-slate-400">Turno:</span> <strong>{asig.horario}</strong></div>
                      <div><span className="text-slate-400">Campaña:</span> <strong>{asig.campana}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button type="button" onClick={() => setSelectedSalaDetail(null)} className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer">
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE DE SEDE ───────────────────────────────────────────── */}
      {selectedSedeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 relative">
              <button type="button" onClick={() => setSelectedSedeDetail(null)} className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-emerald-300 font-bold">Resumen de Ocupación por Sede</div>
                  <h3 className="text-xl font-black text-white">{selectedSedeDetail.sede}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedSedeDetail.totalSalasFisicas} salas físicas · {selectedSedeDetail.diasOcupados} días de ocupación acumulados
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Reservas en esta sede</h4>
              <div className="space-y-2.5">
                {selectedSedeDetail.asignaciones.map((asig, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-sm text-slate-800">{asig.sala} · {asig.coordinador || 'Sin coordinador'}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{asig.estadoAsignacion}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div><span className="text-slate-400">Fechas:</span> <strong>{formatAsignacionRango(asig.fechaInicial, asig.fechaFin)}</strong></div>
                      <div><span className="text-slate-400">Turno:</span> <strong>{asig.horario}</strong></div>
                      <div><span className="text-slate-400">Campaña:</span> <strong>{asig.campana}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button type="button" onClick={() => setSelectedSedeDetail(null)} className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer">
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE DE RESERVAS SIN COORDINADOR ───────────────────────── */}
      {showUnassignedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setShowUnassignedModal(false)}
                className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-amber-300 font-bold">Auditoría de Datos Históricos</div>
                    <h3 className="text-xl font-black text-white">Reservas sin Coordinador en Google Sheets</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {allHistoricalUnassigned.length} asignaciones originales con la columna "COORDINADOR" vacía o sin asignar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportUnassigned}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-4 h-4" />
                  Descargar Estas {allHistoricalUnassigned.length} en Excel
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>Lista completa ordenada por fila en Google Sheets:</span>
                <span className="font-bold text-slate-700">{allHistoricalUnassigned.length} registros</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                        <th className="py-2.5 px-3">Fila Sheet</th>
                        <th className="py-2.5 px-3">Campaña</th>
                        <th className="py-2.5 px-3">Req</th>
                        <th className="py-2.5 px-3">Sala</th>
                        <th className="py-2.5 px-3">Sede</th>
                        <th className="py-2.5 px-3">Formador</th>
                        <th className="py-2.5 px-3">Rango Fechas</th>
                        <th className="py-2.5 px-3">Turno</th>
                        <th className="py-2.5 px-3 text-center">Aforo</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {allHistoricalUnassigned.map((asig, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/40 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">Fila {asig.rowIndex}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{asig.campana}</td>
                          <td className="py-2.5 px-3 text-slate-600">{asig.req || '-'}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{asig.sala}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {asig.sede}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{asig.formador || 'Sin formador'}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                            {formatAsignacionRango(asig.fechaInicial, asig.fechaFin)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{asig.horario}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">{asig.dPersonas || '0'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {asig.estadoAsignacion || 'APROBADO'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Puedes editar directamente la hoja Google Sheets en la columna "COORDINADOR" para que se asignen en tiempo real.
              </span>
              <button
                type="button"
                onClick={() => setShowUnassignedModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
