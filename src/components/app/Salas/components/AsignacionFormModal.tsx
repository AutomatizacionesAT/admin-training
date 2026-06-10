import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { AsignacionRecord, SalaRecord } from '../utils/types';

interface Props {
  initial?: AsignacionRecord | null;
  salas: SalaRecord[];
  onSave: (a: Omit<AsignacionRecord, 'rowIndex'>) => Promise<void>;
  onClose: () => void;
}

const EMPTY: Omit<AsignacionRecord, 'rowIndex'> = {
  campana: '', req: '', sala: '', sede: '',
  formador: '', fechaInicial: '', fechaFin: '',
  horario: '', dPersonas: '',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

export default function AsignacionFormModal({ initial, salas, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<AsignacionRecord, 'rowIndex'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rowIndex: _r, ...rest } = initial;
      setForm(rest);
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  const set = (key: keyof typeof EMPTY, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // Auto-fill sede when selecting sala
  const handleSalaChange = (salaName: string) => {
    set('sala', salaName);
    const found = salas.find(s => s.sala === salaName);
    if (found) set('sede', found.sede);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  const HORARIOS = ['06:00 A 14:00', '14:00 A 22:00'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 p-5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold text-lg">
            {initial ? 'Editar Asignación' : 'Nueva Asignación'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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

          <Field label="Sala">
            <select value={form.sala} onChange={e => handleSalaChange(e.target.value)} className={inputCls} required>
              <option value="">Selecciona una sala...</option>
              {salas.map((s, i) => (
                <option key={i} value={s.sala}>{s.sede} — {s.sala}</option>
              ))}
            </select>
          </Field>

          <Field label="Sede (auto)">
            <input type="text" value={form.sede} readOnly className={`${inputCls} bg-slate-50 text-slate-500`} placeholder="Se completa automáticamente" />
          </Field>

          <Field label="Formador / Coordinador">
            <input
              type="text"
              value={form.formador}
              onChange={e => set('formador', e.target.value)}
              placeholder="Nombre o cédula del coordinador"
              className={inputCls}
            />
          </Field>

          <Field label="Horario">
            <select value={form.horario} onChange={e => set('horario', e.target.value)} className={inputCls}>
              <option value="">Selecciona...</option>
              {HORARIOS.map(h => <option key={h}>{h}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha Inicial">
              <input type="date" value={form.fechaInicial} onChange={e => set('fechaInicial', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fecha Fin">
              <input type="date" value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving}
            className="flex-1 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
