import { useEffect, useState } from "react";
import {
  fetchGoogleSheetData,
  fetchMasterData,
  fetchSheetNovedades,
  fetchEnviosServidores,
  submitTrainingData,
} from "./utils/utils";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
  EnviosServidoresRecord,
} from "./utils/utils";
import { useAuth } from "@/context/AuthContext";
import CalendarTab from "./components/CalendarTab";
import AddTrainingModal from "./components/AddTrainingModal";
import { useWTReportData } from "./hooks/useWTReportData";
import { WTReportTab } from "./components/WTReportTab";

type Tab = "calendar" | "report";

export default function WebTraining() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [festivos, setFestivos] = useState<FestivoRecord[]>([]);
  const [novedades, setNovedades] = useState<NovedadesRecord[]>([]);
  const [enviosServidores, setEnviosServidores] = useState<EnviosServidoresRecord[]>([]);
  // Listas Maestras
  const [desarrolladores, setDesarrolladores] = useState<string[]>([]);
  const [coordinadores, setCoordinadores] = useState<string[]>([]);
  const [clientes, setClientes] = useState<string[]>([]);
  const [tiposDesarrollo, setTiposDesarrollo] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);

  const [isModalMinimized, setIsModalMinimized] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, masterData, novedadesData, enviosData] = await Promise.all([
        fetchGoogleSheetData(),
        fetchMasterData(),
        fetchSheetNovedades(),
        fetchEnviosServidores(),
      ]);
      setData(records);
      setFestivos(masterData.festivos);
      setDesarrolladores(masterData.desarrolladores);
      setCoordinadores(masterData.coordinadores);
      setClientes(masterData.clientes);
      setTiposDesarrollo(masterData.tiposDesarrollo);
      setEstados(masterData.estados);

      setNovedades(novedadesData);
      setEnviosServidores(enviosData);
      setError(null);
    } catch (err) {
      setError("Error al cargar los datos de Google Sheets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSuccessAdd = () => {
    // Recargar datos después de agregar
    loadData();
    // Opcional: Mostrar notificación de éxito
    setEditingRecord(null); // Limpiar edición si hubo
  };

  const handleEdit = (record: TrainingRecord) => {
    setEditingRecord(record);
    setShowAddModal(true);
    // Si estaba minimizado, restaurar
    if (isModalMinimized) setIsModalMinimized(false);
  };

  const handleUpdateRecord = async (updatedRecord: TrainingRecord) => {
    try {
      setLoading(true);
      await submitTrainingData({
        action: "update",
        data: updatedRecord,
        rowIndex: updatedRecord.rowIndex,
      });
      await loadData(); // Recargar datos para reflejar cambios
      setEditingRecord(null); // Limpiar si hubiera algo seleccionado (aunque es inline)
    } catch (err) {
      console.error("Error updating record:", err);
      setError("Error al actualizar el registro");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpdate = async (records: TrainingRecord[], deletedIds: number[] = []) => {
    try {
      setLoading(true);

      // 1. Actualizar registros modificados
      for (const record of records) {
        await submitTrainingData({
          action: "update",
          data: record,
          rowIndex: record.rowIndex,
        });
      }

      // 2. Eliminar registros
      if (deletedIds && deletedIds.length > 0) {
        // Ordenar descendente para evitar problemas de índices movidos
        const sortedIds = [...deletedIds].sort((a, b) => b - a);
        for (const rowIndex of sortedIds) {
          await submitTrainingData({
            action: "delete",
            rowIndex: rowIndex
          });
        }
      }

      await loadData(); // Recargar todo una sola vez al final
    } catch (err) {
      console.error("Error updating records:", err);
      setError("Error al actualizar registros");
    } finally {
      setLoading(false);
    }
  };
  const handleAddRecord = async (newRecord: TrainingRecord) => {
    try {
      setLoading(true);
      await submitTrainingData({
        action: "create",
        data: newRecord,
      });
      await loadData(); // Recargar datos
    } catch (err) {
      console.error("Error adding record:", err);
      setError("Error al agregar el registro");
    } finally {
      setLoading(false);
    }
  };

  const {
    reportData,
    selectedCoordinador,
    setSelectedCoordinador,
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
    filteredData,
  } = useWTReportData(data);

  return (
    <div className="bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-8 flex flex-col">
      {/* Sistema de pestañas */}
      <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100">
        <nav className="flex space-x-1 p-2">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`${activeTab === "calendar"
              ? "bg-linear-to-r from-[#1b355b] to-[#13253f] text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
              } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📅 Calendario
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`${activeTab === "report"
              ? "bg-linear-to-r from-[#1b355b] to-[#13253f] text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
              } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📊 Reporte
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Pestaña de Calendario */}
          {activeTab === "calendar" && (
            <CalendarTab
              data={data}
              festivos={festivos}
              novedades={novedades}
              onEdit={isAdmin ? handleEdit : undefined}
              onUpdateRecord={isAdmin ? handleUpdateRecord : undefined}
              onBatchUpdate={isAdmin ? handleBatchUpdate : undefined}
              onAddRecord={isAdmin ? handleAddRecord : undefined}
              estados={estados}
              tiposDesarrollo={tiposDesarrollo}
            />
          )}

          {/* Pestaña de Reporte */}
          {activeTab === "report" && (
            <WTReportTab
              reportData={reportData}
              selectedCoordinador={selectedCoordinador}
              onSelectCoordinador={setSelectedCoordinador}
              data={filteredData}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedDireccion={selectedDireccion}
              setSelectedDireccion={setSelectedDireccion}
              selectedCampana={selectedCampana}
              setSelectedCampana={setSelectedCampana}
              availableYears={availableYears}
              availableDirecciones={availableDirecciones}
              availableCampanas={availableCampanas}
              enviosServidores={enviosServidores}
            />
          )}
        </>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )}

      {/* Botón de Agregar Nuevo (Flotante) - Solo Admin */}
      {isAdmin &&  (
        <button
          onClick={() => {
            setEditingRecord(null); // Nuevo, limpieza
            setShowAddModal(true);
          }}
          className={`bg-linear-to-r ${activeTab === "calendar" ? "block" : "hidden"} from-[#e56618] to-amber-700 text-white rounded-lg shadow-2xl hover:shadow-3xl transform hover:scale-01 transition-all duration-300 flex items-center justify-center font-bold 2xl:text-xl w-[400px] ml-7 mt-2 py-2 hover:w-[420px] cursor-pointer hover:ring-3 hover:ring-slate-700`}
          title="Agregar Nuevo Registro"
        >
          Agregar Nuevo registro +
        </button>
      )}

      {/* Modal de Agregar Datos - Solo Admin */}
      {isAdmin && (
        <AddTrainingModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingRecord(null);
          }}
          onSuccess={handleSuccessAdd}
          desarrolladores={desarrolladores}
          coordinadores={coordinadores}
          clientes={clientes}
          tiposDesarrollo={tiposDesarrollo}
          estados={estados}
          isMinimized={isModalMinimized}
          onToggleMinimize={() => setIsModalMinimized(!isModalMinimized)}
          initialData={editingRecord}
        />
      )}

    </div>
  );
}
