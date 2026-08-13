/* =============================================================================
   TrainingDetailModal — versión decorada (azules fuertes / negros / naranjas)
   -----------------------------------------------------------------------------
   PEGA ESTE ARCHIVO COMPLETO SOBRE TU components/TrainingDetailModal.tsx
   La lógica NO cambió: mismas props (records, onClose), mismo `principal`,
   mismo `title`, mismo `count`, mismo `formatField`, mismo map de `records`.

   DÓNDE LLENAS LOS DATOS NUEVOS:
     -> data/campanas-info.ts   (ese es el "JSON": clave = nombre de campaña)
        Campos: estadoServidor | enlace | rutaCarpetas | imagen
        Ya tiene 2 ejemplos de uso base (LINDE y CLARO HOGAR).

   Orden de búsqueda: 1) el propio record  2) data/campanas-info.ts
   Si no hay match en ninguno -> "Sin coincidencia" (nada se rompe).
   ============================================================================= */

import { useState } from "react"
import {
  CalendarDays,
  X,
  BriefcaseBusiness,
  FileText,
  Building2,
  Clock3,
  ShieldUser,
  BadgeCheck,
  Server,
  ServerOff,
  ArrowLeftRight,
  Link2,
  FolderTree,
  ExternalLink,
  Layers,
  Hash,
} from "lucide-react"
import type { TrainingRecord } from "../utils/utils"
/* 👇 AQUÍ ESTÁ EL JSON QUE TÚ LLENAS -> data/campanas-info.ts */
import { getCampanaInfo, IMAGEN_POR_DEFECTO } from "./campanas-info"

interface TrainingDetailModalProps {
  records: TrainingRecord[]
  onClose: () => void
}

const SIN_DATO = "Sin coincidencia"

function formatField(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "—"
}

/* Lee cualquier campo (aunque todavía no exista en el tipo) sin romper nada */
function pick(record: unknown, ...keys: string[]): string {
  const source = (record ?? {}) as Record<string, unknown>
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return ""
}

/* ---- Estado de servidor: EN SERVIDOR / SIN SERVIDOR / EN MIGRACION -------- */
function serverStatus(raw: string) {
  const value = raw.toUpperCase()

  if (value.includes("MIGRA")) {
    return {
      label: "EN MIGRACION",
      icon: ArrowLeftRight,
      chip: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
      dot: "bg-orange-400",
      note: "Desarrollo moviéndose entre servidores",
    }
  }
  if (value.includes("SIN")) {
    return {
      label: "SIN SERVIDOR",
      icon: ServerOff,
      chip: "bg-slate-500/15 text-slate-300 ring-slate-400/30",
      dot: "bg-slate-400",
      note: "Aún no está publicado en servidor",
    }
  }
  if (value.includes("SERVIDOR") || value.includes("EN LINEA") || value.includes("ONLINE")) {
    return {
      label: "EN SERVIDOR",
      icon: Server,
      chip: "bg-green-500/10 text-green-300 ring-green-400/30",
      dot: "bg-green-400",
      note: "Publicado y disponible",
    }
  }
  return {
    label: SIN_DATO,
    icon: Server,
    chip: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
    dot: "bg-slate-500",
    note: "Sin información de servidor",
  }
}

/* ---- Color del estado del desarrollo (para los cards del desglose) -------- */
function estadoTone(raw: string) {
  const value = (raw || "").toUpperCase()
  if (value.includes("FINALIZ") || value.includes("ENTREG") || value.includes("COMPLET")) {
    return {
      card: "border-emerald-200 bg-emerald-50/60",
      chip: "bg-emerald-100 text-emerald-700 ring-emerald-200",
      bar: "bg-emerald-500",
    }
  }
  if (value.includes("PROCESO") || value.includes("CURSO") || value.includes("EJECU")) {
    return {
      card: "border-orange-200 bg-orange-50/60",
      chip: "bg-orange-100 text-orange-700 ring-orange-200",
      bar: "bg-orange-500",
    }
  }
  if (value.includes("PROYECT") || value.includes("PENDIENT") || value.includes("PLANEAD")) {
    return {
      card: "border-blue-200 bg-blue-50/60",
      chip: "bg-blue-100 text-blue-700 ring-blue-200",
      bar: "bg-blue-600",
    }
  }
  return {
    card: "border-slate-200 bg-slate-50/70",
    chip: "bg-slate-200 text-slate-700 ring-slate-300",
    bar: "bg-slate-400",
  }
}

