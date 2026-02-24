import { useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { CrudModal, Field, inputClass, selectClass } from "@/components/CrudModal";
import { mockGateOrders, mockDrivers, getDriverName } from "@/data/mockData";
import { GateOrder, GateOrderStatus } from "@/types/domain";
import { getStore, setStore, addItem, updateItem, deleteItem, genId, STORE_KEYS } from "@/lib/localStorage";
import { Plus, Search, Printer, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { AiNoteHelper } from "@/components/AiNoteHelper";
import { toast } from "sonner";

const K = STORE_KEYS.GATE_ORDERS;
const statusFlow: GateOrderStatus[] = ["waiting", "released", "at_dock", "loading", "finished"];

function nextStatus(current: GateOrderStatus): GateOrderStatus | null {
  const idx = statusFlow.indexOf(current);
  return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
}

const nextLabel: Record<string, string> = { waiting: "Liberar", released: "Entrar Doca", at_dock: "Iniciar Carga", loading: "Finalizar" };

const emptyOrder = (): GateOrder => ({
  id: "", date: new Date().toISOString().split("T")[0], list_number: 1, plate: "", driver_id: "",
  route_id: null, dock: null, status: "waiting", released_at: null, dock_in_at: null,
  loading_start_at: null, loading_end_at: null, created_by: "admin",
});

export default function GateQueue() {
  const [orders, setOrders] = useState<GateOrder[]>(() => getStore(K, mockGateOrders));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; order: GateOrder; isNew: boolean }>({ open: false, order: emptyOrder(), isNew: true });

  const drivers = getStore(STORE_KEYS.DRIVERS, mockDrivers);
  const save = (items: GateOrder[]) => { setStore(K, items); setOrders(items); };

  const filtered = orders.filter(o =>
    o.plate.toLowerCase().includes(search.toLowerCase()) ||
    getDriverName(o.driver_id).toLowerCase().includes(search.toLowerCase())
  );

  const advanceStatus = (id: string) => {
    const updated = orders.map(o => {
      if (o.id !== id) return o;
      const next = nextStatus(o.status);
      if (!next) return o;
      const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return { ...o, status: next, ...(next === "released" && { released_at: now }), ...(next === "at_dock" && { dock_in_at: now }), ...(next === "loading" && { loading_start_at: now }), ...(next === "finished" && { loading_end_at: now }) };
    });
    save(updated);
  };

  const openNew = () => setModal({ open: true, order: { ...emptyOrder(), id: genId() }, isNew: true });
  const openEdit = (o: GateOrder) => setModal({ open: true, order: { ...o }, isNew: false });
  const close = () => setModal(m => ({ ...m, open: false }));

  const handleSave = () => {
    if (!modal.order.plate.trim()) { toast.error("Placa obrigatória"); return; }
    if (modal.isNew) save(addItem(K, mockGateOrders, modal.order));
    else save(updateItem(K, mockGateOrders, modal.order));
    toast.success(modal.isNew ? "Ordem criada" : "Ordem atualizada");
    close();
  };

  const handleDelete = () => {
    save(deleteItem(K, mockGateOrders, modal.order.id));
    toast.success("Ordem excluída");
    close();
  };

  const setField = (field: keyof GateOrder, value: any) => setModal(m => ({ ...m, order: { ...m.order, [field]: value } }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar placa ou motorista..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg ops-input text-sm border" />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors"><Printer className="h-4 w-4" /> Lista</button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Nova Ordem</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFlow.map(s => (
          <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <StatusChip status={s} /><span className="text-sm font-bold text-foreground">{orders.filter(o => o.status === s).length}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(order => (
          <div key={order.id} className="glass-card rounded-lg p-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => openEdit(order)}>
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
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  {order.released_at && <span>Lib {order.released_at}</span>}
                  {order.dock_in_at && <span>→ Doca {order.dock_in_at}</span>}
                  {order.loading_start_at && <span>→ Carga {order.loading_start_at}</span>}
                  {order.loading_end_at && <span>→ Fim {order.loading_end_at}</span>}
                </div>
                <StatusChip status={order.status} />
                <button onClick={() => openEdit(order)} className="p-2 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                {order.status !== "finished" && (
                  <button onClick={() => advanceStatus(order.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                    {nextLabel[order.status]} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Nova Ordem" : "Editar Ordem"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Placa"><input className={inputClass} value={modal.order.plate} onChange={e => setField("plate", e.target.value.toUpperCase())} placeholder="ABC-1234" /></Field>
          <Field label="Lista"><input type="number" className={inputClass} value={modal.order.list_number} onChange={e => setField("list_number", Number(e.target.value))} /></Field>
        </div>
        <Field label="Motorista">
          <select className={selectClass} value={modal.order.driver_id} onChange={e => setField("driver_id", e.target.value)}>
            <option value="">Selecione...</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.carrier_name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Doca"><input className={inputClass} value={modal.order.dock || ""} onChange={e => setField("dock", e.target.value || null)} placeholder="D1" /></Field>
          <Field label="Status">
            <select className={selectClass} value={modal.order.status} onChange={e => setField("status", e.target.value)}>
              {statusFlow.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Observações">
          <textarea className={inputClass} rows={2} value={(modal.order as any).notes || ""} onChange={e => setField("notes" as any, e.target.value)} placeholder="Observações sobre a ordem..." />
          <AiNoteHelper
            module="Gate Queue"
            fields={{ plate: modal.order.plate, driver: getDriverName(modal.order.driver_id), dock: modal.order.dock, status: modal.order.status }}
            fieldTarget="observações"
            onAccept={(text) => setField("notes" as any, text)}
          />
        </Field>
      </CrudModal>
    </div>
  );
}
