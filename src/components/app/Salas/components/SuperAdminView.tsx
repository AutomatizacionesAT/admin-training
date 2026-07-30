import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Building2, ClipboardList,
  Users, Calendar, Clock, MapPin, Search,
  CheckCircle, XCircle, Clock3, Ticket, AlertCircle, Bell, BarChart3, Loader2, ArrowLeft
} from 'lucide-react';
import type { SalaRecord, AsignacionRecord, TicketRecord, SalasUser } from '../utils/types';
import SalaFormModal from './SalaFormModal';
import AsignacionFormModal from './AsignacionFormModal';
import TicketFormModal from './TicketFormModal';
import TicketCloseModal from './TicketCloseModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import TicketAnalyticsDashboard from './TicketAnalyticsDashboard';
import CalendarioAsignaciones from './CalendarioAsignaciones';
import {
  createSala, updateSala, deleteSala,
  createAsignacion, createTicket, updateAsignacion, deleteAsignacion,
  updateEstadoAsignacion, closeTicket, fetchTickets
} from '../utils/fetchData';
import { formatAsignacionRango, parseAsignacionDate } from '../utils/asignacionUtils';

interface Props {
  user: SalasUser;
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
  onRefresh: () => void;
  onBackToGeneral: () => void;
  timelinePreset?: { sala: SalaRecord; sede: string; horario: string; fechaInicial: string; fechaFin: string } | null;
}

type ActiveTab = 'solicitudes' | 'asignaciones' | 'tickets' | 'catalogo';

const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  APROBADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  RECHAZADO: 'bg-red-100 text-red-600 border-red-200',
};

function diffDays(start: string, end: string): number {
  const s = parseAsignacionDate(start);
  const e = parseAsignacionDate(end);
  if (!s || !e) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.max(Math.round(ms / (24 * 60 * 60 * 1000)), 0);
}

