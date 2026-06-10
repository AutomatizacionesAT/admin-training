import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { SalaRecord } from '../utils/types';

interface Props {
  initial?: SalaRecord | null;
  onSave: (sala: Omit<SalaRecord, 'rowIndex'>) => Promise<void>;
  onClose: () => void;
}

const SEDES  = ['TELARES', 'ROYAL', 'ELEMENTO'];
const TIPOS  = ['EXCLUSIVA', 'ROTATIVA'];
const SI_NO  = ['SI', 'NO'];
const HORARIOS = ['06:00 A 14:00', '14:00 A 22:00'];

const EMPTY: Omit<SalaRecord, 'rowIndex'> = {
  sede: '', sala: '', tipo: 'EXCLUSIVA',
  capacidad: '', equipos: '', horario: '06:00 A 14:00',
  tablero: 'SI', tv: 'SI',
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

export default function SalaFormModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<SalaRecord, 'rowIndex'>>(EMPTY);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-linear-to-r from-indigo-600 to-violet-700 p-5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold text-lg">
            {initial ? 'Editar Sala' : 'Nueva Sala'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sede">
              <select value={form.sede} onChange={e => set('sede', e.target.value)} className={inputCls} required>
                <option value="">Selecciona...</option>
                {SEDES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Tipo">
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Nombre de la Sala">
            <input
              type="text"
              value={form.sala}
              onChange={e => set('sala', e.target.value)}
              placeholder="Ej: PARIS PISO 1 EXCLUSIVA COLPATRIA"
              className={inputCls}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacidad (puestos)">
              <input type="number" value={form.capacidad} onChange={e => set('capacidad', e.target.value)} className={inputCls} min="1" />
            </Field>
            <Field label="Equipos">
              <input type="number" value={form.equipos} onChange={e => set('equipos', e.target.value)} className={inputCls} min="0" />
            </Field>
          </div>

          <Field label="Horario">
            <select value={form.horario} onChange={e => set('horario', e.target.value)} className={inputCls}>
              {HORARIOS.map(h => <option key={h}>{h}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tablero">
              <select value={form.tablero} onChange={e => set('tablero', e.target.value)} className={inputCls}>
                {SI_NO.map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="TV">
              <select value={form.tv} onChange={e => set('tv', e.target.value)} className={inputCls}>
                {SI_NO.map(v => <option key={v}>{v}</option>)}
              </select>
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
            className="flex-1 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:from-indigo-700 hover:to-violet-700 transition-all"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
