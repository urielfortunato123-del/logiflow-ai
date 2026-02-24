import { MetricCard } from "@/components/MetricCard";
import { StatusChip } from "@/components/StatusChip";
import { mockGateOrders, mockRoutes, mockConferences, mockKPIs, mockIncidents, getDriverName } from "@/data/mockData";
import { Truck, Container, AlertTriangle, MapPin, GraduationCap, Package, Plus, FileCheck, Upload, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const inQueue = mockGateOrders.filter(o => o.status === "waiting" || o.status === "released").length;
  const loadingNow = mockGateOrders.filter(o => o.status === "loading" || o.status === "at_dock").length;
  const divergences = mockConferences.filter(c => c.is_divergent).length;
  const routesAtRisk = mockRoutes.filter(r => {
    if (r.status !== "in_progress" || !r.actual_stops) return false;
    const progress = r.actual_stops / r.planned_stops;
    const timeProgress = (r.actual_minutes ?? 0) / r.planned_minutes;
    return timeProgress > progress + 0.15;
  }).length;
  const pendingTrainings = mockKPIs.filter(k => k.kpi_type === "training").length;

  const quickActions = [
    { label: "Nova Ordem", icon: Plus, path: "/gate-queue", color: "gradient-primary" },
    { label: "Conferência", icon: FileCheck, path: "/conference", color: "gradient-warning" },
    { label: "Fechamento", icon: FileText, path: "/closing", color: "gradient-success" },
    { label: "Upload OCR", icon: Upload, path: "/ocr", color: "gradient-danger" },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Na Fila" value={inQueue} icon={Truck} variant="warning" trend="down" trendValue="2" />
        <MetricCard title="Carregando" value={loadingNow} icon={Container} variant="info" trend="up" trendValue="1" />
        <MetricCard title="Divergências" value={divergences} icon={AlertTriangle} variant={divergences > 0 ? "critical" : "success"} />
        <MetricCard title="Rotas em Risco" value={routesAtRisk} icon={MapPin} variant={routesAtRisk > 0 ? "warning" : "success"} />
        <MetricCard title="Treinamentos" value={pendingTrainings} subtitle="pendentes" icon={GraduationCap} variant={pendingTrainings > 0 ? "warning" : "success"} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map(action => (
          <Link key={action.label} to={action.path} className={`${action.color} rounded-lg p-4 flex items-center gap-3 hover:opacity-90 transition-opacity`}>
            <action.icon className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-sm text-foreground">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gate Queue Preview */}
        <div className="glass-card rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Fila do Pátio</h3>
            <Link to="/gate-queue" className="text-xs text-primary hover:underline">Ver tudo →</Link>
          </div>
          <div className="divide-y divide-border">
            {mockGateOrders.slice(0, 4).map(order => (
              <div key={order.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm font-bold text-foreground">{order.plate}</div>
                  <span className="text-xs text-muted-foreground">{getDriverName(order.driver_id)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {order.dock && <span className="text-xs font-mono text-muted-foreground">{order.dock}</span>}
                  <StatusChip status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="glass-card rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Alertas do Dia</h3>
          </div>
          <div className="p-4 space-y-3">
            {divergences > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-critical/5 border border-critical/20">
                <AlertTriangle className="h-4 w-4 text-critical mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{divergences} divergência(s) encontrada(s)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Conferência pendente de resolução</p>
                </div>
              </div>
            )}
            {mockIncidents.map(inc => (
              <div key={inc.id} className="flex items-start gap-3 p-3 rounded-md bg-warning/5 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{inc.incident_type === "fire_drill" ? "Simulado de incêndio" : "Caminhão atrasado"} — {inc.duration_min}min</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{inc.notes}</p>
                </div>
              </div>
            ))}
            {pendingTrainings > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-warning/5 border border-warning/20">
                <GraduationCap className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{pendingTrainings} motorista(s) com treinamento pendente</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Verificar com transportadoras</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Routes Summary */}
      <div className="glass-card rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Rotas de Hoje</h3>
          <Link to="/routes" className="text-xs text-primary hover:underline">Ver tudo →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Rota</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Paradas</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tempo</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockRoutes.map(route => (
                <tr key={route.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">{route.route_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{route.actual_stops ?? "—"} / {route.planned_stops}</td>
                  <td className="px-4 py-3 text-muted-foreground">{route.actual_minutes ?? "—"} / {route.planned_minutes} min</td>
                  <td className="px-4 py-3"><StatusChip status={route.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
