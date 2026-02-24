import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { StatusChip } from "@/components/StatusChip";
import { CrudModal, Field, inputClass, selectClass } from "@/components/CrudModal";
import { mockKPIs, mockDrivers, getDriverName } from "@/data/mockData";
import { KPI, KPIType } from "@/types/domain";
import { getStore, setStore, addItem, updateItem, deleteItem, genId, STORE_KEYS } from "@/lib/localStorage";
import { BarChart3, Shield, Gauge, GraduationCap, Plus, Upload, Pencil } from "lucide-react";
import { AiNoteHelper } from "@/components/AiNoteHelper";
import { toast } from "sonner";

const K = STORE_KEYS.KPIS;
const kpiIcons = { training: GraduationCap, safety: Shield, telematics: Gauge, performance: BarChart3 };
const kpiLabels = { training: "Treinamento", safety: "Segurança", telematics: "Telemática", performance: "Performance" };

const emptyKPI = (): KPI => ({
  id: "", date: new Date().toISOString().split("T")[0], carrier_name: "", driver_id: "",
  kpi_type: "performance", metric_name: "", metric_value: 0, unit: "", source: "manual", notes: "",
});

export default function KPIs() {
  const [kpis, setKpis] = useState<KPI[]>(() => getStore(K, mockKPIs));
  const [modal, setModal] = useState<{ open: boolean; kpi: KPI; isNew: boolean }>({ open: false, kpi: emptyKPI(), isNew: true });

  const drivers = getStore(STORE_KEYS.DRIVERS, mockDrivers);
  const save = (items: KPI[]) => { setStore(K, items); setKpis(items); };

  const byType = {
    training: kpis.filter(k => k.kpi_type === "training"),
    safety: kpis.filter(k => k.kpi_type === "safety"),
    telematics: kpis.filter(k => k.kpi_type === "telematics"),
    performance: kpis.filter(k => k.kpi_type === "performance"),
  };

  const openNew = () => setModal({ open: true, kpi: { ...emptyKPI(), id: genId() }, isNew: true });
  const openEdit = (k: KPI) => setModal({ open: true, kpi: { ...k }, isNew: false });
  const close = () => setModal(m => ({ ...m, open: false }));
  const setField = (field: keyof KPI, value: any) => setModal(m => ({ ...m, kpi: { ...m.kpi, [field]: value } }));

  const handleSave = () => {
    if (!modal.kpi.metric_name.trim()) { toast.error("Nome da métrica obrigatório"); return; }
    if (modal.isNew) save(addItem(K, mockKPIs, modal.kpi));
    else save(updateItem(K, mockKPIs, modal.kpi));
    toast.success(modal.isNew ? "KPI criado" : "KPI atualizado");
    close();
  };
  const handleDelete = () => { save(deleteItem(K, mockKPIs, modal.kpi.id)); toast.success("KPI excluído"); close(); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(byType) as Array<keyof typeof byType>).map(type => {
            const Icon = kpiIcons[type];
            return <MetricCard key={type} title={kpiLabels[type]} value={byType[type].length} icon={Icon} variant={type === "safety" ? "critical" : type === "training" ? "warning" : "info"} />;
          })}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors"><Upload className="h-4 w-4" /> Importar CSV</button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Novo KPI</button>
        </div>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Métrica</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Motorista</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Transportadora</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Fonte</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {kpis.map(kpi => {
                const Icon = kpiIcons[kpi.kpi_type];
                return (
                  <tr key={kpi.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => openEdit(kpi)}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="text-foreground">{kpiLabels[kpi.kpi_type]}</span></div></td>
                    <td className="px-4 py-3 text-foreground font-medium">{kpi.metric_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getDriverName(kpi.driver_id)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{kpi.carrier_name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{kpi.metric_value} <span className="text-muted-foreground font-normal">{kpi.unit}</span></td>
                    <td className="px-4 py-3"><StatusChip status={kpi.source === "manual" ? "ok" : kpi.source === "import" ? "planned" : "pending"} /></td>
                    <td className="px-4 py-3"><button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Novo KPI" : "Editar KPI"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        <Field label="Tipo">
          <select className={selectClass} value={modal.kpi.kpi_type} onChange={e => setField("kpi_type", e.target.value)}>
            {Object.entries(kpiLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Métrica"><input className={inputClass} value={modal.kpi.metric_name} onChange={e => setField("metric_name", e.target.value)} placeholder="Ex: Entregas/hora" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor"><input type="number" step="0.1" className={inputClass} value={modal.kpi.metric_value} onChange={e => setField("metric_value", Number(e.target.value))} /></Field>
          <Field label="Unidade"><input className={inputClass} value={modal.kpi.unit} onChange={e => setField("unit", e.target.value)} placeholder="un/h, eventos..." /></Field>
        </div>
        <Field label="Motorista">
          <select className={selectClass} value={modal.kpi.driver_id} onChange={e => setField("driver_id", e.target.value)}>
            <option value="">Selecione...</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Transportadora"><input className={inputClass} value={modal.kpi.carrier_name} onChange={e => setField("carrier_name", e.target.value)} /></Field>
        <Field label="Fonte">
          <select className={selectClass} value={modal.kpi.source} onChange={e => setField("source", e.target.value)}>
            <option value="manual">Manual</option><option value="import">Import</option><option value="ocr">OCR</option>
          </select>
        </Field>
        <Field label="Notas">
          <textarea className={inputClass} rows={2} value={modal.kpi.notes} onChange={e => setField("notes", e.target.value)} />
          <AiNoteHelper
            module="KPIs"
            fields={{ type: modal.kpi.kpi_type, metric: modal.kpi.metric_name, value: modal.kpi.metric_value, unit: modal.kpi.unit, driver: getDriverName(modal.kpi.driver_id), carrier: modal.kpi.carrier_name }}
            fieldTarget="notas"
            onAccept={(text) => setField("notes", text)}
          />
        </Field>
      </CrudModal>
    </div>
  );
}
