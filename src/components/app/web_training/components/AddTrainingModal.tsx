import { useState, useEffect } from "react";
import { submitTrainingData } from "../utils/utils";
import type { TrainingRecord } from "../utils/utils";
import { Minus } from 'lucide-react';

interface AddTrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    desarrolladores: string[];
    coordinadores: string[];
    clientes: string[];
    tiposDesarrollo: string[];
    estados: string[];
    isMinimized?: boolean;
    onToggleMinimize?: () => void;
    initialData?: TrainingRecord | null;
}

// Campos comunes para la cabecera
interface HeaderData {
    coordinador: string;
    cliente: string;
    segmento: string;
    desarrollador: string;
    segmentoMenu: string;
    campana: string;
    formador: string;
    fechaSolicitud: string;
}

// Campos para cada desarrollo (fila dinámica)
interface RowData {
    id: string; // Para key de React
    desarrollo: string;
    nombre: string;
    cantidad: string;
    fechaMaterial: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    observaciones: string;
}

const INITIAL_HEADER: HeaderData = {
    coordinador: "",
    cliente: "",
    segmento: "",
    desarrollador: "",
    segmentoMenu: "",
    campana: "",
    formador: "",
    fechaSolicitud: new Date().toISOString().split("T")[0], // Hoy por defecto
};

const INITIAL_ROW: RowData = {
    id: crypto.randomUUID(),
    desarrollo: "",
    nombre: "",
    cantidad: "",
    fechaMaterial: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "Pendiente",
    observaciones: "",
};

const mapRecordToHeader = (record: TrainingRecord): HeaderData => ({
    coordinador: record.coordinador || "",
    cliente: record.cliente || "",
    segmento: record.segmento || "",
    desarrollador: record.desarrollador || "",
    segmentoMenu: record.segmentoMenu || "",
    campana: record.campana || "",
    formador: record.formador || "",
    fechaSolicitud: record.fechaSolicitud || new Date().toISOString().split("T")[0],
});

const mapRecordToRow = (record: TrainingRecord): RowData => ({
    id: crypto.randomUUID(),
    desarrollo: record.desarrollo || "",
    nombre: record.nombre || "",
    cantidad: record.cantidad || "",
    fechaMaterial: record.fechaMaterial || "",
    fechaInicio: record.fechaInicio || "",
    fechaFin: record.fechaFin || "",
    estado: record.estado || "Pendiente",
    observaciones: record.observaciones || "",
});

// Helper para convertir DD/MM/YYYY -> YYYY-MM-DD (para input date)
const toInputDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    // Si ya es YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Si es DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    return "";
};

// Helper para convertir YYYY-MM-DD -> DD/MM/YYYY (para guardar/state)
const fromInputDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

