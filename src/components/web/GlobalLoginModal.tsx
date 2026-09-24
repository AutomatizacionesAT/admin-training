import { useState } from 'react';
import { X, LogIn, AlertCircle, Lock, User, LoaderCircle } from 'lucide-react';

interface Props {
  onLogin: (usuario: string, clave: string) => Promise<boolean>;
  onClose: () => void;
}

export default function GlobalLoginModal({ onLogin, onClose }: Props) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !clave || loading) return;
    setLoading(true);
    setError(null);

    try {
      const success = await onLogin(usuario.trim(), clave);
      if (!success) {
        setError('Usuario o contraseña incorrectos, o el documento no tiene acceso.');
        return;
      }
      onClose();
    } catch (loginError) {
      console.error('[AUTH]', loginError);
      setError('No fue posible validar el ingreso. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#005082] to-[#003a61] p-6 relative">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar inicio de sesión"
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Iniciar sesión</h2>
              <p className="text-slate-300 text-xs mt-0.5">Admin Training — Atento</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="space-y-4">
            <div>
              <label className="flex text-sm font-semibold text-slate-700 mb-1.5 items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Usuario
              </label>
              <input
                type="text"
                value={usuario}
                onChange={e => { setUsuario(e.target.value); setError(null); }}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                autoFocus
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-[#005082] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="flex text-sm font-semibold text-slate-700 mb-1.5 items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" /> Contraseña
              </label>
              <input
                type="password"
                value={clave}
                onChange={e => { setClave(e.target.value); setError(null); }}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-[#005082] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !usuario.trim() || !clave}
            className="w-full bg-[#F37021] hover:bg-[#d95f10] disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
          >
            {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