export default function SuperAdminView({ user, salas, asignaciones, onRefresh, onBackToGeneral, timelinePreset }: Props) {
  const [tab, setTab] = useState<ActiveTab>('solicitudes');
  const [search, setSearch] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTicketAnalytics, setShowTicketAnalytics] = useState(false);
  const [requestPreset, setRequestPreset] = useState<Props['timelinePreset']>(null);
  const [ticketCreateTarget, setTicketCreateTarget] = useState<AsignacionRecord | null>(null);
  const [closeTarget, setCloseTarget] = useState<TicketRecord | null>(null);

  // Sala CRUD state
  const [showSalaForm, setShowSalaForm] = useState(false);
  const [editingSala, setEditingSala] = useState<SalaRecord | null>(null);

  // Asignacion CRUD state
  const [showAsigForm, setShowAsigForm] = useState(false);
  const [editingAsig, setEditingAsig] = useState<AsignacionRecord | null>(null);

  // ── Filtro de calendario ───────────────────────────────────────────────────
  const [calFilter, setCalFilter] = useState<{ day: number; month: number; year: number } | null>(null);
  const [calSedeFilter, setCalSedeFilter] = useState<string | null>(null);

  // Delete confirm modal
  const [deleteConfirm, setDeleteConfirm] = useState<
    { type: 'sala'; item: SalaRecord } | { type: 'asig'; item: AsignacionRecord } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [ticketProcessing, setTicketProcessing] = useState<number | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  const aprobadas = useMemo(() =>
    asignaciones.filter(a => (a.estadoAsignacion || 'APROBADO') === 'APROBADO'),
    [asignaciones]
  );
  const solicitudes = useMemo(() =>
    asignaciones.filter(a => (a.estadoAsignacion || 'APROBADO') === 'PENDIENTE'),
    [asignaciones]
  );

  const q = search.toLowerCase();
  const filteredSalas = salas.filter(s =>
    !q || s.sala.toLowerCase().includes(q) || s.sede.toLowerCase().includes(q)
  );

  const matchAsig = (a: AsignacionRecord) =>
    !q ||
    a.campana.toLowerCase().includes(q) ||
    a.sala.toLowerCase().includes(q) ||
    a.formador.toLowerCase().includes(q) ||
    a.coordinador.toLowerCase().includes(q) ||
    a.tipoDeUso.toLowerCase().includes(q);

  const filteredSolicitudes = useMemo(() => solicitudes.filter(a => matchAsig(a)), [solicitudes, q]);

  // Aplica búsqueda + filtros del calendario (sede y/o día)
  const filteredAsigs = useMemo(() => {
    let result = aprobadas.filter(a =>
      matchAsig(a)
    );
    if (calSedeFilter) {
      result = result.filter(a => a.sede === calSedeFilter);
    }
    if (calFilter) {
      const target = new Date(calFilter.year, calFilter.month, calFilter.day);
      target.setHours(0, 0, 0, 0);
      result = result.filter(a => {
        const s = parseAsignacionDate(a.fechaInicial);
        const e = parseAsignacionDate(a.fechaFin);
        if (!s || !e) return false;
        return target >= s && target <= e;
      });
    }
    return result;
  }, [aprobadas, q, calFilter, calSedeFilter]);
  useEffect(() => {
    if (!timelinePreset) return;
    setRequestPreset(timelinePreset);
    setEditingAsig(null);
    setTab('asignaciones');
    setShowAsigForm(true);
  }, [timelinePreset]);

  // ── Sala handlers ──────────────────────────────────────────────────────────
  const handleSaveSala = async (data: Omit<SalaRecord, 'rowIndex'>) => {
    if (editingSala) await updateSala({ ...data, rowIndex: editingSala.rowIndex });
    else await createSala(data);
    setShowSalaForm(false);
    setEditingSala(null);
    onRefresh();
  };

  const handleDeleteSala = (sala: SalaRecord) => setDeleteConfirm({ type: 'sala', item: sala });

  // ── Asignacion handlers ────────────────────────────────────────────────────
  const handleSaveAsig = async (data: Omit<AsignacionRecord, 'rowIndex'>) => {
    if (editingAsig) await updateAsignacion({ ...data, rowIndex: editingAsig.rowIndex });
    else await createAsignacion({ ...data, estadoAsignacion: 'APROBADO' });
    setShowAsigForm(false);
    setEditingAsig(null);
    onRefresh();
  };

  const handleDeleteAsig = (a: AsignacionRecord) => setDeleteConfirm({ type: 'asig', item: a });

  // ── Aprobar / Rechazar solicitud ───────────────────────────────────────────
  const [processingEstado, setProcessingEstado] = useState<number | null>(null);

  const handleEstado = async (a: AsignacionRecord, estado: 'APROBADO' | 'RECHAZADO') => {
    setProcessingEstado(a.rowIndex);
    try {
      await updateEstadoAsignacion(a.rowIndex, estado);
      onRefresh();
    } finally {
      setProcessingEstado(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      if (deleteConfirm.type === 'sala') await deleteSala(deleteConfirm.item.rowIndex);
      else await deleteAsignacion(deleteConfirm.item.rowIndex);
      setDeleteConfirm(null);
      onRefresh();
    } finally {
      setDeleting(false);
    }
  };

  // ── Tickets ───────────────────────────────────────────────────────────────
  const loadTickets = async () => {
    const data = await fetchTickets();
    setTickets(data);
    setTicketsLoaded(true);
  };

  useEffect(() => { loadTickets(); }, []);

  const handleTabChange = (t: ActiveTab) => {
    setTab(t);
    if (t === 'tickets' && !ticketsLoaded) loadTickets();
  };

  const handleCreateTicket = async (ticketData: Omit<TicketRecord, 'rowIndex'>) => {
    await createTicket(ticketData);
    await loadTickets();
    setTicketCreateTarget(null);
  };

  const handleCloseTicket = async (respuesta: string) => {
    if (!closeTarget || !respuesta.trim()) return;
    setTicketProcessing(closeTarget.rowIndex);
    setTicketError(null);
    try {
      await closeTicket(closeTarget.rowIndex, respuesta.trim());
      setCloseTarget(null);
      await loadTickets();
    } catch {
      setTicketError('No se pudo cerrar el ticket. Verifica que el Apps Script esté desplegado.');
    } finally {
      setTicketProcessing(null);
    }
  };

  // ── Badge ───────────────────────────────────────────────────────────────────
  const estadoBadge = (estado: string) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${ESTADO_COLORS[estado] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {estado === 'PENDIENTE' && <Clock3 className="w-3 h-3" />}
      {estado === 'APROBADO' && <CheckCircle className="w-3 h-3" />}
      {estado === 'RECHAZADO' && <XCircle className="w-3 h-3" />}
      {estado}
    </span>
  );

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="bg-linear-to-r from-violet-600 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-violet-200 text-sm font-medium">Super Administrador</p>
            <h2 className="text-2xl font-extrabold mt-0.5">{user.nombre}</h2>
            <p className="text-violet-300 text-sm">{user.cargo}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics Salas
            </button>
            <button
              onClick={() => setShowTicketAnalytics(true)}
              className="flex items-center gap-2 bg-orange-500/80 hover:bg-orange-500 border border-orange-300/40 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <Ticket className="w-4 h-4" />
              Analytics Tickets
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{salas.length}</p>
            <p className="text-xs text-violet-200">Salas</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{aprobadas.length}</p>
            <p className="text-xs text-violet-200">Asignadas</p>
          </div>
          {solicitudes.length > 0 && (
            <div className="bg-amber-400/30 border border-amber-300/40 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black flex items-center justify-center gap-1">
                {solicitudes.length} <Bell className="w-4 h-4 text-amber-200" />
              </p>
              <p className="text-xs text-amber-200">Solicitudes</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
          <button
            onClick={() => handleTabChange('solicitudes')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'solicitudes' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'}`}
          >
            <Bell className="w-4 h-4" /> Solicitudes
            {solicitudes.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {solicitudes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('asignaciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'asignaciones' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'}`}
          >
            <ClipboardList className="w-4 h-4" /> Asignaciones
          </button>
          <button
            onClick={() => handleTabChange('tickets')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'tickets' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-orange-500 hover:bg-orange-50'}`}
          >
            <Ticket className="w-4 h-4" /> Tickets
            {tickets.filter(t => !t.fechaCierre).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {tickets.filter(t => !t.fechaCierre).length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('catalogo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'catalogo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
          >
            <Building2 className="w-4 h-4" /> Catálogo
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onBackToGeneral} title="Volver a vista general" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
            General
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white w-44"
            />
          </div>
          {tab === 'catalogo' && (
            <button
              onClick={() => { setEditingSala(null); setShowSalaForm(true); setRequestPreset(null); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Sala
            </button>
          )}
          {tab === 'asignaciones' && (
            <button
              onClick={() => { setEditingAsig(null); setShowAsigForm(true); setRequestPreset(null); }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Asignación
            </button>
          )}
        </div>
      </div>

      {/* ── SOLICITUDES PENDIENTES ── */}
      {tab === 'solicitudes' && (
        <div>
          {filteredSolicitudes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-16 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-300 mb-3" />
              <h3 className="font-bold text-slate-600">Sin solicitudes pendientes</h3>
              <p className="text-slate-400 text-sm mt-1">Todas las solicitudes están al día.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold text-amber-700">
                  {filteredSolicitudes.length} solicitud{filteredSolicitudes.length > 1 ? 'es' : ''} esperando aprobación
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Campaña', 'REQ', 'Sala', 'Sede', 'Formador', 'Coordinador', 'Tipo de uso', 'Horario', 'Fechas', 'Personas', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSolicitudes.map((a, i) => (
                    <tr key={i} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{a.campana}</td>
                      <td className="px-4 py-3 text-slate-500">{a.req}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate" title={a.sala}>{a.sala}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">{a.sede}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate" title={a.formador}>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          {a.formador}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate" title={a.coordinador}>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          {a.coordinador || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3" title={a.tipoDeUso}>
                        <span className="inline-flex max-w-[160px] items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 truncate">
                          {a.tipoDeUso || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.horario}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatAsignacionRango(a.fechaInicial, a.fechaFin)}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-center">{a.dPersonas}</td>
                      <td className="px-4 py-3">
                        {a.estadoAsignacion === 'PENDIENTE' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleEstado(a, 'APROBADO')}
                              disabled={processingEstado !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3" /> Aprobar
                            </button>
                            <button
                              onClick={() => handleEstado(a, 'RECHAZADO')}
                              disabled={processingEstado !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" /> Rechazar
                            </button>
                          </div>
                        ) : (
                          estadoBadge(a.estadoAsignacion || 'APROBADO')
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ASIGNACIONES TAB ── */}
      {tab === 'asignaciones' && (
        <div className="flex gap-4 items-start">

          {/* Tabla */}
          <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

            {/* Banner filtros del calendario */}
            {(calFilter || calSedeFilter) && (
              <div className="flex items-center justify-between gap-3 bg-violet-50 border-b border-violet-100 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2 text-violet-700">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-bold">
                    {calSedeFilter && <>Sede {calSedeFilter}</>}
                    {calSedeFilter && calFilter && ' · '}
                    {calFilter && <>Día {calFilter.day} de {MONTH_NAMES_ES[calFilter.month]} {calFilter.year}</>}
                  </span>
                  <span className="bg-violet-200 text-violet-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {filteredAsigs.length}
                  </span>
                </div>
                <button
                  onClick={() => { setCalFilter(null); setCalSedeFilter(null); }}
                  className="flex items-center gap-1 text-xs font-bold text-violet-500 hover:text-violet-700 bg-violet-100 hover:bg-violet-200 px-2.5 py-1 rounded-lg transition-all shrink-0"
                >
                  <XCircle className="w-3.5 h-3.5" /> Limpiar
                </button>
              </div>
            )}

            <div className="max-h-[calc(100vh-350px)] overflow-auto">
              <table className="min-w-[1280px] w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Campaña', 'REQ', 'Sala', 'Sede', 'Formador', 'Coordinador', 'Tipo de uso', 'Horario', 'Fechas', 'Personas', 'Estado', ''].map(h => (
                    <th key={h} className="sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAsigs.length === 0 ? (
                  <tr><td colSpan={12} className="text-center py-12 text-slate-400">
                    {(calFilter || calSedeFilter)
                      ? 'Sin asignaciones con los filtros seleccionados'
                      : 'Sin asignaciones aprobadas'}
                  </td></tr>
                ) : filteredAsigs.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{a.campana}</td>
                    <td className="px-4 py-3 text-slate-500">{a.req}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate" title={a.sala}>{a.sala}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">{a.sede}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate" title={a.formador}>
                      <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-400 shrink-0" />{a.formador}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate" title={a.coordinador}>
                      <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-400 shrink-0" />{a.coordinador || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate" title={a.tipoDeUso}>{a.tipoDeUso || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{a.horario}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{formatAsignacionRango(a.fechaInicial, a.fechaFin)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-center">{a.dPersonas}</td>
                    <td className="px-4 py-3">{estadoBadge(a.estadoAsignacion || 'APROBADO')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTicketCreateTarget(a)}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
                          title="Crear ticket"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingAsig(a); setShowAsigForm(true); setRequestPreset(null); }} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-500 transition-colors">
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
          </div>{/* fin tabla */}

          {/* Calendario lateral */}
          <div className="w-96 shrink-0">
            <CalendarioAsignaciones
              salas={salas}
              asignaciones={aprobadas}
              selectedDay={calFilter?.day ?? null}
              selectedSede={calSedeFilter}
              onDaySelect={(day, month, year) =>
                setCalFilter(day !== null ? { day, month, year } : null)
              }
              onSedeSelect={setCalSedeFilter}
            />
          </div>

        </div>
      )}

      {/* ── TICKETS TAB ── */}
      {tab === 'tickets' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-600">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} registrados</p>
          </div>
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-16 text-center">
              <Ticket className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-600">Sin tickets registrados</h3>
              <p className="text-slate-400 text-sm mt-1">Los tickets los crean los coordinadores al reportar problemas.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[1800px] w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                    {['N° Ticket', 'Sala', 'Sede', 'Campaña', 'Falla', 'Posición', 'Reportado por', 'Fecha realización', 'Fecha cierre', 'Días', 'Estado', 'Notas de cierre'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tickets.map((t) => {
                      const estadoTicket = t.fechaCierre ? 'CERRADO' : 'ABIERTO';
                      const abierto = estadoTicket === 'ABIERTO';
                      const notaCierre = t.fechaCierre ? (t.respuesta?.trim() || '-') : '-';
                      const dias = t.fechaCierre ? diffDays(t.fechaRealizacion, t.fechaCierre) : null;
                      return (
                        <tr key={t.rowIndex} className={`transition-colors ${estadoTicket === 'ABIERTO' ? 'bg-orange-50/70 hover:bg-orange-100/70' : 'hover:bg-slate-50/60'}`}>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">{t.numeroTicket}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700 max-w-[180px] truncate" title={t.sala || '-'}>{t.sala || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate" title={t.sede || '-'}>{t.sede || '-'}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{t.campana}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate" title={t.fallaPuntual}>{t.fallaPuntual}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{t.posicion}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate" title={t.personaReporta}>
                            <div className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400 shrink-0" />{t.personaReporta}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{t.fechaRealizacion || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{t.fechaCierre || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-center font-bold">{dias ?? '-'}</td>
                          <td className="px-4 py-3">
                            {estadoTicket === 'ABIERTO' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-orange-100 text-orange-600 border-orange-200">
                                <Clock3 className="w-3 h-3" /> Abierto
                              </span>
                            )}
                            {estadoTicket === 'CERRADO' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200">
                                <XCircle className="w-3 h-3" /> Cerrado
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {abierto ? (
                              <button
                                disabled={ticketProcessing === t.rowIndex}
                                onClick={() => {
                                  setCloseTarget(t);
                                  setTicketError(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold transition-all disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" /> Cerrar ticket
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 italic max-w-[180px] truncate block" title={notaCierre}>
                                {notaCierre}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      {/* ── Modals: ticket ── */}
      {ticketCreateTarget && (
        <TicketFormModal
          asignacion={ticketCreateTarget}
          userName={user.nombre}
          onSave={handleCreateTicket}
          onClose={() => setTicketCreateTarget(null)}
        />
      )}
      {closeTarget && (
        <TicketCloseModal
          ticket={closeTarget}
          title="Cerrar ticket"
          subtitle="El ticket quedará como CERRADO"
          actionLabel="Cerrar ticket"
          onSubmit={handleCloseTicket}
          onClose={() => { setCloseTarget(null); setTicketError(null); }}
          saving={ticketProcessing === closeTarget.rowIndex}
          error={ticketError}
        />
      )}

      {/* ── Modal: confirmar eliminación ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header rojo */}
            <div className="bg-linear-to-br from-red-500 to-rose-600 px-6 py-6 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="font-black text-xl">¿Eliminar {deleteConfirm.type === 'sala' ? 'sala' : 'asignación'}?</h3>
              <p className="text-red-100 text-sm mt-1">Esta acción no se puede deshacer</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Detalle del item a eliminar */}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center space-y-1">
                {deleteConfirm.type === 'sala' ? (
                  <>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Sala</p>
                    <p className="font-bold text-slate-800">{deleteConfirm.item.sala}</p>
                    <p className="text-xs text-slate-500">{deleteConfirm.item.sede}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Asignación</p>
                    <p className="font-bold text-slate-800">{deleteConfirm.item.campana}</p>
                    <p className="text-xs text-slate-500">{deleteConfirm.item.sala} · {deleteConfirm.item.sede}</p>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                  {deleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Sí, eliminar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSalaForm && (
        <SalaFormModal
          initial={editingSala}
          salas={salas}
          onSave={handleSaveSala}
          onClose={() => { setShowSalaForm(false); setEditingSala(null); }}
        />
      )}
          {showAsigForm && (
        <AsignacionFormModal
          initial={editingAsig}
          salas={salas}
          asignaciones={asignaciones}
          onSave={handleSaveAsig}
          onClose={() => { setShowAsigForm(false); setEditingAsig(null); setRequestPreset(null); }}
          useAvailabilityCalendar
          preset={requestPreset ?? undefined}
        />
      )}

      {/* Analytics full-screen */}
      {showAnalytics && (
        <AnalyticsDashboard
          salas={salas}
          asignaciones={asignaciones}
          tickets={tickets}
          onClose={() => setShowAnalytics(false)}
        />
      )}
      {showTicketAnalytics && (
        <TicketAnalyticsDashboard
          asignaciones={asignaciones}
          tickets={tickets}
          onClose={() => setShowTicketAnalytics(false)}
        />
      )}
    </div>
  );
}
