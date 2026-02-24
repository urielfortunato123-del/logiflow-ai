import { useState, useEffect, useCallback } from "react";
import { StatusChip } from "@/components/StatusChip";
import { mockGateOrders, getDriverName } from "@/data/mockData";
import { GateOrder } from "@/types/domain";
import { getStore, setStore, STORE_KEYS } from "@/lib/localStorage";
import { Container, Play, Square, Timer, History, AlertTriangle, GripVertical } from "lucide-react";
import { toast } from "sonner";

const docks = ["D1", "D2", "D3", "D4", "D5", "D6"];
const TIMERS_KEY = "logiops_dock_timers";
const HISTORY_KEY = "logiops_dock_history";
const ALERT_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

interface DockTimer {
  dock: string;
  orderId: string;
  startedAt: number;
  stoppedAt: number | null;
}

export interface DockHistoryEntry {
  id: string;
  dock: string;
  orderId: string;
  plate: string;
  driverName: string;
  startedAt: number;
  stoppedAt: number;
  durationMs: number;
  date: string;
}

function getTimers(): DockTimer[] {
  try { return JSON.parse(localStorage.getItem(TIMERS_KEY) || "[]"); } catch { return []; }
}
function saveTimers(timers: DockTimer[]) {
  localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
}

export function getDockHistory(): DockHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveDockHistory(history: DockHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DockBoard() {
  const [allOrders, setAllOrders] = useState<GateOrder[]>(() => getStore(STORE_KEYS.GATE_ORDERS, mockGateOrders));
  const [timers, setTimers] = useState<DockTimer[]>(getTimers);
  const [now, setNow] = useState(Date.now());
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<DockHistoryEntry[]>(getDockHistory);
  const [dragOrderId, setDragOrderId] = useState<string | null>(null);

  const hasRunning = timers.some(t => !t.stoppedAt);
  useEffect(() => {
    if (!hasRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasRunning]);

  const getOrderPlate = (orderId: string) => allOrders.find(o => o.id === orderId)?.plate ?? "—";
  const getOrderDriverName = (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    return order ? getDriverName(order.driver_id) : "—";
  };

  const startTimer = useCallback((dock: string, orderId: string) => {
    const updated = [...timers.filter(t => t.dock !== dock), { dock, orderId, startedAt: Date.now(), stoppedAt: null }];
    saveTimers(updated);
    setTimers(updated);
    toast.success(`Cronômetro iniciado — Doca ${dock}`);
  }, [timers]);

  const stopTimer = useCallback((dock: string) => {
    const stoppedNow = Date.now();
    const timer = timers.find(t => t.dock === dock && !t.stoppedAt);
    const updated = timers.map(t => t.dock === dock && !t.stoppedAt ? { ...t, stoppedAt: stoppedNow } : t);
    saveTimers(updated);
    setTimers(updated);

    // Save to history
    if (timer) {
      const entry: DockHistoryEntry = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        dock,
        orderId: timer.orderId,
        plate: getOrderPlate(timer.orderId),
        driverName: getOrderDriverName(timer.orderId),
        startedAt: timer.startedAt,
        stoppedAt: stoppedNow,
        durationMs: stoppedNow - timer.startedAt,
        date: new Date().toISOString().split("T")[0],
      };
      const newHistory = [entry, ...history];
      saveDockHistory(newHistory);
      setHistory(newHistory);
    }
    toast.success(`Cronômetro parado — Doca ${dock}`);
  }, [timers, history, allOrders]);

  const getTimer = (dock: string) => timers.find(t => t.dock === dock);
  const getElapsed = (timer: DockTimer) => (timer.stoppedAt || now) - timer.startedAt;

  // Drag & drop handlers
  const handleDragStart = (orderId: string) => setDragOrderId(orderId);
  const handleDragEnd = () => setDragOrderId(null);
  const handleDrop = (dock: string) => {
    if (!dragOrderId) return;
    const updated = allOrders.map(o => o.id === dragOrderId ? { ...o, dock } : o);
    setStore(STORE_KEYS.GATE_ORDERS, updated);
    setAllOrders(updated);
    setDragOrderId(null);
    toast.success(`Veículo movido para Doca ${dock}`);
  };

  const ordersByDock = docks.map(dock => ({ dock, orders: allOrders.filter(o => o.dock === dock) }));
  const unassigned = allOrders.filter(o => !o.dock || !docks.includes(o.dock));

  return (
    <div className="space-y-6">
      {/* Header with history toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-3 py-1.5 rounded-lg bg-card border border-border font-medium">{docks.length} docas</span>
          <span className="px-3 py-1.5 rounded-lg bg-card border border-border font-medium">{allOrders.filter(o => o.dock).length} ocupadas</span>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors">
          <History className="h-4 w-4" /> {showHistory ? "Ocultar" : "Histórico"}
        </button>
      </div>

      {/* Dock grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {ordersByDock.map(({ dock, orders: dockOrders }) => {
          const timer = getTimer(dock);
          const isRunning = timer && !timer.stoppedAt;
          const elapsed = timer ? getElapsed(timer) : 0;
          const isOverThreshold = isRunning && elapsed > ALERT_THRESHOLD_MS;
          const firstOrder = dockOrders[0];

          return (
            <div
              key={dock}
              className={`glass-card rounded-lg overflow-hidden transition-all ${isOverThreshold ? "ring-2 ring-critical/60 shadow-[0_0_20px_hsl(var(--critical)/0.3)]" : ""}`}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-primary/60"); }}
              onDragLeave={e => { e.currentTarget.classList.remove("ring-2", "ring-primary/60"); }}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("ring-2", "ring-primary/60"); handleDrop(dock); }}
            >
              <div className={`px-3 py-2 border-b border-border ${isOverThreshold ? "bg-critical/20" : "bg-accent/30"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Container className={`h-4 w-4 ${isOverThreshold ? "text-critical" : "text-primary"}`} />
                    <span className="font-bold text-sm text-foreground">{dock}</span>
                  </div>
                  {isOverThreshold ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-critical animate-pulse" />
                  ) : (
                    <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Timer */}
              <div className="px-3 py-2 border-b border-border bg-card">
                <div className={`font-mono text-lg font-bold text-center ${isOverThreshold ? "text-critical animate-pulse" : isRunning ? "text-primary animate-pulse" : timer?.stoppedAt ? "text-success" : "text-muted-foreground"}`}>
                  {timer ? formatElapsed(elapsed) : "00:00:00"}
                </div>
                {isOverThreshold && (
                  <div className="text-center mt-1">
                    <span className="text-[10px] font-semibold text-critical bg-critical/10 px-2 py-0.5 rounded-full">⚠ TEMPO EXCEDIDO</span>
                  </div>
                )}
                <div className="flex justify-center mt-1.5 gap-1.5">
                  {!isRunning && firstOrder && (
                    <button onClick={() => startTimer(dock, firstOrder.id)} className="flex items-center gap-1 px-3 py-1 rounded-md gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
                      <Play className="h-3 w-3" /> Start
                    </button>
                  )}
                  {isRunning && (
                    <button onClick={() => stopTimer(dock)} className="flex items-center gap-1 px-3 py-1 rounded-md bg-critical/20 text-critical border border-critical/30 text-xs font-semibold hover:bg-critical/30 transition-colors">
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
                  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">Arraste um veículo aqui</div>
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

      {/* Unassigned - draggable */}
      {unassigned.length > 0 && (
        <div className="glass-card rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Sem Doca Atribuída ({unassigned.length}) — <span className="text-primary font-normal">arraste para uma doca</span></h3>
          </div>
          <div className="divide-y divide-border">
            {unassigned.map(order => (
              <div
                key={order.id}
                draggable
                onDragStart={() => handleDragStart(order.id)}
                onDragEnd={handleDragEnd}
                className="flex items-center justify-between p-3 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm font-bold text-foreground">{order.plate}</span>
                  <span className="text-xs text-muted-foreground">{getDriverName(order.driver_id)}</span>
                </div>
                <StatusChip status={order.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History panel */}
      {showHistory && (
        <div className="glass-card rounded-lg animate-fade-in-up">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Histórico de Tempos</h3>
          </div>
          {history.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Nenhum registro ainda. Inicie e pare cronômetros para gerar histórico.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Doca</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Placa</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Motorista</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Entrada</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Saída</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.slice(0, 20).map(entry => (
                    <tr key={entry.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{entry.date}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{entry.dock}</td>
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{entry.plate}</td>
                      <td className="px-4 py-3 text-foreground">{entry.driverName}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{new Date(entry.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{new Date(entry.stoppedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className={`px-4 py-3 font-mono font-bold ${entry.durationMs > ALERT_THRESHOLD_MS ? "text-critical" : "text-success"}`}>
                        {formatElapsed(entry.durationMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
