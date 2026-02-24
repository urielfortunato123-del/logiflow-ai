import { useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { CrudModal, Field, inputClass, selectClass } from "@/components/CrudModal";
import { mockRoutes, mockAgencies, getAgencyName } from "@/data/mockData";
import { Route, RouteStatus } from "@/types/domain";
import { getStore, setStore, addItem, updateItem, deleteItem, genId, STORE_KEYS } from "@/lib/localStorage";
import { MapPin, Clock, TrendingUp, Sparkles, FileText, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

const K = STORE_KEYS.ROUTES;

const emptyRoute = (): Route => ({
  id: "", date: new Date().toISOString().split("T")[0], agency_id: "", route_code: "", vehicle_type: "truck",
  planned_stops: 0, planned_minutes: 0, planned_distance_km: 0, actual_stops: null, actual_minutes: null, status: "planned", notes: "",
});

export default function Routes() {
  const [routes, setRoutes] = useState<Route[]>(() => getStore(K, mockRoutes));
  const [modal, setModal] = useState<{ open: boolean; route: Route; isNew: boolean }>({ open: false, route: emptyRoute(), isNew: true });

  const agencies = getStore(STORE_KEYS.AGENCIES, mockAgencies);
  const save = (items: Route[]) => { setStore(K, items); setRoutes(items); };

  const openNew = () => setModal({ open: true, route: { ...emptyRoute(), id: genId() }, isNew: true });
  const openEdit = (r: Route) => setModal({ open: true, route: { ...r }, isNew: false });
  const close = () => setModal(m => ({ ...m, open: false }));
  const setField = (field: keyof Route, value: any) => setModal(m => ({ ...m, route: { ...m.route, [field]: value } }));

  const handleSave = () => {
    if (!modal.route.route_code.trim()) { toast.error("Código da rota obrigatório"); return; }
    if (modal.isNew) save(addItem(K, mockRoutes, modal.route));
    else save(updateItem(K, mockRoutes, modal.route));
    toast.success(modal.isNew ? "Rota criada" : "Rota atualizada");
    close();
  };
  const handleDelete = () => { save(deleteItem(K, mockRoutes, modal.route.id)); toast.success("Rota excluída"); close(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(["planned", "in_progress", "done"] as const).map(s => (
            <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
              <StatusChip status={s} /><span className="text-sm font-bold text-foreground">{routes.filter(r => r.status === s).length}</span>
            </div>
          ))}
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Nova Rota</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {routes.map(route => {
          const stopsProgress = route.actual_stops != null ? (route.actual_stops / route.planned_stops) * 100 : 0;
          const timeProgress = route.actual_minutes != null ? (route.actual_minutes / route.planned_minutes) * 100 : 0;
          const isOverTime = timeProgress > stopsProgress + 15;
          return (
            <div key={route.id} className="glass-card rounded-lg p-5 animate-fade-in-up space-y-4 cursor-pointer" onClick={() => openEdit(route)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-lg font-bold text-foreground">{route.route_code}</div>
                  <div className="text-xs text-muted-foreground">{getAgencyName(route.agency_id)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={route.status} />
                  <button onClick={e => { e.stopPropagation(); openEdit(route); }} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Paradas</span>
                    <span>{route.actual_stops ?? 0} / {route.planned_stops}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stopsProgress}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Tempo</span>
                    <span className={isOverTime ? "text-warning font-semibold" : ""}>{route.actual_minutes ?? 0} / {route.planned_minutes} min</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full transition-all ${isOverTime ? "bg-warning" : "bg-info"}`} style={{ width: `${Math.min(timeProgress, 100)}%` }} /></div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3" /> {route.planned_distance_km} km planejados</div>
              <div className="flex gap-2 pt-1">
                <button onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"><Sparkles className="h-3 w-3 text-primary" /> Analisar com IA</button>
                <button onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"><FileText className="h-3 w-3" /> Prep. Reunião</button>
              </div>
            </div>
          );
        })}
      </div>

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Nova Rota" : "Editar Rota"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Código"><input className={inputClass} value={modal.route.route_code} onChange={e => setField("route_code", e.target.value.toUpperCase())} placeholder="MAR-001" /></Field>
          <Field label="Data"><input type="date" className={inputClass} value={modal.route.date} onChange={e => setField("date", e.target.value)} /></Field>
        </div>
        <Field label="Agência">
          <select className={selectClass} value={modal.route.agency_id} onChange={e => setField("agency_id", e.target.value)}>
            <option value="">Selecione...</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name} — {a.city}/{a.uf}</option>)}
          </select>
        </Field>
        <Field label="Tipo Veículo">
          <select className={selectClass} value={modal.route.vehicle_type} onChange={e => setField("vehicle_type", e.target.value)}>
            <option value="truck">Truck</option><option value="car">Car</option><option value="moto">Moto</option>
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Paradas Plan."><input type="number" className={inputClass} value={modal.route.planned_stops} onChange={e => setField("planned_stops", Number(e.target.value))} /></Field>
          <Field label="Min. Plan."><input type="number" className={inputClass} value={modal.route.planned_minutes} onChange={e => setField("planned_minutes", Number(e.target.value))} /></Field>
          <Field label="Km Plan."><input type="number" className={inputClass} value={modal.route.planned_distance_km} onChange={e => setField("planned_distance_km", Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Paradas Real"><input type="number" className={inputClass} value={modal.route.actual_stops ?? ""} onChange={e => setField("actual_stops", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Min. Real"><input type="number" className={inputClass} value={modal.route.actual_minutes ?? ""} onChange={e => setField("actual_minutes", e.target.value ? Number(e.target.value) : null)} /></Field>
        </div>
        <Field label="Status">
          <select className={selectClass} value={modal.route.status} onChange={e => setField("status", e.target.value)}>
            <option value="planned">Planned</option><option value="in_progress">In Progress</option><option value="done">Done</option>
          </select>
        </Field>
        <Field label="Notas"><textarea className={inputClass} rows={2} value={modal.route.notes} onChange={e => setField("notes", e.target.value)} /></Field>
      </CrudModal>
    </div>
  );
}
