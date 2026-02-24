import { StatusChip } from "@/components/StatusChip";
import { mockRoutes, getAgencyName } from "@/data/mockData";
import { MapPin, Clock, TrendingUp, Sparkles, FileText } from "lucide-react";

export default function Routes() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {(["planned", "in_progress", "done"] as const).map(s => {
          const count = mockRoutes.filter(r => r.status === s).length;
          return (
            <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
              <StatusChip status={s} />
              <span className="text-sm font-bold text-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockRoutes.map(route => {
          const stopsProgress = route.actual_stops != null ? (route.actual_stops / route.planned_stops) * 100 : 0;
          const timeProgress = route.actual_minutes != null ? (route.actual_minutes / route.planned_minutes) * 100 : 0;
          const isOverTime = timeProgress > stopsProgress + 15;

          return (
            <div key={route.id} className="glass-card rounded-lg p-5 animate-fade-in-up space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-lg font-bold text-foreground">{route.route_code}</div>
                  <div className="text-xs text-muted-foreground">{getAgencyName(route.agency_id)}</div>
                </div>
                <StatusChip status={route.status} />
              </div>

              {/* Progress bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Paradas</span>
                    <span>{route.actual_stops ?? 0} / {route.planned_stops}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stopsProgress}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Tempo</span>
                    <span className={isOverTime ? "text-warning font-semibold" : ""}>{route.actual_minutes ?? 0} / {route.planned_minutes} min</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isOverTime ? "bg-warning" : "bg-info"}`} style={{ width: `${Math.min(timeProgress, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> {route.planned_distance_km} km planejados
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors">
                  <Sparkles className="h-3 w-3 text-primary" /> Analisar com IA
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors">
                  <FileText className="h-3 w-3" /> Prep. Reunião
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
