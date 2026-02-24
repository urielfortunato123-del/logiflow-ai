import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "critical" | "info";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  success: "border-success/30",
  warning: "border-warning/30",
  critical: "border-critical/30",
  info: "border-info/30",
};

const iconBgStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-critical/10 text-critical",
  info: "bg-info/10 text-info",
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue, variant = "default", className }: MetricCardProps) {
  return (
    <div className={cn("glass-card rounded-lg p-5 animate-fade-in-up", variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", iconBgStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn("font-semibold", {
            "text-success": trend === "up",
            "text-critical": trend === "down",
            "text-muted-foreground": trend === "neutral",
          })}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </span>
          <span className="text-muted-foreground">vs ontem</span>
        </div>
      )}
    </div>
  );
}
