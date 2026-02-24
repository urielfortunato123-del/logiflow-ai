import { StatusChip } from "@/components/StatusChip";
import { mockIncidents } from "@/data/mockData";
import { AlertTriangle, Plus, Clock, Zap } from "lucide-react";

const typeLabels: Record<string, string> = {
  fire_drill: "Simulado Incêndio",
  late_truck: "Caminhão Atrasado",
  system_outage: "Queda de Sistema",
  other: "Outro",
};

const typeIcons: Record<string, typeof AlertTriangle> = {
  fire_drill: Zap,
  late_truck: Clock,
  system_outage: AlertTriangle,
  other: AlertTriangle,
};

export default function Incidents() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mockIncidents.length} incidente(s) hoje</p>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Registrar
        </button>
      </div>

      <div className="space-y-3">
        {mockIncidents.map(inc => {
          const Icon = typeIcons[inc.incident_type] ?? AlertTriangle;
          return (
            <div key={inc.id} className="glass-card rounded-lg p-5 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-warning/10">
                  <Icon className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{typeLabels[inc.incident_type]}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{inc.duration_min} min</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{inc.impact}</p>
                  {inc.notes && <p className="text-xs text-muted-foreground italic">{inc.notes}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
