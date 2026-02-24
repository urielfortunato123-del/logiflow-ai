import { useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { CrudModal, Field, inputClass, selectClass } from "@/components/CrudModal";
import { mockIncidents } from "@/data/mockData";
import { Incident, IncidentType } from "@/types/domain";
import { getStore, setStore, addItem, updateItem, deleteItem, genId, STORE_KEYS } from "@/lib/localStorage";
import { AlertTriangle, Plus, Clock, Zap, Pencil } from "lucide-react";
import { AiNoteHelper } from "@/components/AiNoteHelper";
import { toast } from "sonner";

const K = STORE_KEYS.INCIDENTS;
const typeLabels: Record<string, string> = { fire_drill: "Simulado Incêndio", late_truck: "Caminhão Atrasado", system_outage: "Queda de Sistema", other: "Outro" };
const typeIcons: Record<string, typeof AlertTriangle> = { fire_drill: Zap, late_truck: Clock, system_outage: AlertTriangle, other: AlertTriangle };

const emptyIncident = (): Incident => ({
  id: "", date: new Date().toISOString().split("T")[0], incident_type: "other", duration_min: 0, impact: "", notes: "",
});

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>(() => getStore(K, mockIncidents));
  const [modal, setModal] = useState<{ open: boolean; inc: Incident; isNew: boolean }>({ open: false, inc: emptyIncident(), isNew: true });

  const save = (items: Incident[]) => { setStore(K, items); setIncidents(items); };
  const openNew = () => setModal({ open: true, inc: { ...emptyIncident(), id: genId() }, isNew: true });
  const openEdit = (i: Incident) => setModal({ open: true, inc: { ...i }, isNew: false });
  const close = () => setModal(m => ({ ...m, open: false }));
  const setField = (field: keyof Incident, value: any) => setModal(m => ({ ...m, inc: { ...m.inc, [field]: value } }));

  const handleSave = () => {
    if (!modal.inc.impact.trim()) { toast.error("Impacto obrigatório"); return; }
    if (modal.isNew) save(addItem(K, mockIncidents, modal.inc));
    else save(updateItem(K, mockIncidents, modal.inc));
    toast.success(modal.isNew ? "Incidente registrado" : "Incidente atualizado");
    close();
  };
  const handleDelete = () => { save(deleteItem(K, mockIncidents, modal.inc.id)); toast.success("Incidente excluído"); close(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{incidents.length} incidente(s) hoje</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Registrar</button>
      </div>

      <div className="space-y-3">
        {incidents.map(inc => {
          const Icon = typeIcons[inc.incident_type] ?? AlertTriangle;
          return (
            <div key={inc.id} className="glass-card rounded-lg p-5 animate-fade-in-up cursor-pointer" onClick={() => openEdit(inc)}>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-warning/10"><Icon className="h-5 w-5 text-warning" /></div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{typeLabels[inc.incident_type]}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{inc.duration_min} min</span>
                    <button onClick={e => { e.stopPropagation(); openEdit(inc); }} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="text-sm text-muted-foreground">{inc.impact}</p>
                  {inc.notes && <p className="text-xs text-muted-foreground italic">{inc.notes}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Novo Incidente" : "Editar Incidente"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        <Field label="Tipo">
          <select className={selectClass} value={modal.inc.incident_type} onChange={e => setField("incident_type", e.target.value)}>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duração (min)"><input type="number" className={inputClass} value={modal.inc.duration_min} onChange={e => setField("duration_min", Number(e.target.value))} /></Field>
          <Field label="Data"><input type="date" className={inputClass} value={modal.inc.date} onChange={e => setField("date", e.target.value)} /></Field>
        </div>
        <Field label="Impacto">
          <input className={inputClass} value={modal.inc.impact} onChange={e => setField("impact", e.target.value)} placeholder="Descreva o impacto..." />
          <AiNoteHelper
            module="Incidentes"
            fields={{ type: typeLabels[modal.inc.incident_type], duration: modal.inc.duration_min, date: modal.inc.date }}
            fieldTarget="impacto"
            onAccept={(text) => setField("impact", text)}
          />
        </Field>
        <Field label="Notas">
          <textarea className={inputClass} rows={2} value={modal.inc.notes} onChange={e => setField("notes", e.target.value)} />
          <AiNoteHelper
            module="Incidentes"
            fields={{ type: typeLabels[modal.inc.incident_type], duration: modal.inc.duration_min, date: modal.inc.date, impact: modal.inc.impact }}
            fieldTarget="notas"
            onAccept={(text) => setField("notes", text)}
          />
        </Field>
      </CrudModal>
    </div>
  );
}
