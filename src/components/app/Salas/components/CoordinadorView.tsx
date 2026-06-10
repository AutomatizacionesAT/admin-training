import { Building2, Calendar, Clock, Users, MapPin, Info } from 'lucide-react';
import type { AsignacionRecord, SalasUser } from '../utils/types';

interface Props {
  user: SalasUser;
  asignaciones: AsignacionRecord[];
}

export default function CoordinadorView({ user, asignaciones }: Props) {
  // Filter only assignments for this coordinador (by nombre match)
  const mis = asignaciones.filter(a => {
    const f = a.formador?.toUpperCase() || '';
    const n = user.nombre?.toUpperCase() || '';
    // Match by document in formador field or by name substring
    return f.includes(user.documento) || (n.length > 3 && f.includes(n.split(' ')[0]));
  });

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
        <p className="text-blue-100 text-sm font-medium mb-1">Bienvenido/a</p>
        <h2 className="text-2xl font-extrabold leading-tight">{user.nombre}</h2>
        <p className="text-blue-200 text-sm mt-1">{user.cargo}</p>
        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 w-fit">
          <Building2 className="w-4 h-4 text-blue-200" />
          <span className="text-sm font-semibold">
            {mis.length} sala{mis.length !== 1 ? 's' : ''} asignada{mis.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Asignaciones */}
      {mis.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-16 text-center">
          <Info className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-600">Sin salas asignadas</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            Aún no tienes salas asignadas. Contacta al administrador para coordinar tu espacio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mis.map((a, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-5 space-y-4">
              {/* Header card */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">
                    {a.campana || '—'}
                  </p>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">
                    {a.sala || '—'}
                  </h3>
                </div>
                {a.req && (
                  <span className="shrink-0 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-lg px-2 py-1">
                    REQ: {a.req}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium">{a.sede || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs">{a.horario || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs">
                    {a.fechaInicial || '—'} → {a.fechaFin || '—'}
                  </span>
                </div>
                {a.dPersonas && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs">{a.dPersonas} personas</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
