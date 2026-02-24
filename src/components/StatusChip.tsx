import { cn } from "@/lib/utils";
import { GateOrderStatus, RouteStatus, KPIType, IncidentType } from "@/types/domain";

interface StatusChipProps {
  status: GateOrderStatus | RouteStatus | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  waiting: "bg-status-waiting/20 text-status-waiting border border-status-waiting/30",
  released: "bg-status-released/20 text-status-released border border-status-released/30",
  at_dock: "bg-status-at-dock/20 text-status-at-dock border border-status-at-dock/30",
  loading: "bg-status-loading/20 text-status-loading border border-status-loading/30",
  finished: "bg-status-finished/20 text-status-finished border border-status-finished/30",
  planned: "bg-info/20 text-info border border-info/30",
  in_progress: "bg-warning/20 text-warning border border-warning/30",
  done: "bg-success/20 text-success border border-success/30",
  divergent: "bg-critical/20 text-critical border border-critical/30",
  ok: "bg-success/20 text-success border border-success/30",
  pending: "bg-warning/20 text-warning border border-warning/30",
};

const statusLabels: Record<string, string> = {
  waiting: "Aguardando",
  released: "Liberado",
  at_dock: "Na Doca",
  loading: "Carregando",
  finished: "Finalizado",
  planned: "Planejada",
  in_progress: "Em Andamento",
  done: "Concluída",
  divergent: "Divergente",
  ok: "OK",
  pending: "Pendente",
  fire_drill: "Simulado",
  late_truck: "Atraso",
  system_outage: "Sistema",
  other: "Outro",
};

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <span className={cn("status-chip", statusStyles[status] ?? "bg-muted text-muted-foreground", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-status-waiting": status === "waiting",
        "bg-status-released": status === "released",
        "bg-status-at-dock": status === "at_dock",
        "bg-status-loading": status === "loading",
        "bg-status-finished": status === "finished",
        "bg-info": status === "planned",
        "bg-warning": status === "in_progress" || status === "pending",
        "bg-success": status === "done" || status === "ok",
        "bg-critical": status === "divergent",
      })} />
      {statusLabels[status] ?? status}
    </span>
  );
}
