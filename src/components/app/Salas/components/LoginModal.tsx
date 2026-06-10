import { X, LogIn, AlertCircle, Loader2, IdCard } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onLogin: (cedula: string) => Promise<boolean>;
  onClose: () => void;
  error: string | null;
  loading: boolean;
}

export default function LoginModal({ onLogin, onClose, error, loading }: Props) {
  const [cedula, setCedula] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) return;
    await onLogin(cedula.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <IdCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Acceso a Salas</h2>
              <p className="text-blue-100 text-xs mt-0.5">Ingresa tu número de cédula</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Número de cédula
            </label>
            <input
              type="text"
              value={cedula}
              onChange={e => setCedula(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 1012385857"
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !cedula.trim()}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Ingresar</>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Solo coordinadores y administradores registrados pueden acceder.
          </p>
        </form>
      </div>
    </div>
  );
}
