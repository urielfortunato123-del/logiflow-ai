import { useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { mockGateOrders, mockDrivers, getDriverName } from "@/data/mockData";
import { GateOrder, GateOrderStatus } from "@/types/domain";
import { Plus, Search, Printer, ArrowRight } from "lucide-react";

const statusFlow: GateOrderStatus[] = ["waiting", "released", "at_dock", "loading", "finished"];

function nextStatus(current: GateOrderStatus): GateOrderStatus | null {
  const idx = statusFlow.indexOf(current);
  return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
}

const nextLabel: Record<string, string> = {
  waiting: "Liberar",
  released: "Entrar Doca",
  at_dock: "Iniciar Carga",
  loading: "Finalizar",
};

export default function GateQueue() {
  const [orders, setOrders] = useState<GateOrder[]>(mockGateOrders);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = orders.filter(o =>
    o.plate.toLowerCase().includes(search.toLowerCase()) ||
    getDriverName(o.driver_id).toLowerCase().includes(search.toLowerCase())
  );

  const advanceStatus = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = nextStatus(o.status);
      if (!next) return o;
      const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return {
        ...o,
        status: next,
        ...(next === "released" && { released_at: now }),
        ...(next === "at_dock" && { dock_in_at: now }),
        ...(next === "loading" && { loading_start_at: now }),
        ...(next === "finished" && { loading_end_at: now }),
      };
    }));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar placa ou motorista..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg ops-input text-sm border"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors">
            <Printer className="h-4 w-4" /> Lista
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nova Ordem
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {statusFlow.map(s => {
          const count = orders.filter(o => o.status === s).length;
          return (
            <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
              <StatusChip status={s} />
              <span className="text-sm font-bold text-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Orders */}
      <div className="space-y-2">
        {filtered.map(order => (
          <div key={order.id} className="glass-card rounded-lg p-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-foreground">{order.plate}</div>
                  <div className="text-xs text-muted-foreground">Lista {order.list_number}</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <div className="text-sm font-medium text-foreground">{getDriverName(order.driver_id)}</div>
                  <div className="text-xs text-muted-foreground">{order.dock ? `Doca ${order.dock}` : "Sem doca"}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Timeline */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  {order.released_at && <span>Lib {order.released_at}</span>}
                  {order.dock_in_at && <span>→ Doca {order.dock_in_at}</span>}
                  {order.loading_start_at && <span>→ Carga {order.loading_start_at}</span>}
                  {order.loading_end_at && <span>→ Fim {order.loading_end_at}</span>}
                </div>

                <StatusChip status={order.status} />

                {order.status !== "finished" && (
                  <button
                    onClick={() => advanceStatus(order.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {nextLabel[order.status]} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
