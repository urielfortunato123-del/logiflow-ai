import { StatusChip } from "@/components/StatusChip";
import { mockConferences, getAgencyName } from "@/data/mockData";
import { FileCheck, AlertTriangle, Upload, Plus } from "lucide-react";

export default function Conference() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <StatusChip status="ok" />
            <span className="text-sm font-bold text-foreground">{mockConferences.filter(c => !c.is_divergent).length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <StatusChip status="divergent" />
            <span className="text-sm font-bold text-foreground">{mockConferences.filter(c => c.is_divergent).length}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors">
            <Upload className="h-4 w-4" /> Import OCR
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Nova Conferência
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {mockConferences.map(conf => (
          <div key={conf.id} className={`glass-card rounded-lg p-5 animate-fade-in-up ${conf.is_divergent ? "border-critical/30" : ""}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <FileCheck className={`h-5 w-5 ${conf.is_divergent ? "text-critical" : "text-success"}`} />
                  <span className="font-semibold text-foreground">{getAgencyName(conf.agency_id)}</span>
                  <StatusChip status={conf.is_divergent ? "divergent" : "ok"} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Sacas</span>
                    <span className="font-bold text-foreground">{conf.qty_sacks}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Cotas</span>
                    <span className="font-bold text-foreground">{conf.qty_cotas}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Sistema A</span>
                    <span className="font-bold text-foreground">{conf.orders_sys_a}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Sistema B</span>
                    <span className={`font-bold ${conf.is_divergent ? "text-critical" : "text-foreground"}`}>{conf.orders_sys_b}</span>
                  </div>
                </div>
              </div>

              {conf.is_divergent && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-critical/5 border border-critical/20 max-w-sm">
                  <AlertTriangle className="h-4 w-4 text-critical mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Divergência Detectada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{conf.divergence_reason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
