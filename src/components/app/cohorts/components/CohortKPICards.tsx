import React from "react";
import type { CohortKPIs } from "../hooks/useCohortData";
import {
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpenCheck,
} from "lucide-react";

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

interface Props {
  kpis: CohortKPIs;
  loading?: boolean;
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  bg,
  iconColor,
  valueColor = "#1B365D",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  bg: string;
  iconColor: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold tracking-tight tabular-nums leading-none" style={{ color: valueColor }}>
          {value}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

interface SemaforoItem {
  label: string;
  count: number;
  pct: number;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export default function CohortKPICards({ kpis, loading }: Props) {
  // Semáforo inline
  const total = kpis.verde + kpis.amarillo + kpis.rojo;
  const pV = total > 0 ? Math.round((kpis.verde / total) * 100) : 0;
  const pA = total > 0 ? Math.round((kpis.amarillo / total) * 100) : 0;
  const pR = total > 0 ? 100 - pV - pA : 0;

  const items: SemaforoItem[] = [
    { label: "≥90%",    count: kpis.verde,    pct: pV, color: "#16a34a", bg: "#dcfce7", icon: CheckCircle2 },
    { label: "70–89%",  count: kpis.amarillo, pct: pA, color: "#d97706", bg: "#fef3c7", icon: AlertTriangle },
    { label: "<70%",    count: kpis.rojo,     pct: pR, color: "#dc2626", bg: "#fee2e2", icon: XCircle },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* 4 KPI cards */}
      <KPICard
        icon={BookOpenCheck as LucideIcon}
        label="Cohortes activas"
        value={kpis.totalCohortes.toLocaleString("es-CO")}
        bg="#e8edf5"
        iconColor="#1B365D"
      />
      <KPICard
        icon={Users as LucideIcon}
        label="Personas en proceso"
        value={kpis.totalPersonas.toLocaleString("es-CO")}
        bg="#fff0e8"
        iconColor="#F37021"
        valueColor="#c45a10"
      />
      <KPICard
        icon={TrendingUp as LucideIcon}
        label="Promedio cierre"
        value={kpis.promedioCierre !== null ? `${kpis.promedioCierre}%` : "—"}
        bg="#eef2ff"
        iconColor="#6366f1"
        valueColor="#4338ca"
      />
      <KPICard
        icon={CheckCircle2 as LucideIcon}
        label="Personas ≥ 70%"
        value={`${kpis.pctCumplimiento70}%`}
        sub={`${kpis.totalPersonas} evaluadas`}
        bg="#dcfce7"
        iconColor="#16a34a"
        valueColor="#15803d"
      />

      {/* Semáforo compacto — 5ta columna */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col justify-between col-span-2 lg:col-span-1">
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-gray-400 font-medium">Distribución cierre</span>
        </div>
        {/* Barra */}
        <div className="flex rounded-full overflow-hidden h-2 bg-gray-100 mb-2">
          {pV > 0 && <div style={{ width: `${pV}%`, background: "#22c55e" }} />}
          {pA > 0 && <div style={{ width: `${pA}%`, background: "#f59e0b" }} />}
          {pR > 0 && <div style={{ width: `${pR}%`, background: "#ef4444" }} />}
        </div>
        {/* Items en fila */}
        <div className="flex gap-2">
          {items.map(({ label, count, pct, color, bg, icon: ItemIcon }) => (
            <div
              key={label}
              className="flex-1 flex items-center gap-1 px-1.5 py-1 rounded-lg"
              style={{ background: bg }}
            >
              <ItemIcon className="w-3 h-3 shrink-0" style={{ color }} />
              <div className="min-w-0">
                <span className="text-xs font-bold tabular-nums leading-none block" style={{ color }}>
                  {pct}%
                </span>
                <span className="text-[9px] text-gray-500 leading-none">{count}p</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
