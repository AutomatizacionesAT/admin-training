import { useState } from 'react';
import { X, Ticket, AlertCircle, CheckCircle } from 'lucide-react';
import type { AsignacionRecord, TicketRecord } from '../utils/types';

interface Props {
  asignacion: AsignacionRecord;
  userName: string;
  onSave: (ticket: Omit<TicketRecord, 'rowIndex'>, rowIndexAsignacion: number) => Promise<void>;
  onClose: () => void;
}

export default function TicketFormModal({ asignacion, userName, onSave, onClose }: Props) {
  const [posicion, setPosicion] = useState('');
  const [fallaPuntual, setFallaPuntual] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [numeroTicket, setNumeroTicket] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posicion || !fallaPuntual) return;
    setSaving(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      await onSave(
        {
          campana:          asignacion.campana,
          posicion,
          fallaPuntual,
          personaReporta:   userName,
          numeroTicket:     numeroTicket.trim(), // si está vacío, GAS genera uno
          fechaRealizacion: hoy,
          personaCreaTicket: userName,
          fechaCierre:      '',
          observaciones,
          respuesta:        '',
        },
        asignacion.rowIndex
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-r from-orange-500 to-amber-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 rounded-xl p-2">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold leading-tight">Crear Ticket</h2>
              <p className="text-orange-100 text-xs mt-0.5">{asignacion.campana} — {asignacion.sala}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info de la asignación */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-snug">
              Este ticket registrará un problema o novedad ocurrida durante la ocupación de la sala.
              Se notificará al administrador para seguimiento.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 pt-4">

          {/* Número de ticket manual */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              N° Ticket
              <span className="ml-2 text-[10px] font-normal text-slate-400 normal-case">
                (si se deja vacío, se asigna automáticamente)
              </span>
            </label>
            <input
              value={numeroTicket}
              onChange={e => setNumeroTicket(e.target.value)}
              placeholder="Ej: TKT-0012"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          {/* Posición que presenta el error */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Posición que presenta el error <span className="text-red-400">*</span>
            </label>
            <input
              value={posicion}
              onChange={e => setPosicion(e.target.value)}
              placeholder="Ej: Puesto 5, Fila B"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          {/* Falla puntual */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Falla puntual <span className="text-red-400">*</span>
            </label>
            <select
              value={fallaPuntual}
              onChange={e => setFallaPuntual(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            >
              <option value="">Seleccionar tipo de falla...</option>
              <option value="Problema de conectividad">Problema de conectividad (red/internet)</option>
              <option value="Equipo dañado">Equipo dañado (PC/pantalla)</option>
              <option value="Problema eléctrico">Problema eléctrico (tomacorrientes/luces)</option>
              <option value="Problema con tablero/TV">Problema con tablero / TV</option>
              <option value="Mobiliario dañado">Mobiliario dañado (silla/mesa)</option>
              <option value="Limpieza / Aseo">Limpieza / Aseo insuficiente</option>
              <option value="Temperatura / Aire acondicionado">Temperatura / Aire acondicionado</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Observaciones adicionales
            </label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Describe el problema con más detalle..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Persona que reporta (solo lectura) */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500">Reportado por: <span className="font-semibold text-slate-700">{userName}</span></span>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !posicion || !fallaPuntual}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
              <Ticket className="w-4 h-4" />
              {saving ? 'Enviando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
