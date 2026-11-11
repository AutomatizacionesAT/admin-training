import { useEffect, useId, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { BiometricRow } from '../utils/types';

export type ObservacionesSelection =
  | { tipo: 'colaborador'; id: string; nombre: string; cc: string }
  | { tipo: 'observacion'; observacion: string };

interface ObservacionesModalProps {
  selection: ObservacionesSelection;
  data: BiometricRow[];
  onClose: () => void;
}

export default function ObservacionesModal({ selection, data, onClose }: ObservacionesModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const esColaborador = selection.tipo === 'colaborador';

  const colaboradores = useMemo(() => {
    const grouped = new Map<string, { colaborador: string; cc: string; cantidad: number }>();
    for (const row of data) {
      const id = row.cc || row.colaborador;
      const entry = grouped.get(id);
      if (entry) entry.cantidad++;
      else grouped.set(id, { colaborador: row.colaborador, cc: row.cc, cantidad: 1 });
    }
    return [...grouped.values()].sort((a, b) => b.cantidad - a.cantidad || a.colaborador.localeCompare(b.colaborador));
  }, [data]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        }
      }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-4xl overflow-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 backdrop:bg-slate-950/50"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5">
        <div>
          <h2 id={titleId} className="text-lg font-bold">
            {esColaborador ? `Observaciones de ${selection.nombre}` : selection.observacion}
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-slate-500">
            {esColaborador ? `CC: ${selection.cc || 'Sin CC'} · ` : ''}
            {data.length} {data.length === 1 ? 'registro con observación' : 'registros con observación'} según los filtros activos.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="overflow-x-auto p-5">
        <table className="w-full text-left text-sm">
          <thead className="bg-indigo-900 text-xs uppercase text-white">
            <tr>
              {(esColaborador
                ? ['Fecha', 'Semana', 'Ingreso', 'Salida', 'Observación']
                : ['Colaborador', 'CC', 'Cantidad']
              ).map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr><td colSpan={esColaborador ? 5 : 3} className="p-8 text-center text-slate-500">No hay observaciones con los filtros actuales.</td></tr>
            ) : esColaborador ? (
              data.map((row, index) => (
                <tr key={`${row.dateISO}-${row.ingreso}-${index}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">{row.dia || row.dateISO || '—'}</td>
                  <td className="px-4 py-3">{row.semana || '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{row.ingreso || '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{row.salida || '—'}</td>
                  <td className="px-4 py-3">{row.observacion}</td>
                </tr>
              ))
            ) : (
              colaboradores.map(row => (
                <tr key={row.cc || row.colaborador} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold">{row.colaborador}</td>
                  <td className="px-4 py-3 font-mono">{row.cc || '—'}</td>
                  <td className="px-4 py-3 font-bold text-indigo-700 tabular-nums">{row.cantidad}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </dialog>
  );
}
