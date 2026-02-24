import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend } from "recharts";
import { Route, GateOrder, KPI, Conference } from "@/types/domain";
import { getAgencyName } from "@/data/mockData";

const COLORS = {
  primary: "hsl(210 100% 56%)",
  success: "hsl(152 60% 45%)",
  warning: "hsl(38 92% 55%)",
  critical: "hsl(0 72% 55%)",
  info: "hsl(210 100% 56%)",
  muted: "hsl(215 12% 55%)",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(220 18% 13%)",
    border: "1px solid hsl(220 14% 20%)",
    borderRadius: "0.5rem",
    fontSize: "0.75rem",
    color: "hsl(210 20% 92%)",
  },
  itemStyle: { color: "hsl(210 20% 92%)" },
};

interface Props {
  routes: Route[];
  gateOrders: GateOrder[];
  kpis: KPI[];
  conferences: Conference[];
}

export function RouteProgressChart({ routes }: { routes: Route[] }) {
  const data = routes.map(r => ({
    name: r.route_code,
    planejadas: r.planned_stops,
    realizadas: r.actual_stops ?? 0,
    progresso: r.actual_stops ? Math.round((r.actual_stops / r.planned_stops) * 100) : 0,
  }));

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold text-sm text-foreground mb-4">Progresso das Rotas</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215 12% 55%)" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(215 12% 55%)" }} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="planejadas" fill={COLORS.muted} radius={[4, 4, 0, 0]} name="Planejadas" />
          <Bar dataKey="realizadas" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Realizadas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GateStatusChart({ gateOrders }: { gateOrders: GateOrder[] }) {
  const statusMap: Record<string, { label: string; color: string }> = {
    waiting: { label: "Aguardando", color: COLORS.warning },
    released: { label: "Liberado", color: COLORS.info },
    at_dock: { label: "Na Doca", color: COLORS.primary },
    loading: { label: "Carregando", color: COLORS.success },
    finished: { label: "Finalizado", color: COLORS.muted },
  };

  const data = Object.entries(statusMap).map(([key, { label, color }]) => ({
    name: label,
    value: gateOrders.filter(o => o.status === key).length,
    color,
  })).filter(d => d.value > 0);

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold text-sm text-foreground mb-4">Status do Pátio</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KPIBreakdownChart({ kpis }: { kpis: KPI[] }) {
  const typeMap: Record<string, { label: string; color: string }> = {
    performance: { label: "Performance", color: COLORS.primary },
    safety: { label: "Segurança", color: COLORS.critical },
    telematics: { label: "Telemetria", color: COLORS.warning },
    training: { label: "Treinamento", color: COLORS.success },
  };

  const data = Object.entries(typeMap).map(([key, { label, color }]) => {
    const items = kpis.filter(k => k.kpi_type === key);
    return {
      name: label,
      quantidade: items.length,
      valor_medio: items.length > 0 ? Math.round(items.reduce((s, k) => s + k.metric_value, 0) / items.length * 10) / 10 : 0,
      fill: color,
    };
  });

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold text-sm text-foreground mb-4">KPIs por Categoria</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
          <RadialBar
            dataKey="quantidade"
            cornerRadius={6}
            label={{ position: "insideStart", fill: "hsl(210 20% 92%)", fontSize: 11 }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: "hsl(215 12% 55%)" }} />
          <Tooltip {...tooltipStyle} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyTrendChart() {
  // Simulated weekly trend data
  const data = [
    { dia: "Seg", entregas: 1180, divergencias: 3, incidentes: 1 },
    { dia: "Ter", entregas: 1250, divergencias: 1, incidentes: 0 },
    { dia: "Qua", entregas: 1320, divergencias: 2, incidentes: 1 },
    { dia: "Qui", entregas: 1100, divergencias: 4, incidentes: 2 },
    { dia: "Sex", entregas: 1245, divergencias: 1, incidentes: 2 },
  ];

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold text-sm text-foreground mb-4">Tendência Semanal — Entregas</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradEntregas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
          <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "hsl(215 12% 55%)" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(215 12% 55%)" }} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="entregas" stroke={COLORS.primary} fill="url(#gradEntregas)" strokeWidth={2} name="Entregas" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConferenceAccuracyChart({ conferences }: { conferences: Conference[] }) {
  const data = conferences.map(c => ({
    name: getAgencyName(c.agency_id),
    sysA: c.orders_sys_a,
    sysB: c.orders_sys_b,
    divergente: c.is_divergent ? "Sim" : "Não",
  }));

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold text-sm text-foreground mb-4">Conferência — SysA vs SysB</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(215 12% 55%)" }} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="sysA" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Sistema A" />
          <Bar dataKey="sysB" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Sistema B" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
