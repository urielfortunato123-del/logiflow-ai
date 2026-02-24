import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusChip } from "@/components/StatusChip";
import { CrudModal, Field, inputClass, selectClass } from "@/components/CrudModal";
import { mockConferences, mockAgencies, mockRoutes, getAgencyName } from "@/data/mockData";
import { Conference as ConferenceType } from "@/types/domain";
import { getStore, setStore, addItem, updateItem, deleteItem, genId, STORE_KEYS } from "@/lib/localStorage";
import { FileCheck, AlertTriangle, Upload, Plus, Pencil, Sparkles, FileText } from "lucide-react";
import { AiNoteHelper } from "@/components/AiNoteHelper";
import { toast } from "sonner";

const K = STORE_KEYS.CONFERENCES;

const emptyConf = (): ConferenceType => ({
  id: "", date: new Date().toISOString().split("T")[0], agency_id: "", route_id: "",
  qty_sacks: 0, qty_cotas: 0, orders_sys_a: 0, orders_sys_b: 0, is_divergent: false,
  divergence_reason: null, resolved_by: null, resolved_at: null, attachment_id: null,
});

export default function Conference() {
  const navigate = useNavigate();
  const [confs, setConfs] = useState<ConferenceType[]>(() => getStore(K, mockConferences));
  const [modal, setModal] = useState<{ open: boolean; conf: ConferenceType; isNew: boolean }>({ open: false, conf: emptyConf(), isNew: true });

  const agencies = getStore(STORE_KEYS.AGENCIES, mockAgencies);
  const routes = getStore(STORE_KEYS.ROUTES, mockRoutes);
  const save = (items: ConferenceType[]) => { setStore(K, items); setConfs(items); };

  const openNew = () => setModal({ open: true, conf: { ...emptyConf(), id: genId() }, isNew: true });
  const openEdit = (c: ConferenceType) => setModal({ open: true, conf: { ...c }, isNew: false });
  const close = () => setModal(m => ({ ...m, open: false }));
  const setField = (field: keyof ConferenceType, value: any) => setModal(m => ({ ...m, conf: { ...m.conf, [field]: value } }));

  const handleSave = () => {
    const c = modal.conf;
    const isDivergent = c.orders_sys_a !== c.orders_sys_b;
    const updated = { ...c, is_divergent: isDivergent };
    if (modal.isNew) save(addItem(K, mockConferences, updated));
    else save(updateItem(K, mockConferences, updated));
    toast.success(modal.isNew ? "Conferência criada" : "Conferência atualizada");
    close();
  };
  const handleDelete = () => { save(deleteItem(K, mockConferences, modal.conf.id)); toast.success("Conferência excluída"); close(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border"><StatusChip status="ok" /><span className="text-sm font-bold text-foreground">{confs.filter(c => !c.is_divergent).length}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border"><StatusChip status="divergent" /><span className="text-sm font-bold text-foreground">{confs.filter(c => c.is_divergent).length}</span></div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors"><Upload className="h-4 w-4" /> Import OCR</button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Nova Conferência</button>
        </div>
      </div>

      <div className="space-y-3">
        {confs.map(conf => (
          <div key={conf.id} className={`glass-card rounded-lg p-5 animate-fade-in-up cursor-pointer ${conf.is_divergent ? "border-critical/30" : ""}`} onClick={() => openEdit(conf)}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <FileCheck className={`h-5 w-5 ${conf.is_divergent ? "text-critical" : "text-success"}`} />
                  <span className="font-semibold text-foreground">{getAgencyName(conf.agency_id)}</span>
                  <StatusChip status={conf.is_divergent ? "divergent" : "ok"} />
                   <button onClick={e => { e.stopPropagation(); openEdit(conf); }} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                 </div>
                 <div className="flex gap-2 mt-2">
                   <button onClick={e => { e.stopPropagation(); navigate(`/chatbot?prompt=${encodeURIComponent(`Analise a conferência da agência ${getAgencyName(conf.agency_id)}: Sacas ${conf.qty_sacks}, Cotas ${conf.qty_cotas}, Sistema A ${conf.orders_sys_a}, Sistema B ${conf.orders_sys_b}, Divergente: ${conf.is_divergent ? "SIM" : "NÃO"}. ${conf.divergence_reason ? `Motivo: ${conf.divergence_reason}` : ""} Identifique problemas e sugira ações corretivas.`)}`); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"><Sparkles className="h-3 w-3 text-primary" /> Analisar com IA</button>
                   <button onClick={e => { e.stopPropagation(); navigate(`/chatbot?prompt=${encodeURIComponent(`Prepare um resumo para reunião sobre a conferência da agência ${getAgencyName(conf.agency_id)}. Dados: Sacas ${conf.qty_sacks}, Cotas ${conf.qty_cotas}, Sistema A ${conf.orders_sys_a}, Sistema B ${conf.orders_sys_b}. ${conf.is_divergent ? `DIVERGÊNCIA: ${conf.divergence_reason || `Diferença de ${Math.abs(conf.orders_sys_a - conf.orders_sys_b)} pedidos`}` : "Sem divergências."} Liste pontos de atenção e próximos passos.`)}`); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"><FileText className="h-3 w-3" /> Prep. Reunião</button>
                 </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-xs text-muted-foreground block">Sacas</span><span className="font-bold text-foreground">{conf.qty_sacks}</span></div>
                  <div><span className="text-xs text-muted-foreground block">Cotas</span><span className="font-bold text-foreground">{conf.qty_cotas}</span></div>
                  <div><span className="text-xs text-muted-foreground block">Sistema A</span><span className="font-bold text-foreground">{conf.orders_sys_a}</span></div>
                  <div><span className="text-xs text-muted-foreground block">Sistema B</span><span className={`font-bold ${conf.is_divergent ? "text-critical" : "text-foreground"}`}>{conf.orders_sys_b}</span></div>
                </div>
              </div>
              {conf.is_divergent && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-critical/5 border border-critical/20 max-w-sm">
                  <AlertTriangle className="h-4 w-4 text-critical mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Divergência Detectada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{conf.divergence_reason || `Diferença: ${Math.abs(conf.orders_sys_a - conf.orders_sys_b)} pedidos`}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Nova Conferência" : "Editar Conferência"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Agência">
            <select className={selectClass} value={modal.conf.agency_id} onChange={e => setField("agency_id", e.target.value)}>
              <option value="">Selecione...</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Rota">
            <select className={selectClass} value={modal.conf.route_id} onChange={e => setField("route_id", e.target.value)}>
              <option value="">Selecione...</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.route_code}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sacas"><input type="number" className={inputClass} value={modal.conf.qty_sacks} onChange={e => setField("qty_sacks", Number(e.target.value))} /></Field>
          <Field label="Cotas"><input type="number" className={inputClass} value={modal.conf.qty_cotas} onChange={e => setField("qty_cotas", Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pedidos Sys A"><input type="number" className={inputClass} value={modal.conf.orders_sys_a} onChange={e => setField("orders_sys_a", Number(e.target.value))} /></Field>
          <Field label="Pedidos Sys B"><input type="number" className={inputClass} value={modal.conf.orders_sys_b} onChange={e => setField("orders_sys_b", Number(e.target.value))} /></Field>
        </div>
        <Field label="Motivo Divergência">
          <textarea className={inputClass} rows={2} value={modal.conf.divergence_reason || ""} onChange={e => setField("divergence_reason", e.target.value || null)} placeholder="Descreva o motivo..." />
          <AiNoteHelper
            module="Conferência"
            fields={{ agency: getAgencyName(modal.conf.agency_id), sacks: modal.conf.qty_sacks, cotas: modal.conf.qty_cotas, sys_a: modal.conf.orders_sys_a, sys_b: modal.conf.orders_sys_b, divergent: modal.conf.is_divergent }}
            fieldTarget="motivo da divergência"
            onAccept={(text) => setField("divergence_reason", text)}
          />
        </Field>
      </CrudModal>
    </div>
  );
}
