import { useState, useEffect, useCallback } from "react";
import { StatusChip } from "@/components/StatusChip";
import { mockGateOrders, getDriverName } from "@/data/mockData";
import { GateOrder } from "@/types/domain";
import { getStore, setStore, STORE_KEYS } from "@/lib/localStorage";
import { Container, Play, Square, Timer } from "lucide-react";
import { toast } from "sonner";

const docks = ["D1", "D2", "D3", "D4", "D5", "D6"];
const TIMERS_KEY = "logiops_dock_timers";

interface DockTimer {
  dock: string;
  orderId: string;
  startedAt: number; // timestamp ms
  stoppedAt: number | null;
}

function getTimers(): DockTimer[] {
  try {
    const raw = localStorage.getItem(TIMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveTimers(timers: DockTimer[]) {
  localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DockBoard() {
  const orders = getStore<GateOrder>(STORE_KEYS.GATE_ORDERS, mockGateOrders);
  const [timers, setTimers] = useState<DockTimer[]>(getTimers);
  const [now, setNow] = useState(Date.now());

  // Tick every second if any timer is running
  const hasRunning = timers.some(t => !t.stoppedAt);
  useEffect(() => {
    if (!hasRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasRunning]);

  const startTimer = useCallback((dock: string, orderId: string) => {
    const updated = [...timers.filter(t => t.dock !== dock), { dock, orderId, startedAt: Date.now(), stoppedAt: null }];
    saveTimers(updated);
    setTimers(updated);
    toast.success(`Cronômetro iniciado — Doca ${dock}`);
  }, [timers]);

  const stopTimer = useCallback((dock: string) => {
    const updated = timers.map(t => t.dock === dock && !t.stoppedAt ? { ...t, stoppedAt: Date.now() } : t);
    saveTimers(updated);
    setTimers(updated);
    toast.success(`Cronômetro parado — Doca ${dock}`);
  }, [timers]);

  const getTimer = (dock: string) => timers.find(t => t.dock === dock);

  const getElapsed = (timer: DockTimer) => {
    const end = timer.stoppedAt || now;
    return end - timer.startedAt;
  };

  const ordersByDock = docks.map(dock => ({ dock, orders: orders.filter(o => o.dock === dock) }));
  const unassigned = orders.filter(o => !o.dock || !docks.includes(o.dock));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {ordersByDock.map(({ dock, orders: dockOrders }) => {
          const timer = getTimer(dock);
          const isRunning = timer && !timer.stoppedAt;
          const elapsed = timer ? getElapsed(timer) : 0;
          const firstOrder = dockOrders[0];

          return (
            <div key={dock} className="glass-card rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-border bg-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Container className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">{dock}</span>
                  </div>
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Timer display */}
              <div className="px-3 py-2 border-b border-border bg-card">
                <div className={`font-mono text-lg font-bold text-center ${isRunning ? "text-primary animate-pulse" : timer?.stoppedAt ? "text-success" : "text-muted-foreground"}`}>
                  {timer ? formatElapsed(elapsed) : "00:00:00"}
                </div>
                <div className="flex justify-center mt-1.5 gap-1.5">
                  {!isRunning && firstOrder && (
                    <button
                      onClick={() => startTimer(dock, firstOrder.id)}
                      className="flex items-center gap-1 px-3 py-1 rounded-md gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Play className="h-3 w-3" /> Start
                    </button>
                  )}
                  {isRunning && (
                    <button
                      onClick={() => stopTimer(dock)}
                      className="flex items-center gap-1 px-3 py-1 rounded-md bg-critical/20 text-critical border border-critical/30 text-xs font-semibold hover:bg-critical/30 transition-colors"
                    >
                      <Square className="h-3 w-3" /> Stop
                    </button>
                  )}
                  {!firstOrder && !timer && (
                    <span className="text-xs text-muted-foreground">Sem veículo</span>
                  )}
                </div>
              </div>

              <div className="p-2 min-h-[80px]">
                {dockOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">Livre</div>
                ) : dockOrders.map(order => (
                  <div key={order.id} className="p-2 rounded-md bg-secondary/50 mb-2">
                    <div className="font-mono text-sm font-bold text-foreground">{order.plate}</div>
                    <div className="text-xs text-muted-foreground truncate">{getDriverName(order.driver_id)}</div>
                    <div className="mt-1.5"><StatusChip status={order.status} /></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <div className="glass-card rounded-lg">
          <div className="px-4 py-3 border-b border-border"><h3 className="font-semibold text-sm text-foreground">Sem Doca Atribuída ({unassigned.length})</h3></div>
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
