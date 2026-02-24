import { useState } from "react";
import { mockClosingReport, mockIncidents } from "@/data/mockData";
import { Package, FileText, Sparkles, Download, AlertTriangle } from "lucide-react";

export default function Closing() {
  const [packagesOut, setPackagesOut] = useState(mockClosingReport.packages_out);
  const [packagesIn, setPackagesIn] = useState(mockClosingReport.packages_in_base);
  const [summary, setSummary] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateSummary = () => {
    setGenerating(true);
    setTimeout(() => {
      setSummary(
        `Fechamento 24/02/2026 — Base Marília\n\n` +
        `Pacotes saídos: ${packagesOut}\n` +
        `Pacotes em base: ${packagesIn}\n\n` +
        `Ocorrências:\n` +
        mockIncidents.map(i => `• ${i.incident_type === "fire_drill" ? "Simulado de incêndio" : "Atraso de caminhão"}: ${i.duration_min}min — ${i.impact}`).join("\n") +
        `\n\nResumo: Operação dentro do esperado, com impacto de ${mockIncidents.reduce((a, i) => a + i.duration_min, 0)}min em incidentes. ` +
        `1 divergência identificada na conferência (Bauru Hub), pendente de resolução. ` +
        `Treinamentos pendentes para 2 motoristas (TransLog). Recomendar follow-up com transportadora.`
      );
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-lg p-5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
            <Package className="h-3 w-3 inline mr-1" /> Pacotes Saídos
          </label>
          <input
            type="number"
            value={packagesOut}
            onChange={e => setPackagesOut(Number(e.target.value))}
            className="w-full text-3xl font-bold text-foreground bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none pb-1"
          />
        </div>
        <div className="glass-card rounded-lg p-5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
            <Package className="h-3 w-3 inline mr-1" /> Pacotes em Base
          </label>
          <input
            type="number"
            value={packagesIn}
            onChange={e => setPackagesIn(Number(e.target.value))}
            className="w-full text-3xl font-bold text-foreground bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none pb-1"
          />
        </div>
      </div>

      {/* Incidents of the day */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" /> Incidentes do Dia
        </h3>
        <div className="space-y-2">
          {mockIncidents.map(inc => (
            <div key={inc.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-sm text-foreground flex-1">{inc.incident_type === "fire_drill" ? "Simulado incêndio" : "Atraso caminhão"} — {inc.duration_min}min</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={generateSummary}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Sparkles className="h-5 w-5" />
        {generating ? "Gerando resumo..." : "Gerar Resumo com IA"}
      </button>

      {summary && (
        <div className="glass-card rounded-lg p-5 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Resumo do Dia
            </h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors">
              <Download className="h-3 w-3" /> PDF
            </button>
          </div>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{summary}</pre>
        </div>
      )}
    </div>
  );
}
