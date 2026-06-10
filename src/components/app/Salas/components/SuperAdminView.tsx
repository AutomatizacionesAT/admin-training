import { useState } from 'react';
import {
  Plus, Pencil, Trash2, Building2, ClipboardList,
  Users, Calendar, Clock, MapPin, Search, RefreshCw
} from 'lucide-react';
import type { SalaRecord, AsignacionRecord, SalasUser } from '../utils/types';
import SalaFormModal from './SalaFormModal';
import AsignacionFormModal from './AsignacionFormModal';
import { createSala, updateSala, deleteSala, createAsignacion, updateAsignacion, deleteAsignacion } from '../utils/fetchData';

interface Props {
  user: SalasUser;
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
  onRefresh: () => void;
}

type ActiveTab = 'catalogo' | 'asignaciones';

export default function SuperAdminView({ user, salas, asignaciones, onRefresh }: Props) {
  const [tab, setTab] = useState<ActiveTab>('asignaciones');
  const [search, setSearch] = useState('');

  // Sala CRUD state
  const [showSalaForm, setShowSalaForm] = useState(false);
  const [editingSala, setEditingSala] = useState<SalaRecord | null>(null);

  // Asignacion CRUD state
  const [showAsigForm, setShowAsigForm] = useState(false);
  const [editingAsig, setEditingAsig] = useState<AsignacionRecord | null>(null);

  // ── Sala handlers ──────────────────────────────────────────────────────────
  const handleSaveSala = async (data: Omit<SalaRecord, 'rowIndex'>) => {
    if (editingSala) {
      await updateSala({ ...data, rowIndex: editingSala.rowIndex });
    } else {
      await createSala(data);
    }
    setShowSalaForm(false);
    setEditingSala(null);
    onRefresh();
  };

  const handleDeleteSala = async (sala: SalaRecord) => {
    if (!confirm(`¿Eliminar la sala "${sala.sala}"? Esta acción no se puede deshacer.`)) return;
    await deleteSala(sala.rowIndex);
    onRefresh();
  };

  // ── Asignacion handlers ────────────────────────────────────────────────────
  const handleSaveAsig = async (data: Omit<AsignacionRecord, 'rowIndex'>) => {
    if (editingAsig) {
      await updateAsignacion({ ...data, rowIndex: editingAsig.rowIndex });
    } else {
      await createAsignacion(data);
    }
    setShowAsigForm(false);
    setEditingAsig(null);
    onRefresh();
  };

  const handleDeleteAsig = async (a: AsignacionRecord) => {
    if (!confirm(`¿Eliminar la asignación "${a.campana} — ${a.sala}"?`)) return;
    await deleteAsignacion(a.rowIndex);
    onRefresh();
  };

  // ── Filtered data ──────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredSalas = salas.filter(s =>
    !q || s.sala.toLowerCase().includes(q) || s.sede.toLowerCase().includes(q) || s.tipo.toLowerCase().includes(q)
  );
  const filteredAsigs = asignaciones.filter(a =>
    !q || a.campana.toLowerCase().includes(q) || a.sala.toLowerCase().includes(q) || a.formador.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="bg-linear-to-r from-violet-600 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
        <p className="text-violet-200 text-sm font-medium">Super Administrador</p>
        <h2 className="text-2xl font-extrabold mt-0.5">{user.nombre}</h2>
        <p className="text-violet-300 text-sm">{user.cargo}</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{salas.length}</p>
            <p className="text-xs text-violet-200">Salas</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{asignaciones.length}</p>
            <p className="text-xs text-violet-200">Asignaciones</p>
          </div>
        </div>
      </div>

      {/* Tabs + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
          <button
            onClick={() => setTab('asignaciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'asignaciones' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'}`}
          >
            <ClipboardList className="w-4 h-4" /> Asignaciones
          </button>
          <button
            onClick={() => setTab('catalogo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'catalogo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
          >
            <Building2 className="w-4 h-4" /> Catálogo
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white w-44"
            />
          </div>
          <button onClick={onRefresh} title="Actualizar" className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          {/* Add button */}
          {tab === 'catalogo' ? (
            <button
              onClick={() => { setEditingSala(null); setShowSalaForm(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Sala
            </button>
          ) : (
            <button
              onClick={() => { setEditingAsig(null); setShowAsigForm(true); }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Asignación
            </button>
          )}
        </div>
      </div>

      {/* ── ASIGNACIONES TAB ── */}
      {tab === 'asignaciones' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Campaña', 'REQ', 'Sala', 'Sede', 'Formador', 'Horario', 'Fechas', 'Personas', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAsigs.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">Sin asignaciones registradas</td></tr>
              ) : filteredAsigs.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{a.campana}</td>
                  <td className="px-4 py-3 text-slate-500">{a.req}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate" title={a.sala}>{a.sala}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">{a.sede}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate" title={a.formador}>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      {a.formador}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{a.horario}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{a.fechaInicial} → {a.fechaFin}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-center">{a.dPersonas}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingAsig(a); setShowAsigForm(true); }} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-500 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteAsig(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CATÁLOGO TAB ── */}
      {tab === 'catalogo' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Sede', 'Sala', 'Tipo', 'Cap.', 'Equipos', 'Horario', 'Tablero', 'TV', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSalas.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">Sin salas en el catálogo</td></tr>
              ) : filteredSalas.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center gap-1 w-fit">
                      <MapPin className="w-3 h-3" />{s.sede}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700 max-w-[220px] truncate" title={s.sala}>{s.sala}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.tipo === 'EXCLUSIVA' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {s.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-center font-mono">{s.capacidad}</td>
                  <td className="px-4 py-3 text-slate-600 text-center font-mono">{s.equipos}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{s.horario}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${s.tablero === 'SI' ? 'text-green-600' : 'text-slate-300'}`}>{s.tablero}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${s.tv === 'SI' ? 'text-green-600' : 'text-slate-300'}`}>{s.tv}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingSala(s); setShowSalaForm(true); }} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteSala(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showSalaForm && (
        <SalaFormModal
          initial={editingSala}
          onSave={handleSaveSala}
          onClose={() => { setShowSalaForm(false); setEditingSala(null); }}
        />
      )}
      {showAsigForm && (
        <AsignacionFormModal
          initial={editingAsig}
          salas={salas}
          onSave={handleSaveAsig}
          onClose={() => { setShowAsigForm(false); setEditingAsig(null); }}
        />
      )}
    </div>
  );
}
