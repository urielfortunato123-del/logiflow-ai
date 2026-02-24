import { MetricCard } from "@/components/MetricCard";
import { StatusChip } from "@/components/StatusChip";
import { mockKPIs, mockDrivers, getDriverName } from "@/data/mockData";
import { BarChart3, Shield, Gauge, GraduationCap, Plus, Upload } from "lucide-react";

const kpiIcons = { training: GraduationCap, safety: Shield, telematics: Gauge, performance: BarChart3 };
const kpiLabels = { training: "Treinamento", safety: "Segurança", telematics: "Telemática", performance: "Performance" };

export default function KPIs() {
  const byType = {
    training: mockKPIs.filter(k => k.kpi_type === "training"),
    safety: mockKPIs.filter(k => k.kpi_type === "safety"),
    telematics: mockKPIs.filter(k => k.kpi_type === "telematics"),
    performance: mockKPIs.filter(k => k.kpi_type === "performance"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(byType) as Array<keyof typeof byType>).map(type => {
            const Icon = kpiIcons[type];
            return (
              <MetricCard key={type} title={kpiLabels[type]} value={byType[type].length} icon={Icon} variant={type === "safety" ? "critical" : type === "training" ? "warning" : "info"} />
            );
          })}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors">
            <Upload className="h-4 w-4" /> Importar CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Novo KPI
          </button>
        </div>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Métrica</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Motorista</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Transportadora</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Fonte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockKPIs.map(kpi => {
                const Icon = kpiIcons[kpi.kpi_type];
                return (
                  <tr key={kpi.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{kpiLabels[kpi.kpi_type]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">{kpi.metric_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getDriverName(kpi.driver_id)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{kpi.carrier_name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{kpi.metric_value} <span className="text-muted-foreground font-normal">{kpi.unit}</span></td>
                    <td className="px-4 py-3"><StatusChip status={kpi.source === "manual" ? "ok" : kpi.source === "import" ? "planned" : "pending"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
