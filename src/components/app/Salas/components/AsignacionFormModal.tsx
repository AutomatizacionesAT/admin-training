import { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, AlertTriangle } from 'lucide-react';
import type { AsignacionRecord, SalaRecord } from '../utils/types';
import { SALAS_USERS } from '@/context/AuthContext';
import {
  parseAsignacionDate,
  toInputDateValue,
  formatAsignacionRango,
} from '../utils/asignacionUtils';

interface Props {
  initial?: AsignacionRecord | null;
  salas: SalaRecord[];
  /** Lista completa de asignaciones para detectar conflictos */
  asignaciones?: AsignacionRecord[];
  onSave: (a: Omit<AsignacionRecord, 'rowIndex'>) => Promise<void>;
  onClose: () => void;
  /** Si true, el botón dice "Enviar solicitud" y muestra info de modo coordinador */
  modoSolicitud?: boolean;
  /** Pre-rellena el campo formador con este nombre */
  coordinadorDefault?: string;
  /** Estado de guardado externo (para que el padre controle el spinner) */
  saving?: boolean;
}

// ── Utilidades de fecha (conflictos) ─────────────────────────────────────────

/** Detecta si dos rangos [s1,e1] y [s2,e2] se superponen */
function datesOverlap(s1: Date, e1: Date, s2: Date, e2: Date) {
  return s1 <= e2 && s2 <= e1;
}

interface Conflicto {
  campana: string;
  formador: string;
  estadoAsignacion: string;
  fechaInicial: string;
  fechaFin: string;
}

/**
 * Retorna las asignaciones que colisionan con el formulario actual.
 * Condición: misma sala + mismo horario + fechas superpuestas + estado PENDIENTE o APROBADO.
 */
function detectarConflictos(
  form: Omit<AsignacionRecord, 'rowIndex'>,
  todas: AsignacionRecord[],
  editandoRowIndex?: number,
): Conflicto[] {
  if (!form.sala || !form.horario || !form.fechaInicial || !form.fechaFin) return [];

  const newStart = parseAsignacionDate(form.fechaInicial);
  const newEnd = parseAsignacionDate(form.fechaFin);
  if (!newStart || !newEnd) return [];

  return todas.filter(a => {
    // Excluir el registro que se está editando
    if (editandoRowIndex !== undefined && a.rowIndex === editandoRowIndex) return false;
    // Excluir rechazadas
    if (a.estadoAsignacion === 'RECHAZADO') return false;
    // Misma sala + mismo horario
    if (a.sala !== form.sala) return false;
    if (a.horario !== form.horario) return false;
    // Rango solapado
    const existStart = parseAsignacionDate(a.fechaInicial);
    const existEnd = parseAsignacionDate(a.fechaFin);
    if (!existStart || !existEnd) return false;
    return datesOverlap(newStart, newEnd, existStart, existEnd);
  }).map(a => ({
    campana: a.campana,
    formador: a.formador,
    estadoAsignacion: a.estadoAsignacion || 'APROBADO',
    fechaInicial: a.fechaInicial,
    fechaFin: a.fechaFin,
  }));
}

const EMPTY: Omit<AsignacionRecord, 'rowIndex'> = {
  campana: '', req: '', sala: '', sede: '',
  formador: '', fechaInicial: '', fechaFin: '',
  horario: '', dPersonas: '',
  estadoAsignacion: 'APROBADO', ticket: '', estadoTicket: '',
};

