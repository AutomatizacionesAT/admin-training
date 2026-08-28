import { useState, useMemo } from "react";
import type { EnviosServidoresRecord } from "../utils/utils";
import {
  EnviosServidoresReportDialog,
  type EstadoServidorFilter,
} from "./EnviosServidoresReportDialog";
import {
  type WTReportCampProps,
  type UnifiedCampana,
  type ActividadFilter,
  useUnifiedCampanas,
  FiltrosReporteCampana,
  GridMetricasCampana,
  TablaConsolidadaCampana,
  ActiveCampaignDetailModal,
} from "./reporteCampana";

export type { UnifiedCampana };

export function WTReportCamp({
  selectedCoordinador,
  onSelectCoordinador,
  data,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDireccion,
  setSelectedDireccion,
  selectedCampana,
  setSelectedCampana,
  availableYears,
  availableDirecciones,
  availableCampanas,
  enviosServidores,
}: WTReportCampProps) {
  const [selectedIndustria, setSelectedIndustria] = useState<string | null>(null);
  const [selectedActividad, setSelectedActividad] = useState<ActividadFilter>("ALL");
  const [selectedEstadoServidor, setSelectedEstadoServidor] =
    useState<EstadoServidorFilter | null>(null);
  const [isEnviosReportOpen, setIsEnviosReportOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [activeCampaignDetail, setActiveCampaignDetail] = useState<UnifiedCampana | null>(null);

  const {
    allUnifiedCampanas,
    unifiedCampanasOptions,
    actividadCounts,
    filteredCampanas,
    coordinadoresMetrics,
    industriasMetrics,
    serverMetrics,
    tableFilteredCampanas,
  } = useUnifiedCampanas({
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
  });

  const enviosReportRecords: EnviosServidoresRecord[] = useMemo(() => {
    return allUnifiedCampanas.map((c) => ({
      campana: c.nombre,
      estadoServidor: c.estadoServidor,
      url: c.url,
      bases: c.bases,
      campanasDos: "",
      segmentosDos: "",
    }));
  }, [allUnifiedCampanas]);

  const activeFiltersCount = [
    selectedMonth !== null,
    selectedDireccion !== null,
    selectedCampana !== null,
    selectedCoordinador !== null,
    selectedIndustria !== null,
    selectedActividad !== "ALL",
    selectedEstadoServidor !== null,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedMonth(null);
    setSelectedDireccion(null);
    setSelectedCampana(null);
    setSelectedIndustria(null);
    setSelectedActividad("ALL");
    onSelectCoordinador(null);
    setSelectedEstadoServidor(null);
    setIsEnviosReportOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ═══ BARRA DE FILTROS ═══ */}
      <FiltrosReporteCampana
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedDireccion={selectedDireccion}
        setSelectedDireccion={setSelectedDireccion}
        availableDirecciones={availableDirecciones}
        selectedCampana={selectedCampana}
        setSelectedCampana={setSelectedCampana}
        unifiedCampanasOptions={unifiedCampanasOptions}
        selectedActividad={selectedActividad}
        setSelectedActividad={setSelectedActividad}
        actividadCounts={actividadCounts}
        selectedEstadoServidor={selectedEstadoServidor}
        setSelectedEstadoServidor={setSelectedEstadoServidor}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
      />

      {/* ═══ GRID SUPERIOR: TOTAL CAMPAÑAS, INDUSTRIAS, COORDINADORES, SERVIDORES ═══ */}
      <GridMetricasCampana
        filteredCampanasCount={filteredCampanas.length}
        actividadCounts={actividadCounts}
        onOpenEnviosReport={() => setIsEnviosReportOpen(true)}
        industriasMetrics={industriasMetrics}
        selectedIndustria={selectedIndustria}
        setSelectedIndustria={setSelectedIndustria}
        coordinadoresMetrics={coordinadoresMetrics}
        selectedCoordinador={selectedCoordinador}
        onSelectCoordinador={onSelectCoordinador}
        serverMetrics={serverMetrics}
        selectedEstadoServidor={selectedEstadoServidor}
        setSelectedEstadoServidor={setSelectedEstadoServidor}
      />

      {/* ═══ TABLA CONSOLIDADA DE TODAS LAS CAMPAÑAS ═══ */}
      <TablaConsolidadaCampana
        tableFilteredCampanas={tableFilteredCampanas}
        tableSearch={tableSearch}
        setTableSearch={setTableSearch}
        selectedCoordinador={selectedCoordinador}
        selectedIndustria={selectedIndustria}
        selectedActividad={selectedActividad}
        setSelectedIndustria={setSelectedIndustria}
        onOpenEnviosReport={() => setIsEnviosReportOpen(true)}
        onSelectCampaignDetail={(camp) => setActiveCampaignDetail(camp)}
      />

      {/* ═══ DIALOG: REPORTE GENERAL DE SERVIDORES ═══ */}
      <EnviosServidoresReportDialog
        open={isEnviosReportOpen}
        records={enviosReportRecords}
        selectedStatus={selectedEstadoServidor}
        onClose={() => setIsEnviosReportOpen(false)}
      />

      {/* ═══ DIALOG: DETALLES DE DESARROLLOS DE LA CAMPAÑA SELECCIONADA ═══ */}
      <ActiveCampaignDetailModal
        campaign={activeCampaignDetail}
        onClose={() => setActiveCampaignDetail(null)}
      />
    </div>
  );
}
