import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, MapPin, Info,
  Plus, Ticket, CheckCircle, XCircle, Clock3, MessageSquare, ArrowLeft
} from 'lucide-react';
import type { AsignacionRecord, SalaRecord, SalasUser, TicketRecord } from '../utils/types';
import AsignacionFormModal from './AsignacionFormModal';
import TicketFormModal from './TicketFormModal';
import { createAsignacion, createTicket, fetchTickets } from '../utils/fetchData';
import { formatAsignacionRango } from '../utils/asignacionUtils';

interface Props {
  user: SalasUser;
  salas: SalaRecord[];
  asignaciones: AsignacionRecord[];
  onRefresh: () => void;
  onBackToGeneral: () => void;
}

const ESTADO_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    icon: Clock3,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  APROBADO: {
    label: 'Aprobado',
    icon: CheckCircle,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  RECHAZADO: {
    label: 'Rechazado',
    icon: XCircle,
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200',
  },
} as const;

type EstadoKey = keyof typeof ESTADO_CONFIG;

function resolveTicketEstado(ticket: TicketRecord | undefined, fallback = ''): 'ABIERTO' | 'RESPONDIDO' | 'CERRADO' {
  if (ticket?.fechaCierre) return 'CERRADO';
  if (ticket?.respuesta?.trim()) return 'RESPONDIDO';
  if (fallback === 'CERRADO' || fallback === 'RESPONDIDO') return fallback as 'CERRADO' | 'RESPONDIDO';
  return 'ABIERTO';
}

const TICKET_ESTADO_CONFIG = {
  ABIERTO:     { label: 'Abierto',                    cls: 'bg-orange-100 text-orange-600' },
  RESPONDIDO:  { label: 'Abierto · Respuesta admin',  cls: 'bg-blue-100 text-blue-700' },
  CERRADO:     { label: 'Cerrado',                    cls: 'bg-slate-100 text-slate-500' },
} as const;