const inputCls = 'border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full';
const labelCls = 'text-xs font-semibold text-slate-600 uppercase tracking-wider';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export default function AsignacionFormModal({ initial, salas = [], asignaciones = [], onSave, onClose, modoSolicitud, coordinadorDefault, saving: savingExternal }: Props) {
  const [form, setForm] = useState<Omit<AsignacionRecord, 'rowIndex'>>(EMPTY);
  const [savingInternal, setSavingInternal] = useState(false);
  const [dateError, setDateError] = useState('');
  const saving = savingExternal ?? savingInternal;

  // Conflictos recalculados en tiempo real
  const conflictos = useMemo(
    () => detectarConflictos(form, asignaciones, initial?.rowIndex),
    [form, asignaciones, initial?.rowIndex],
  );
  const hayConflicto = conflictos.length > 0;

  useEffect(() => {
    setDateError('');
    if (initial) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rowIndex: _r, ...rest } = initial;
      setForm({
        ...rest,
        fechaInicial: toInputDateValue(rest.fechaInicial),
        fechaFin: toInputDateValue(rest.fechaFin),
      });
    } else {
      setForm({ ...EMPTY, formador: coordinadorDefault ?? '' });
    }
  }, [initial, coordinadorDefault]);

  const set = (key: keyof typeof EMPTY, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // ── Sedes únicas (excluye cabeceras que gviz puede colar como datos) ────────
  const HEADER_WORDS = new Set(['SEDE', 'SALA', 'TIPO', 'HORARIO', 'CAPACIDAD', 'EQUIPOS']);
  const sedesUnicas = useMemo(() =>
    [...new Set(salas.map(s => s.sede))]
      .filter(s => Boolean(s) && !HEADER_WORDS.has(s.toUpperCase().trim()))
      .sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salas]
  );

  // ── Salas filtradas por sede (deduplicadas AM/PM) ──────────────────────────
  const salasporSede = useMemo(() => {
    if (!form.sede) return [];
    const seen = new Set<string>();
    return salas
      .filter(s => s.sede === form.sede)
      .filter(s => { if (seen.has(s.sala)) return false; seen.add(s.sala); return true; });
  }, [salas, form.sede]);

  // ── Horarios disponibles para la sala seleccionada ─────────────────────────
  const horariosDisponibles = useMemo(() => {
    if (!form.sala) return ['06:00 A 14:00', '14:00 A 22:00'];
    return salas
      .filter(s => s.sala === form.sala && s.horario)
      .map(s => s.horario);
  }, [salas, form.sala]);

  // ── Coordinadores ──────────────────────────────────────────────────────────
  const coordinadores = SALAS_USERS.filter(u => u.rol === 'COORDINADOR' || u.rol === 'SUPER_ADMIN');

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSedeChange = (sede: string) => {
    setForm(prev => ({ ...prev, sede, sala: '', horario: '' }));
  };

  const handleSalaChange = (salaName: string) => {
    const found = salas.find(s => s.sala === salaName && s.sede === form.sede);
    setForm(prev => ({ ...prev, sala: salaName, horario: found?.horario || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campana || !form.sede || !form.sala) return;

    const fechaInicial = toInputDateValue(form.fechaInicial) || form.fechaInicial;
    const fechaFin = toInputDateValue(form.fechaFin) || form.fechaFin;
    if (!fechaInicial || !fechaFin) {
      setDateError('Indica la fecha desde y hasta.');
      return;
    }
    const start = parseAsignacionDate(fechaInicial);
    const end = parseAsignacionDate(fechaFin);
    if (!start || !end) {
      setDateError('Las fechas no son válidas.');
      return;
    }
    if (end < start) {
      setDateError('La fecha hasta no puede ser anterior a la fecha desde.');
      return;
    }
    setDateError('');

    if (modoSolicitud && hayConflicto) return;

    const payload = { ...form, fechaInicial, fechaFin };
    setSavingInternal(true);
    try { await onSave(payload); }
    finally { setSavingInternal(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className={`p-5 flex items-center justify-between shrink-0 ${modoSolicitud ? 'bg-linear-to-r from-blue-600 to-indigo-700' : 'bg-linear-to-r from-emerald-600 to-teal-700'}`}>
          <div>
            <h2 className="text-white font-bold text-lg">
              {initial ? 'Editar Asignación' : modoSolicitud ? 'Solicitar Sala' : 'Nueva Asignación'}
            </h2>
            {modoSolicitud && (
              <p className="text-blue-200 text-xs mt-0.5">La solicitud quedará pendiente hasta ser aprobada</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          {/* Campaña + REQ */}
          <Field label="Campaña">
            <input
              type="text"
              value={form.campana}
              onChange={e => set('campana', e.target.value)}
              placeholder="Ej: BBVA VENTAS"
              className={inputCls}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="REQ.">
              <input type="text" value={form.req} onChange={e => set('req', e.target.value)} placeholder="Requerimiento" className={inputCls} />
            </Field>
            <Field label="N° Personas">
              <input type="number" value={form.dPersonas} onChange={e => set('dPersonas', e.target.value)} min="1" className={inputCls} />
            </Field>
          </div>

          {/* 1. Sede primero */}
          <Field label="Sede">
            <select value={form.sede} onChange={e => handleSedeChange(e.target.value)} className={inputCls} required>
              <option value="">Selecciona una sede...</option>
              {sedesUnicas.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          {/* 2. Sala filtrada por sede */}
          <Field label="Sala">
            <select
              value={form.sala}
              onChange={e => handleSalaChange(e.target.value)}
              className={inputCls}
              disabled={!form.sede}
              required
            >
              <option value="">{form.sede ? 'Selecciona una sala...' : 'Primero selecciona la sede'}</option>
              {salasporSede.map((s, i) => (
                <option key={i} value={s.sala}>{s.sala}</option>
              ))}
            </select>
          </Field>

          {/* 3. Horario (auto-poblado, pero editable) */}
          <Field label="Horario">
            <select value={form.horario} onChange={e => set('horario', e.target.value)} className={inputCls}>
              <option value="">Selecciona horario...</option>
              {horariosDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </Field>

          {/* 4. Coordinador dropdown */}
          <Field label="Coordinador / Formador">
            <select value={form.formador} onChange={e => set('formador', e.target.value)} className={inputCls}>
              <option value="">Selecciona un coordinador...</option>
              {coordinadores.map(c => (
                <option key={c.documento} value={c.nombre}>
                  {c.nombre} — {c.cargo}
                </option>
              ))}
            </select>
          </Field>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Desde">
              <input
                type="date"
                value={form.fechaInicial}
                onChange={e => { set('fechaInicial', e.target.value); setDateError(''); }}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Hasta">
              <input
                type="date"
                value={form.fechaFin}
                min={form.fechaInicial || undefined}
                onChange={e => { set('fechaFin', e.target.value); setDateError(''); }}
                className={inputCls}
                required
              />
            </Field>
          </div>
          {dateError && (
            <p className="text-xs font-semibold text-red-600">{dateError}</p>
          )}

          {/* ── Banner de conflictos ────────────────────────────────────────── */}
          {hayConflicto && (
            <div className={`rounded-xl border p-4 space-y-2 ${modoSolicitud ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${modoSolicitud ? 'text-red-500' : 'text-amber-500'}`} />
                <p className={`text-sm font-bold ${modoSolicitud ? 'text-red-700' : 'text-amber-700'}`}>
                  {modoSolicitud
                    ? `Sala no disponible — ${conflictos.length} conflicto${conflictos.length > 1 ? 's' : ''} detectado${conflictos.length > 1 ? 's' : ''}`
                    : `Advertencia — ${conflictos.length} conflicto${conflictos.length > 1 ? 's' : ''} (puedes continuar como admin)`}
                </p>
              </div>
              <ul className="space-y-1.5 pl-6">
                {conflictos.map((c, i) => (
                  <li key={i} className={`text-xs ${modoSolicitud ? 'text-red-600' : 'text-amber-700'}`}>
                    <span className="font-semibold">{c.campana || 'Sin campaña'}</span>
                    {' '}— {c.formador || 'Sin formador'}
                    {' '}·{' '}
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${c.estadoAsignacion === 'PENDIENTE'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-emerald-200 text-emerald-800'
                      }`}>
                      {c.estadoAsignacion}
                    </span>
                    {' '}· {formatAsignacionRango(c.fechaInicial, c.fechaFin)}
                  </li>
                ))}
              </ul>
              {modoSolicitud && (
                <p className="text-xs text-red-500 pl-6">
                  Cambia la sala, el horario o las fechas para evitar el conflicto.
                </p>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving || !form.campana || !form.sede || !form.sala || !form.fechaInicial || !form.fechaFin || (modoSolicitud && hayConflicto)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all text-white ${modoSolicitud && hayConflicto
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              }`}
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : modoSolicitud && hayConflicto
                ? <><AlertTriangle className="w-4 h-4" /> Sala no disponible</>
                : modoSolicitud
                  ? 'Enviar solicitud'
                  : <><Save className="w-4 h-4" /> Guardar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
