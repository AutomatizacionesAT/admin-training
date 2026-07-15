import { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AsignacionRecord, SalaRecord } from '../utils/types';
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
  /** Si true, usa el calendario de disponibilidad también fuera del modo solicitud */
  useAvailabilityCalendar?: boolean;
  /** Pre-rellena el campo coordinador con este nombre */
  coordinadorDefault?: string;
  /** Estado de guardado externo (para que el padre controle el spinner) */
  saving?: boolean;
  /** Preset recibido desde el timeline público */
  preset?: { sala: SalaRecord; sede: string; horario: string; fechaInicial: string; fechaFin: string } | null;
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
  formador: '', coordinador: '', tipoDeUso: '', fechaInicial: '', fechaFin: '',
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

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sameDay(a: Date | null, b: Date): boolean {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isRangeBlocked(start: Date, end: Date, blockedDays: Set<string>): boolean {
  const cursor = new Date(start.getTime());
  cursor.setHours(0, 0, 0, 0);
  const limit = new Date(end.getTime());
  limit.setHours(0, 0, 0, 0);

  while (cursor <= limit) {
    if (blockedDays.has(formatISODate(cursor))) return true;
    cursor.setDate(cursor.getDate() + 1);
  }

  return false;
}

function getSelectionHint(start: Date | null, end: Date | null): string {
  if (!start) return 'Seleccione fecha de inicio';
  if (!end) return 'Seleccione fecha fin';
  return 'Rango seleccionado';
}

export default function AsignacionFormModal({ initial, salas = [], asignaciones = [], onSave, onClose, modoSolicitud, useAvailabilityCalendar, coordinadorDefault, saving: savingExternal, preset }: Props) {
  const [form, setForm] = useState<Omit<AsignacionRecord, 'rowIndex'>>(EMPTY);
  const [savingInternal, setSavingInternal] = useState(false);
  const [dateError, setDateError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const saving = savingExternal ?? savingInternal;

  // Conflictos recalculados en tiempo real
  const conflictos = useMemo(
    () => detectarConflictos(form, asignaciones, initial?.rowIndex),
    [form, asignaciones, initial?.rowIndex],
  );
  const hayConflicto = conflictos.length > 0;
  const shouldUseAvailabilityCalendar = Boolean(modoSolicitud || useAvailabilityCalendar);
  const canUseAvailabilityCalendar = Boolean((modoSolicitud || useAvailabilityCalendar) && form.tipoDeUso && form.sede && form.sala && form.horario && form.coordinador);

  const occupiedDays = useMemo(() => {
    const set = new Set<string>();
    if (!(modoSolicitud || useAvailabilityCalendar) || !form.sede || !form.sala || !form.horario) return set;

    asignaciones.forEach((a) => {
      if (initial?.rowIndex && a.rowIndex === initial.rowIndex) return;
      if ((a.estadoAsignacion || 'APROBADO') === 'RECHAZADO') return;
      if (a.sala !== form.sala) return;
      if (a.horario !== form.horario) return;

      const start = parseAsignacionDate(a.fechaInicial);
      const end = parseAsignacionDate(a.fechaFin);
      if (!start || !end) return;

      const cursor = new Date(start.getTime());
      cursor.setHours(0, 0, 0, 0);
      const limit = new Date(end.getTime());
      limit.setHours(0, 0, 0, 0);
      while (cursor <= limit) {
        set.add(formatISODate(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return set;
  }, [asignaciones, form.horario, form.sala, form.sede, initial?.rowIndex, modoSolicitud, useAvailabilityCalendar]);
  const selectionHint = getSelectionHint(selectedStart, selectedEnd);

  useEffect(() => {
    setDateError('');
    setSubmitError('');
    if (initial) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rowIndex: _r, ...rest } = initial;
      setForm({
        ...rest,
        fechaInicial: toInputDateValue(rest.fechaInicial),
        fechaFin: toInputDateValue(rest.fechaFin),
      });
    } else {
      setForm({ ...EMPTY, coordinador: coordinadorDefault ?? '' });
      if (preset) {
        const presetSala = salas.find(s => s.sala === preset.sala.sala && s.sede === preset.sala.sede)
          ?? salas.find(s => s.sala === preset.sala.sala)
          ?? null;

        setForm(prev => ({
          ...prev,
          coordinador: coordinadorDefault ?? '',
          sede: preset.sede || preset.sala.sede || '',
          sala: preset.sala.sala,
          horario: preset.horario || presetSala?.horario || '',
          fechaInicial: preset.fechaInicial,
          fechaFin: preset.fechaFin,
        }));
      }
    }
  }, [initial, coordinadorDefault, preset, salas]);

  useEffect(() => {
    if (!canUseAvailabilityCalendar) return;
    const seed = parseAsignacionDate(form.fechaInicial) || today;
    setCalendarMonth(seed.getMonth());
    setCalendarYear(seed.getFullYear());
    setSelectedStart(parseAsignacionDate(form.fechaInicial));
    setSelectedEnd(parseAsignacionDate(form.fechaFin));
  }, [canUseAvailabilityCalendar, form.fechaInicial, form.fechaFin]);

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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSedeChange = (sede: string) => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setDateError('');
    setForm(prev => ({ ...prev, sede, sala: '', horario: '', fechaInicial: '', fechaFin: '' }));
  };

  const handleSalaChange = (salaName: string) => {
    const found = salas.find(s => s.sala === salaName && s.sede === form.sede);
    setSelectedStart(null);
    setSelectedEnd(null);
    setDateError('');
    setForm(prev => ({ ...prev, sala: salaName, horario: found?.horario || '', fechaInicial: '', fechaFin: '' }));
  };

  const handleTipoDeUsoChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      tipoDeUso: value,
      req: value === 'Formación inicial' ? prev.req : '',
    }));
  };

  const handleDateSelection = (day: number) => {
    if (!canUseAvailabilityCalendar) return;

    const clicked = new Date(calendarYear, calendarMonth, day);
    clicked.setHours(0, 0, 0, 0);
    const clickedIso = formatISODate(clicked);

    if (occupiedDays.has(clickedIso)) {
      setDateError('Ese día ya está ocupado para la sala y horario seleccionados.');
      return;
    }

    setDateError('');

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(clicked);
      setSelectedEnd(null);
      setForm(prev => ({ ...prev, fechaInicial: clickedIso, fechaFin: '' }));
      return;
    }

    if (clicked < selectedStart) {
      setSelectedStart(clicked);
      setSelectedEnd(null);
      setForm(prev => ({ ...prev, fechaInicial: clickedIso, fechaFin: '' }));
      return;
    }

    if (isRangeBlocked(selectedStart, clicked, occupiedDays)) {
      setDateError('El rango incluye días ocupados. Selecciona fechas disponibles.');
      return;
    }

    setSelectedEnd(clicked);
    setForm(prev => ({ ...prev, fechaInicial: formatISODate(selectedStart), fechaFin: clickedIso }));
  };

  const handleChangeMonth = (delta: number) => {
    const next = new Date(calendarYear, calendarMonth + delta, 1);
    setCalendarMonth(next.getMonth());
    setCalendarYear(next.getFullYear());
  };

  const clearDateSelection = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setDateError('');
    setSubmitError('');
    setForm((prev) => ({ ...prev, fechaInicial: '', fechaFin: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campana || !form.sede || !form.sala) return;
    setSubmitError('');

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
    try {
      await onSave(payload);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar la solicitud.');
    } finally {
      setSavingInternal(false);
    }
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
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          {/* Campaña + personas */}
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
            <Field label="N° Personas">
              <input type="number" value={form.dPersonas} onChange={e => set('dPersonas', e.target.value)} min="1" className={inputCls} />
            </Field>
              <Field label="Tipo de uso">
                <select value={form.tipoDeUso} onChange={e => handleTipoDeUsoChange(e.target.value)} className={inputCls} required>
                  <option value="">Selecciona...</option>
                  <option value="Formación inicial">Formación inicial</option>
                  <option value="Formación continua">Formación continua</option>
                  <option value="OJT">OJT</option>
                  <option value="Otros">Otros</option>
                </select>
              </Field>
            </div>

          {form.tipoDeUso === 'Formación inicial' && (
            <Field label="REQ.">
              <input type="text" value={form.req} onChange={e => set('req', e.target.value)} placeholder="Número del requerimiento" className={inputCls} />
            </Field>
          )}

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
            <select value={form.horario} onChange={e => {
              setSelectedStart(null);
              setSelectedEnd(null);
              setDateError('');
              setForm(prev => ({ ...prev, horario: e.target.value, fechaInicial: '', fechaFin: '' }));
            }} className={inputCls}>
              <option value="">Selecciona horario...</option>
              {horariosDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </Field>

          {/* 4. Personas responsables */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Formador">
              <input
                type="text"
                value={form.formador}
                onChange={e => set('formador', e.target.value)}
                placeholder="Nombre del formador"
                className={inputCls}
              />
            </Field>
            <Field label="Coordinador">
              <input
                type="text"
                value={form.coordinador}
                onChange={e => set('coordinador', e.target.value)}
                placeholder="Nombre del coordinador"
                className={inputCls}
                readOnly={Boolean(modoSolicitud)}
              />
            </Field>
          </div>

          {/* Fechas */}
          {shouldUseAvailabilityCalendar ? (
            <div className={`rounded-2xl border p-4 ${canUseAvailabilityCalendar ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Disponibilidad</p>
                  <h3 className="mt-1 text-sm font-bold text-slate-800">Calendario de ocupación</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {canUseAvailabilityCalendar
                      ? selectionHint
                      : 'Selecciona sede, sala, horario, coordinador y formador para habilitar el calendario.'}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Inicio</p>
                  <p>{form.fechaInicial || '—'}</p>
                  <p className="mt-2 font-semibold text-slate-700">Fin</p>
                  <p>{form.fechaFin || '—'}</p>
                </div>
              </div>

              {dateError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
                  {dateError}
                </p>
              ) : null}

              {canUseAvailabilityCalendar ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <button type="button" onClick={() => handleChangeMonth(-1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="capitalize">{new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(calendarYear, calendarMonth, 1))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedStart ? (
                        <button type="button" onClick={clearDateSelection} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 transition hover:bg-rose-100">
                          Borrar selección
                        </button>
                      ) : null}
                      <button type="button" onClick={() => handleChangeMonth(1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => <div key={day}>{day}</div>)}
                  </div>

                  {(() => {
                    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

                    return (
                      <div className="mt-2 grid grid-cols-7 gap-1">
                        {Array.from({ length: startOffset }).map((_, i) => <div key={`sp-${i}`} className="h-9" />)}
                        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                          const current = new Date(calendarYear, calendarMonth, day);
                          current.setHours(0, 0, 0, 0);
                          const iso = formatISODate(current);
                          const occupied = occupiedDays.has(iso);
                          const selected = sameDay(selectedStart, current) || sameDay(selectedEnd, current);
                          const inRange = !!selectedStart && !!selectedEnd && current > selectedStart && current < selectedEnd;

                          let cls = 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50';
                          if (occupied) cls = 'border border-red-200 bg-red-50 text-red-600 cursor-not-allowed opacity-80';
                          if (inRange) cls = 'border border-indigo-200 bg-indigo-100 text-indigo-900';
                          if (selected && !isRangeBlocked(selectedStart ?? current, selectedEnd ?? current, occupiedDays)) {
                            cls = sameDay(selectedStart, current)
                              ? 'border-2 border-cyan-400 bg-cyan-500 text-white shadow-[0_0_0_4px_rgba(34,211,238,0.18)]'
                              : 'border-2 border-violet-500 bg-violet-600 text-white shadow-[0_0_0_4px_rgba(139,92,246,0.18)]';
                          }
                          if (sameDay(selectedStart, current) && sameDay(selectedEnd, current)) {
                            cls = 'border-2 border-fuchsia-500 bg-fuchsia-600 text-white shadow-[0_0_0_4px_rgba(217,70,239,0.18)]';
                          }

                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={occupied}
                              onClick={() => handleDateSelection(day)}
                              className={`relative h-9 rounded-xl text-xs font-bold transition ${cls}`}
                            >
                              {day}
                              {occupied ? <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-500" /> : null}
                              {selected ? <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white/95" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700"><span className="h-2 w-2 rounded-full bg-red-500" />Ocupado</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-cyan-700"><span className="h-2 w-2 rounded-full bg-cyan-500" />Inicio</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-violet-700"><span className="h-2 w-2 rounded-full bg-violet-500" />Fin</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700"><span className="h-2 w-2 rounded-full bg-blue-500" />Seleccionado</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-600"><span className="h-2 w-2 rounded-full bg-slate-300" />Disponible</span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
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
          )}
          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
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
          <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving || !form.campana || !form.sede || !form.sala || !form.fechaInicial || !form.fechaFin || !form.formador || !form.coordinador || (modoSolicitud && hayConflicto)}
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