export default function CoordinadorView({ user, salas, asignaciones, onRefresh, onBackToGeneral }: Props) {
  const [showSolicitud, setShowSolicitud] = useState(false);
  const [ticketTarget, setTicketTarget] = useState<AsignacionRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);

  useEffect(() => {
    fetchTickets().then(setTickets).catch(() => setTickets([]));
  }, [asignaciones]);

  // Asignaciones propias (por nombre o documento)
  const mis = asignaciones.filter(a => {
    const f = (a.formador ?? '').toUpperCase();
    const n = (user.nombre ?? '').toUpperCase();
    return f.includes(user.documento) || (n.length > 3 && f.includes(n.split(' ')[0]));
  });

  const pendientes = mis.filter(a => (a.estadoAsignacion || 'APROBADO') === 'PENDIENTE');
  const aprobadas = mis.filter(a => (a.estadoAsignacion || 'APROBADO') === 'APROBADO');
  const rechazadas = mis.filter(a => (a.estadoAsignacion || 'APROBADO') === 'RECHAZADO');

  // ── Crear solicitud (PENDIENTE) ────────────────────────────────────────────
  const handleSolicitud = async (data: Omit<AsignacionRecord, 'rowIndex'>) => {
    setSaving(true);
    try {
      await createAsignacion({ ...data, estadoAsignacion: 'PENDIENTE', ticket: '', estadoTicket: '' });
      setShowSolicitud(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  // ── Crear ticket ───────────────────────────────────────────────────────────
  const handleCreateTicket = async (
    ticketData: Omit<TicketRecord, 'rowIndex'>,
    rowIndexAsignacion: number
  ) => {
    await createTicket({ ...ticketData, rowIndexAsignacion } as Omit<TicketRecord, 'rowIndex'> & { rowIndexAsignacion: number });
    setTicketTarget(null);
    onRefresh();
  };

  const estadoBadge = (estado: string) => {
    const key = (estado || 'APROBADO') as EstadoKey;
    const cfg = ESTADO_CONFIG[key] ?? ESTADO_CONFIG.APROBADO;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const AsigCard = ({ a }: { a: AsignacionRecord }) => {
    const estado = (a.estadoAsignacion || 'APROBADO') as EstadoKey;
    const isAprobada = estado === 'APROBADO';
    const tieneTicket = !!a.ticket;
    const ticketInfo = tieneTicket
      ? tickets.find(t => t.numeroTicket === a.ticket)
      : undefined;
    const ticketEstado = resolveTicketEstado(ticketInfo, a.estadoTicket);
    const ticketCfg = TICKET_ESTADO_CONFIG[ticketEstado];

    return (
      <div className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all p-5 space-y-4 ${estado === 'PENDIENTE' ? 'border-amber-200 bg-amber-50/40' :
        estado === 'RECHAZADO' ? 'border-red-200 bg-red-50/30 opacity-70' :
          'border-slate-100'
        }`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">{a.campana || '—'}</p>
            <h3 className="font-bold text-slate-800 text-sm leading-snug truncate">{a.sala || '—'}</h3>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {estadoBadge(a.estadoAsignacion)}
            {a.req && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-lg px-2 py-0.5">
                REQ: {a.req}
              </span>
            )}
          </div>
        </div>

        {/* Detalles */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
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
            <span className="text-xs">{formatAsignacionRango(a.fechaInicial, a.fechaFin)}</span>
          </div>
          {a.dPersonas && (
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs">{a.dPersonas} personas</span>
            </div>
          )}
        </div>

        {/* Acción: crear ticket (solo si aprobada) */}
        {isAprobada && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {tieneTicket ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-orange-600 font-semibold">
                  <Ticket className="w-3.5 h-3.5 shrink-0" />
                  <span>Ticket: {a.ticket}</span>
                  <span className={`px-1.5 py-px rounded text-[10px] font-bold ${ticketCfg.cls}`}>
                    {ticketCfg.label}
                  </span>
                </div>
                {ticketInfo?.respuesta?.trim() && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 mb-1">
                      <MessageSquare className="w-3 h-3" />
                      Respuesta del administrador
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ticketInfo.respuesta}</p>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setTicketTarget(a)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-orange-200 text-orange-500 hover:bg-orange-50 text-xs font-bold transition-all"
              >
                <Ticket className="w-3.5 h-3.5" />
                Reportar problema / Cerrar sala
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
        <p className="text-blue-100 text-sm font-medium mb-1">Bienvenido/a</p>
        <h2 className="text-2xl font-extrabold leading-tight">{user.nombre}</h2>
        <p className="text-blue-200 text-sm mt-1">{user.cargo}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-xl font-black">{mis.length}</p>
            <p className="text-xs text-blue-200">Total solicitudes</p>
          </div>
          <div className="bg-amber-400/20 rounded-xl px-4 py-2 text-center border border-amber-300/30">
            <p className="text-xl font-black">{pendientes.length}</p>
            <p className="text-xs text-amber-100">Pendientes</p>
          </div>
          <div className="bg-emerald-400/20 rounded-xl px-4 py-2 text-center border border-emerald-300/30">
            <p className="text-xl font-black">{aprobadas.length}</p>
            <p className="text-xs text-emerald-100">Aprobadas</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700">Mis solicitudes de sala</h3>
        <div className="flex items-center gap-2">
          <button onClick={onBackToGeneral} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50" title="Volver a vista general">
            <ArrowLeft className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setShowSolicitud(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Solicitar sala
          </button>
        </div>
      </div>

      {/* Sin asignaciones */}
      {mis.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-16 text-center">
          <Info className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-600">Sin solicitudes registradas</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            Usa el botón "Solicitar sala" para enviar una solicitud al administrador.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Pendientes */}
          {pendientes.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" /> Esperando aprobación ({pendientes.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendientes.map((a, i) => <AsigCard key={i} a={a} />)}
              </div>
            </div>
          )}

          {/* Aprobadas */}
          {aprobadas.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Salas aprobadas ({aprobadas.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {aprobadas.map((a, i) => <AsigCard key={i} a={a} />)}
              </div>
            </div>
          )}

          {/* Rechazadas */}
          {rechazadas.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Rechazadas ({rechazadas.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rechazadas.map((a, i) => <AsigCard key={i} a={a} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showSolicitud && (
        <AsignacionFormModal
          initial={null}
          salas={salas}
          asignaciones={asignaciones}
          onSave={handleSolicitud}
          onClose={() => setShowSolicitud(false)}
          modoSolicitud
          coordinadorDefault={user.nombre}
          saving={saving}
        />
      )}
      {ticketTarget && (
        <TicketFormModal
          asignacion={ticketTarget}
          userName={user.nombre}
          onSave={handleCreateTicket}
          onClose={() => setTicketTarget(null)}
        />
      )}

    </div>
  );
}
