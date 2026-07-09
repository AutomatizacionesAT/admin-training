import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X, Ticket, AlertCircle, CheckCircle } from 'lucide-react';
import type { TicketRecord } from '../utils/types';

interface Props {
  ticket: TicketRecord;
  title: string;
  subtitle: string;
  actionLabel: string;
  onSubmit: (respuesta: string) => Promise<void>;
  onClose: () => void;
  saving?: boolean;
  error?: string | null;
}

export default function TicketCloseModal({ ticket, title, subtitle, actionLabel, onSubmit, onClose, saving = false, error }: Props) {
  const [respuesta, setRespuesta] = useState('');
  const [localSaving, setLocalSaving] = useState(false);

  useEffect(() => {
    setRespuesta('');
  }, [ticket.rowIndex]);

  const busy = saving || localSaving;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!respuesta.trim()) return;
    setLocalSaving(true);
    try {
      await onSubmit(respuesta.trim());
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Ticket className="w-5 h-5" />
            <div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-blue-200 text-xs mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 space-y-1">
            <p><strong>Campaña:</strong> {ticket.campana}</p>
            <p><strong>Falla:</strong> {ticket.fallaPuntual}</p>
            <p><strong>Posición:</strong> {ticket.posicion}</p>
            {ticket.observaciones && <p><strong>Observación:</strong> {ticket.observaciones}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Respuesta <span className="text-red-400">*</span>
            </label>
            <textarea
              value={respuesta}
              onChange={e => setRespuesta(e.target.value)}
              rows={3}
              placeholder="Escribe la nota de cierre o respuesta..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-amber-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>El ticket quedará como cerrado.</span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!respuesta.trim() || busy}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {busy ? 'Guardando...' : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
