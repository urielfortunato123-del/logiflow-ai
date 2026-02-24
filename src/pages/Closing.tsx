import { useState } from "react";
import { CrudModal, Field, inputClass } from "@/components/CrudModal";
import { mockClosingReport, mockIncidents } from "@/data/mockData";
import { ClosingReport, Incident } from "@/types/domain";
import { getStore, setStore, genId, STORE_KEYS } from "@/lib/localStorage";
import { Package, FileText, Sparkles, Download, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { AiNoteHelper } from "@/components/AiNoteHelper";
import { toast } from "sonner";

const K = STORE_KEYS.CLOSING_REPORTS;

export default function Closing() {
  const [reports, setReports] = useState<ClosingReport[]>(() => {
    const stored = getStore<ClosingReport>(K, []);
    return stored.length > 0 ? stored : [mockClosingReport];
  });
  const incidents = getStore<Incident>(STORE_KEYS.INCIDENTS, mockIncidents);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [summary, setSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; report: ClosingReport; isNew: boolean }>({ open: false, report: mockClosingReport, isNew: true });

  const save = (items: ClosingReport[]) => { setStore(K, items); setReports(items); };
  const current = reports[selectedIdx] || reports[0];

  const openNew = () => setModal({ open: true, report: { id: genId(), date: new Date().toISOString().split("T")[0], packages_out: 0, packages_in_base: 0, summary_text: "", generated_by_ai: false, created_by: "admin" }, isNew: true });
  const openEdit = () => setModal({ open: true, report: { ...current }, isNew: false });
  const close = () => setModal(m => ({ ...m, open: false }));
  const setField = (field: keyof ClosingReport, value: any) => setModal(m => ({ ...m, report: { ...m.report, [field]: value } }));

  const handleSave = () => {
    if (modal.isNew) { save([...reports, modal.report]); setSelectedIdx(reports.length); }
    else save(reports.map(r => r.id === modal.report.id ? modal.report : r));
    toast.success(modal.isNew ? "Fechamento criado" : "Fechamento atualizado");
    close();
  };
  const handleDelete = () => {
    const updated = reports.filter(r => r.id !== modal.report.id);
    save(updated.length > 0 ? updated : [mockClosingReport]);
    setSelectedIdx(0);
    toast.success("Fechamento excluído");
    close();
  };

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Gere um resumo de fechamento do dia para a base logística. Pacotes saídos: ${current.packages_out}. Pacotes em base: ${current.packages_in_base}. Incidentes: ${incidents.map(i => `${i.incident_type} (${i.duration_min}min) - ${i.impact}`).join("; ")}. Seja conciso e profissional.` }],
          context: { date: current.date },
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("Erro");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try { const c = JSON.parse(j).choices?.[0]?.delta?.content; if (c) { text += c; setSummary(text); } } catch {}
        }
      }
    } catch {
      setSummary(`Fechamento ${current.date} — Base Marília\n\nPacotes saídos: ${current.packages_out}\nPacotes em base: ${current.packages_in_base}\n\nIncidentes: ${incidents.map(i => `• ${i.incident_type}: ${i.duration_min}min — ${i.impact}`).join("\n")}`);
    }
    setGenerating(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {reports.map((r, i) => (
            <button key={r.id} onClick={() => setSelectedIdx(i)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${i === selectedIdx ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>{r.date}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={openEdit} className="p-2 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-4 w-4" /></button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"><Plus className="h-4 w-4" /> Novo</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-lg p-5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2"><Package className="h-3 w-3 inline mr-1" /> Pacotes Saídos</label>
          <div className="text-3xl font-bold text-foreground">{current.packages_out}</div>
        </div>
        <div className="glass-card rounded-lg p-5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2"><Package className="h-3 w-3 inline mr-1" /> Pacotes em Base</label>
          <div className="text-3xl font-bold text-foreground">{current.packages_in_base}</div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Incidentes do Dia</h3>
        <div className="space-y-2">
          {incidents.map(inc => (
            <div key={inc.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-sm text-foreground flex-1">{inc.incident_type === "fire_drill" ? "Simulado incêndio" : inc.incident_type === "late_truck" ? "Atraso caminhão" : inc.incident_type} — {inc.duration_min}min</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={generateSummary} disabled={generating} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
        <Sparkles className="h-5 w-5" />{generating ? "Gerando resumo..." : "Gerar Resumo com IA"}
      </button>

      {summary && (
        <div className="glass-card rounded-lg p-5 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Resumo do Dia</h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"><Download className="h-3 w-3" /> PDF</button>
          </div>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{summary}</pre>
        </div>
      )}

      <CrudModal open={modal.open} onClose={close} title={modal.isNew ? "Novo Fechamento" : "Editar Fechamento"} onSave={handleSave} onDelete={!modal.isNew ? handleDelete : undefined}>
        <Field label="Data"><input type="date" className={inputClass} value={modal.report.date} onChange={e => setField("date", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pacotes Saídos"><input type="number" className={inputClass} value={modal.report.packages_out} onChange={e => setField("packages_out", Number(e.target.value))} /></Field>
          <Field label="Pacotes em Base"><input type="number" className={inputClass} value={modal.report.packages_in_base} onChange={e => setField("packages_in_base", Number(e.target.value))} /></Field>
        </div>
        <Field label="Resumo">
          <textarea className={inputClass} rows={3} value={modal.report.summary_text || ""} onChange={e => setField("summary_text", e.target.value)} placeholder="Resumo do fechamento..." />
          <AiNoteHelper
            module="Fechamento Diário"
            fields={{ date: modal.report.date, packages_out: modal.report.packages_out, packages_in_base: modal.report.packages_in_base }}
            fieldTarget="resumo do fechamento"
            onAccept={(text) => setField("summary_text", text)}
          />
        </Field>
      </CrudModal>
    </div>
  );
}