export default function AddTrainingModal({
    isOpen,
    onClose,
    onSuccess,
    desarrolladores,
    coordinadores,
    clientes,
    tiposDesarrollo,
    estados,
    isMinimized = false,
    onToggleMinimize,
    initialData
}: AddTrainingModalProps) {
    const [headerData, setHeaderData] = useState<HeaderData>(INITIAL_HEADER);
    const [rows, setRows] = useState<RowData[]>([{ ...INITIAL_ROW }]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setHeaderData(mapRecordToHeader(initialData));
            setRows([mapRecordToRow(initialData)]);
        } else {
            setHeaderData(INITIAL_HEADER);
            setRows([{ ...INITIAL_ROW, id: crypto.randomUUID() }]);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-8 left-8 z-50 bg-white border-2 border-blue-100 shadow-2xl shadow-blue-900/20 rounded-2xl px-6 py-5 flex items-center gap-6 animate-in slide-in-from-bottom-5 w-auto max-w-md overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-blue-600 via-blue-500 to-orange-500" />
                <div className="flex items-center gap-4 pl-2">
                    <div className="bg-linear-to-br from-blue-500 to-orange-500 p-3 rounded-xl text-white text-xl shadow-lg shadow-orange-500/30">
                        <span>📝</span>
                    </div>
                    <div>
                        <p className="font-extrabold text-base text-slate-800 tracking-tight">Registro en curso</p>
                        <p className="text-sm text-orange-600 font-bold mt-0.5">{rows.length} desarrollo(s) agregado(s)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 pl-5 border-l-2 border-blue-100 ml-1">
                    {onToggleMinimize && (
                        <button
                            onClick={onToggleMinimize}
                            className="p-2.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Restaurar"
                        >
                            <span className="text-xl">↗️</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-orange-50 text-orange-500 rounded-lg transition-colors"
                        title="Cerrar"
                    >
                        <span className="text-xl">✕</span>
                    </button>
                </div>
            </div>
        );
    }

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setHeaderData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRowChange = (id: string, field: keyof RowData, value: string) => {
        setRows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const addRow = () => {
        if (isMinimized) return; // Prevent resizing in minimized mode
        setRows((prev) => [...prev, { ...INITIAL_ROW, id: crypto.randomUUID() }]);
    };

    const removeRow = (id: string) => {
        if (rows.length === 1) return; // Mantener al menos una fila
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validaciones básicas
            if (!headerData.cliente) {
                setError("Por favor complete los campos obligatorios (Cliente)");
                setSubmitting(false);
                return;
            }

            if (initialData && initialData.rowIndex) {
                // MODO EDICIÓN: Actualizar una sola fila
                const row = rows[0];
                const cleanRecord: TrainingRecord = {
                    ...headerData,
                    desarrollo: row.desarrollo,
                    nombre: row.nombre,
                    cantidad: row.cantidad,
                    fechaMaterial: row.fechaMaterial,
                    fechaInicio: row.fechaInicio,
                    fechaFin: row.fechaFin,
                    estado: row.estado,
                    observaciones: row.observaciones,
                    rowIndex: initialData.rowIndex, // Importante para identificar la fila
                    // Asegurar campos nulos si están vacíos
                    campana: headerData.campana || null,
                    coordinador: headerData.coordinador || null,
                    // Campos de dirección e industria (no se editan desde el modal)
                    direccion: initialData.direccion ?? null,
                    industria: initialData.industria ?? null,
                    // ... mapear resto si es necesario, pero spread ...headerData y row fields cubren la mayoría
                };

                await submitTrainingData({
                    action: 'update',
                    data: cleanRecord,
                    rowIndex: initialData.rowIndex
                });
            } else {
                // MODO CREACIÓN: Append normal
                const payload: TrainingRecord[] = rows.map((row) => ({
                    ...headerData,
                    desarrollo: row.desarrollo,
                    nombre: row.nombre,
                    cantidad: row.cantidad,
                    fechaMaterial: row.fechaMaterial,
                    fechaInicio: row.fechaInicio,
                    fechaFin: row.fechaFin,
                    estado: row.estado,
                    observaciones: row.observaciones,
                    // Campos de dirección e industria (no se capturan desde el modal)
                    direccion: null,
                    industria: null,
                }));
                await submitTrainingData(payload);
            }

            // Limpiar y cerrar
            if (!initialData) {
                setHeaderData(INITIAL_HEADER);
                setRows([{ ...INITIAL_ROW, id: crypto.randomUUID() }]);
            }
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al enviar los datos");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-2 backdrop-blur-sm overflow-y-auto">
            <div className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-[90%] relative overflow-hidden ring-1 ring-black/5">
                {/* Blobs decorativos de fondo */}
                <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-300/30 blur-3xl" />
                <div className="pointer-events-none absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-blue-400/30 blur-3xl" />

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[92vh] relative">
                    <div className={`px-10 py-4 flex justify-between items-center text-white relative overflow-hidden ${initialData ? "bg-linear-to-r from-orange-500 via-orange-500 to-blue-600" : "bg-linear-to-r from-[#1b365c] to-[#0b1a2f]"}`}>
                        <div
                            className="absolute inset-0 opacity-[0.12]"
                            style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
                        />
                        <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
                        <h2 className="text-2xl font-extrabold tracking-tight relative flex items-center gap-3">
                            <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-xl backdrop-blur-sm">
                                {initialData ? "✏️" : "📝"}
                            </span>
                            {initialData ? "Editar Registro" : "Nuevo Registro de Entrenamiento"}
                        </h2>
                        <div className="flex items-center gap-3 relative">
                            {onToggleMinimize && (
                                <button
                                    type="button"
                                    onClick={onToggleMinimize}
                                    className="text-white rounded-full hover:bg-amber-500 cursor-pointer hover:-scale-110 bg-amber-500/40  w-10 h-10 flex items-center justify-center transition-colors font-bold text-2xl"
                                    title="Minimizar"
                                >
                                    <Minus />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-white hover:bg-amber-500 hover:-scale-110 cursor-pointer hover:rounded-base bg-amber-500/40 rounded-full w-10 h-10 flex items-center justify-center transition-colors text-lg"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
                        {error && (
                            <div className="bg-orange-50 border-2 border-orange-300 px-5 py-4 rounded-xl text-orange-800 text-sm font-semibold flex items-center gap-2">
                                <span className="text-lg">⚠️</span> {error}
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-3xl border-l-4 border-blue-300 shadow-lg shadow-blue-900/5 relative overflow-hidden">
                            <span className="pointer-events-none absolute -top-1 right-6 text-[120px] font-black leading-none text-blue-50 select-none">
                                01
                            </span>
                            <div className="flex items-center gap-3 mb-7 relative">
                                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                    Datos Generales
                                </h3>
                                <span className="text-xs font-semibold text-blue-400 bg-blue-50 px-3 py-1 rounded-full">
                                    Se aplican a todos los desarrollos
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-6 relative">
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Fecha Solicitud</label>
                                    <input
                                        type="date"
                                        name="fechaSolicitud"
                                        value={headerData.fechaSolicitud}
                                        onChange={handleHeaderChange}
                                        className="w-full ring-2 ring-blue-100  bg-blue-50/40 rounded-xl outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-blue-50 text-base py-2.5 px-3.5 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Coordinador</label>
                                    <select
                                        name="coordinador"
                                        value={headerData.coordinador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-2 border-blue-100 bg-blue-50/40 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white text-base py-2.5 px-3.5 transition-colors"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {coordinadores.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">Cliente *</label>
                                    <select
                                        name="cliente"
                                        required
                                        value={headerData.cliente}
                                        onChange={handleHeaderChange}
                                        className="w-full border-2 border-orange-200 bg-orange-50/50 rounded-xl shadow-sm focus:ring-4 focus:ring-orange-200 focus:border-orange-500 focus:bg-white text-base py-2.5 px-3.5 transition-colors font-medium"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {clientes.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Segmento</label>
                                    <input
                                        type="text"
                                        name="segmento"
                                        value={headerData.segmento}
                                        onChange={handleHeaderChange}
                                        className="w-full border-2 border-blue-100 bg-blue-50/40 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white text-base py-2.5 px-3.5 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Segmento Menú</label>
                                    <input
                                        type="text"
                                        name="segmentoMenu"
                                        value={headerData.segmentoMenu}
                                        onChange={handleHeaderChange}
                                        className="w-full border-2 border-blue-100 bg-blue-50/40 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white text-base py-2.5 px-3.5 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Desarrollador</label>
                                    <select
                                        name="desarrollador"
                                        value={headerData.desarrollador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-2 border-blue-100 bg-blue-50/40 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white text-base py-2.5 px-3.5 transition-colors"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {desarrolladores.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Formador</label>
                                    <input
                                        type="text"
                                        name="formador"
                                        value={headerData.formador}
                                        onChange={handleHeaderChange}
                                        className="w-full border-2 border-blue-100 bg-blue-50/40 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white text-base py-2.5 px-3.5 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: Desarrollos (Rows) */}
                        <div className="bg-white p-8 rounded-3xl border-2 border-orange-100 shadow-lg shadow-orange-900/5 relative overflow-hidden">
                            <span className="pointer-events-none absolute -top-6 right-6 text-[120px] font-black leading-none text-orange-50 select-none">
                                02
                            </span>
                            <div className="flex justify-between items-center mb-6 relative">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 to-orange-600 text-white text-base font-black shadow-md shadow-orange-500/30">
                                        2
                                    </span>
                                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                        Detalles de Desarrollos
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="bg-linear-to-r from-blue-600 to-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
                                >
                                    <span className="text-lg leading-none">+</span> Agregar Fila
                                </button>
                            </div>

                            <div className="overflow-x-auto border-2 border-stone-100 rounded-2xl relative">
                                <table className="min-w-full divide-y divide-stone-100">
                                    <thead className="bg-linear-to-r from-blue-50 to-orange-50">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-800 uppercase tracking-wider">Desarrollo</th>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-800 uppercase tracking-wider">Nombre</th>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-800 uppercase tracking-wider w-24">Cant.</th>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-800 uppercase tracking-wider">F. Material</th>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-800 uppercase tracking-wider">F. Inicio</th>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-orange-800 uppercase tracking-wider">F. Fin</th>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-orange-800 uppercase tracking-wider">Estado</th>
                                            <th className="px-4 py-4 text-left text-xs font-extrabold text-orange-800 uppercase tracking-wider w-72">Observaciones</th>
                                            <th className="px-4 py-4 text-center text-xs font-extrabold text-orange-800 uppercase tracking-wider w-14"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-stone-100">
                                        {rows.map((row, idx) => (
                                            <tr key={row.id} className={`transition-colors hover:bg-orange-50/40 ${idx % 2 === 1 ? "bg-stone-50/50" : ""}`}>
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={row.desarrollo}
                                                        onChange={(e) => handleRowChange(row.id, "desarrollo", e.target.value)}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {tiposDesarrollo.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="text"
                                                        value={row.nombre}
                                                        onChange={(e) => handleRowChange(row.id, "nombre", e.target.value)}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                                        placeholder="Nombre del tema..."
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="text"
                                                        value={row.cantidad}
                                                        onChange={(e) => handleRowChange(row.id, "cantidad", e.target.value)}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="date"
                                                        value={toInputDate(row.fechaMaterial)}
                                                        onChange={(e) => handleRowChange(row.id, "fechaMaterial", fromInputDate(e.target.value))}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="date"
                                                        value={toInputDate(row.fechaInicio)}
                                                        onChange={(e) => handleRowChange(row.id, "fechaInicio", fromInputDate(e.target.value))}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="date"
                                                        value={toInputDate(row.fechaFin)}
                                                        onChange={(e) => handleRowChange(row.id, "fechaFin", fromInputDate(e.target.value))}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-colors"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={row.estado}
                                                        onChange={(e) => handleRowChange(row.id, "estado", e.target.value)}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-colors font-semibold"
                                                    >
                                                        {estados.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="text"
                                                        value={row.observaciones}
                                                        onChange={(e) => handleRowChange(row.id, "observaciones", e.target.value)}
                                                        className="w-full border-2 border-stone-200 rounded-lg text-sm py-2.5 px-3 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-colors"
                                                        placeholder="Obs..."
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {rows.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(row.id)}
                                                            className="text-orange-400 hover:text-orange-600 transition-colors text-lg"
                                                            title="Eliminar fila"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="px-10 py-4 border-t-2 border-blue-100 bg-white flex justify-end gap-4 relative">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 text-foreground bg-amber-500/40 font-bold hover:bg-amber-500 cursor-pointer rounded-md transition-colors text-base"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-8 py-2 text-white font-extrabold rounded-md shadow-lg transition-all flex items-center gap-2 text-base ${submitting
                                ? "bg-green-800 cursor-not-allowed"
                                : "bg-[#264c82] hover:ring-2 ring-blue-900 cursor-pointer hover:scale-[1.02]"
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <span>{initialData ? "💾 Actualizar" : "💾 Guardar Registros"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}