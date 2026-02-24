import { StatusChip } from "@/components/StatusChip";
import { mockGateOrders, getDriverName } from "@/data/mockData";
import { GateOrder } from "@/types/domain";
import { Container } from "lucide-react";

const docks = ["D1", "D2", "D3", "D4", "D5", "D6"];

export default function DockBoard() {
  const ordersByDock = docks.map(dock => ({
    dock,
    orders: mockGateOrders.filter(o => o.dock === dock),
  }));

  const unassigned = mockGateOrders.filter(o => !o.dock || !docks.includes(o.dock));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {ordersByDock.map(({ dock, orders }) => (
          <div key={dock} className="glass-card rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-accent/30">
              <div className="flex items-center gap-2">
                <Container className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground">{dock}</span>
              </div>
            </div>
            <div className="p-2 min-h-[120px]">
              {orders.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">Livre</div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="p-2 rounded-md bg-secondary/50 mb-2">
                    <div className="font-mono text-sm font-bold text-foreground">{order.plate}</div>
                    <div className="text-xs text-muted-foreground truncate">{getDriverName(order.driver_id)}</div>
                    <div className="mt-1.5"><StatusChip status={order.status} /></div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {unassigned.length > 0 && (
        <div className="glass-card rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Sem Doca Atribuída ({unassigned.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {unassigned.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-foreground">{order.plate}</span>
                  <span className="text-xs text-muted-foreground">{getDriverName(order.driver_id)}</span>
                </div>
                <StatusChip status={order.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