export default function TrainingDetailModal({ records, onClose }: TrainingDetailModalProps) {
  if (!records.length) return null

  const principal = records[0]
  const title = principal.campana || principal.cliente || "Detalle de campaña"
  const count = records.length

  /* ---------------------------------------------------------------------------
     CAMPOS EXTRA: primero se busca en el registro (si algún día vienen en la
     data), y si no, en tu JSON `data/campanas-info.ts` usando el nombre de la
     campaña. Si no hay match en ninguno -> "Sin coincidencia".
     --------------------------------------------------------------------------- */
  const info = getCampanaInfo(title)

  const [copied, setCopied] = useState(false)

  const estadoSrv = serverStatus(
    pick(principal, "estadoServidor", "servidor", "estado_servidor") || info.estadoServidor || "",
  )
  const enlace = pick(principal, "enlace", "link", "url") || info.enlace || ""
  const rutaCarpetas = pick(principal, "rutaCarpetas", "ruta", "ruta_carpetas", "carpeta") || info.rutaCarpetas || ""
  const imagen = pick(principal, "imagen", "image", "thumbnail") || info.imagen || IMAGEN_POR_DEFECTO

  const handleCopyRuta = async () => {
    if (!rutaCarpetas) return

    try {
      await navigator.clipboard.writeText(rutaCarpetas)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_40px_80px_-20px_rgba(2,10,24,0.6)] ring-1 ring-slate-900/10">
        {/* ================================ CABECERA =========================== */}
        <div className="relative overflow-hidden bg-[#0b1a2f] px-5 py-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              color: "#7dd3fc",
              maskImage: "linear-gradient(to right, black, transparent 75%)",
              WebkitMaskImage: "linear-gradient(to right, black, transparent 75%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 bottom-[-70px] h-48 w-48 rounded-full bg-blue-500/25 blur-3xl"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/40 ring-1 ring-white/20">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="2xl:text-2xl text-xl font-black uppercase tracking-[0.18em] text-blue-300">
                    Detalle del desarrollo
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">              
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 ring-1 ring-inset ring-white/20 transition hover:bg-white/20 hover:text-white"
                aria-label="Cerrar detalle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================================ CUERPO ============================= */}
        <div className="max-h-[calc(92vh-76px)] overflow-y-auto bg-slate-50/70 p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            {/* ------------------------- IZQUIERDA: PRINCIPAL ------------------- */}
            <aside className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-2xl bg-[#0b1a2f] p-4 text-white ring-1 ring-slate-900/20">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.14]"
                  style={{
                    backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                    color: "#60a5fa",
                    maskImage: "linear-gradient(to bottom, black, transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-6 rounded-full bg-orange-500" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">Campaña</p>
                  </div>
                  <h3 className="mt-2 text-pretty text-2xl font-black leading-tight tracking-tight">{title}</h3>

                  <div className="mt-3 flex items-center gap-2 border-t border-white/20 pt-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-xs font-black text-white ring-1 ring-white">
                      <ShieldUser className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">Coordinador</p>
                      <p className="truncate text-sm font-bold">{formatField(principal.coordinador)}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/30">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">Desarrollador</p>
                      <p className="truncate text-sm font-bold">{formatField(principal.desarrollador)}</p>
                    </div>
                  </div>

                  {/* Estado en servidor */}
                  <div className={`mt-3 flex items-center gap-2 rounded-xl p-2.5 ring-1 ring-inset ${estadoSrv.chip}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${estadoSrv.dot}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider">{estadoSrv.label}</p>
                      <p className="truncate text-[11px] text-slate-400">{estadoSrv.note}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Imagen de la campaña */}
              <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                <img
                  src={imagen || "/placeholder.svg"}
                  alt={`Vista de la campaña ${title}`}
                  className="h-36 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Vista de la campaña
                  </p>
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-black text-blue-700 ring-1 ring-inset ring-blue-100">
                    {count} reg.
                  </span>
                </div>
              </div>

              {/* Enlace + Ruta de carpetas */}
              <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                <button
                  type="button"
                  onClick={() => {
                    if (!enlace) return
                    window.open(enlace, "_blank", "noopener,noreferrer")
                  }}
                  className="group flex min-h-[68px] flex-col items-center justify-center rounded-2xl ring-2 ring-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:ring-blue-300 hover:bg-blue-100 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  disabled={!enlace}
                  title={enlace || "Sin enlace disponible"}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 transition group-hover:bg-blue-200">
                    <Link2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="mt-1 text-[9px] font-black uppercase tracking-[0.14em]">Enlace</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyRuta}
                  className="flex min-h-[68px] items-center justify-between gap-2 rounded-2xl ring-2 ring-blue-200 bg-blue-50 p-3 text-left transition hover:ring-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  disabled={!rutaCarpetas}
                  title={rutaCarpetas || "Sin ruta disponible"}
                >
                  <div className="group flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-1 ring-blue-200 transition group-hover:bg-blue-200">
                      <FolderTree className="h-3.5 w-3.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                        Ruta carpetas
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] font-bold text-slate-700">
                        {rutaCarpetas || SIN_DATO}
                      </p>
                    </div>
                  </div>

                  {rutaCarpetas ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                      {copied ? "Copiado" : "Click"}
                    </span>
                  ) : null}
                </button>
              </div>
            </aside>

            {/* ------------------------- DERECHA: RESTO DE DATOS ---------------- */}
            <section className="flex flex-col gap-3">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-blue-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-blue-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em]">Estado</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatField(principal.estado)}</p>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-blue-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-blue-700">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em]">Registros</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{count} elementos</p>
                </div>
 

                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-blue-300 sm:col-span-2">
                  <div className="mb-1.5 flex items-center gap-1.5 text-blue-700">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em]">Cliente / Segmento</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatField(principal.cliente)} · {formatField(principal.segmento)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-orange-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-orange-600">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em]">Fecha inicio</span>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-slate-900">{formatField(principal.fechaInicio)}</p>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-orange-300">
                  <div className="mb-1.5 flex items-center gap-1.5 text-orange-600">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em]">Fecha fin</span>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-slate-900">{formatField(principal.fechaFin)}</p>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-1.5 text-blue-700">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em]">Información adicional</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border-l-2 border-blue-500 pl-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Fecha material</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
                        {formatField(principal.fechaMaterial)}
                      </p>
                    </div>
                    <div className="border-l-2 border-orange-500 pl-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Formador</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{formatField(principal.formador)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------- DESGLOSE DE REGISTROS ------------------- */}
              {records.length > 0 && (
                <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                  <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <Layers className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.16em]">Desglose de registros</span>
                    </div>
                    <span className="rounded-full bg-[#0b1a2f] px-2 py-0.5 text-[10px] font-black text-white">
                      {records.length}
                    </span>
                  </div>

                  <div className={`grid max-h-[320px] gap-2.5 overflow-y-auto pr-1 ${records.length > 0 && records.length < 2 ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
                    {records.map((record, index) => {
                      const tone = estadoTone(record.estado || "")
                      const srv = serverStatus(pick(record, "estadoServidor", "servidor", "estado_servidor"))

                      return (
                        <div
                          key={`${record.rowIndex ?? index}-${record.desarrollo ?? record.nombre ?? "sin-desarrollo"}`}
                          className={`relative overflow-hidden rounded-xl border p-3 pl-4 transition hover:shadow-md ${tone.card}`}
                        >
                          <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden="true" />

                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="text-pretty text-sm font-black leading-tight text-slate-900">
                              {record.desarrollo || record.nombre || "Sin desarrollo"}
                            </p>
                            <span className="shrink-0 rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-black text-slate-500 ring-1 ring-inset ring-slate-200">
                              #{index + 1}
                            </span>
                          </div>

                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ring-1 ring-inset ${tone.chip}`}
                            >
                              {record.estado || "Sin estado"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600 ring-1 ring-inset ring-slate-200">
                              <srv.icon className="h-2.5 w-2.5" />
                              {srv.label}
                            </span>
                          </div>

                          <div className="grid gap-1 text-[11px] text-slate-600">
                            <p className="flex items-center justify-between gap-2 border-b border-slate-900/5 pb-1">
                              <span className="font-black uppercase tracking-[0.1em] text-slate-500">Inicio</span>
                              <span className="font-bold tabular-nums text-slate-800">
                                {formatField(record.fechaInicio)}
                              </span>
                            </p>
                            <p className="flex items-center justify-between gap-2 border-b border-slate-900/5 pb-1">
                              <span className="font-black uppercase tracking-[0.1em] text-slate-500">Fin</span>
                              <span className="font-bold tabular-nums text-slate-800">
                                {formatField(record.fechaFin)}
                              </span>
                            </p>
                            <p className="pt-0.5">
                              <span className="font-black uppercase tracking-[0.1em] text-slate-500">Observaciones</span>
                              <br />
                              <span className="font-medium text-slate-700">{formatField(record.observaciones)}</span>
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
