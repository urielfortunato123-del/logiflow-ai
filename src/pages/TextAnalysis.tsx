import { useState, useCallback } from "react";
import { Brain, Loader2, Tag, Smile, Frown, Meh, Zap, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const ANALYSIS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-analysis`;

interface SentimentResult {
  mode: "sentiment";
  text: string;
  top: { label: string; score: number };
  scores: { label: string; score: number }[];
  source: string;
}

interface ClassificationResult {
  mode: "classification";
  text: string;
  top_label: string;
  top_score: number;
  labels: string[];
  scores: number[];
  source: string;
}

type AnalysisResult = SentimentResult | ClassificationResult;

const SENTIMENT_ICONS: Record<string, typeof Smile> = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
  Positive: Smile,
  Negative: Frown,
  Neutral: Meh,
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  neutral: "text-amber-400",
  Positive: "text-emerald-400",
  Negative: "text-red-400",
  Neutral: "text-amber-400",
};

function ScoreBar({ label, score, highlight }: { label: string; score: number; highlight?: boolean }) {
  const pct = Math.round(score * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={highlight ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
        <span className={highlight ? "font-bold text-primary" : "text-muted-foreground"}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${highlight ? "bg-primary" : "bg-muted-foreground/40"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TextAnalysis() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"sentiment" | "classification">("sentiment");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch(ANALYSIS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: text.trim(), mode }),
      });

      if (resp.status === 503) {
        const d = await resp.json();
        toast.info(d.error || "Modelo carregando, tente novamente em 30s");
        return;
      }

      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.error || "Erro na análise");
      }

      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Erro ao analisar texto");
    } finally {
      setLoading(false);
    }
  }, [text, mode]);

  const SentimentIcon = result?.mode === "sentiment" ? (SENTIMENT_ICONS[result.top.label] || Meh) : null;
  const sentimentColor = result?.mode === "sentiment" ? (SENTIMENT_COLORS[result.top.label] || "text-muted-foreground") : "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Análise de Texto</h1>
          <p className="text-xs text-muted-foreground">Sentimento e classificação com IA • Gemma 3n</p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Cole ou digite o texto para análise...&#10;Ex: 'O motorista reportou atraso de 2h na rota BAU-015 por causa de um acidente na rodovia.'"
          rows={5}
          maxLength={2000}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{text.length}/2000 caracteres</p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("sentiment"); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              mode === "sentiment"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            <Smile className="h-4 w-4" /> Sentimento
          </button>
          <button
            onClick={() => { setMode("classification"); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              mode === "classification"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            <Tag className="h-4 w-4" /> Classificação
          </button>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyze}
          disabled={!text.trim() || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" /> Analisar
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="glass-card rounded-lg p-5 space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-primary" /> Resultado
            <span className="ml-auto text-xs text-muted-foreground font-normal capitalize">
              via {result.source}
            </span>
          </div>

          {result.mode === "sentiment" && SentimentIcon && (
            <div className="text-center py-4">
              <SentimentIcon className={`h-14 w-14 mx-auto mb-2 ${sentimentColor}`} />
              <p className={`text-2xl font-bold capitalize ${sentimentColor}`}>
                {result.top.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Confiança: {Math.round(result.top.score * 100)}%
              </p>
            </div>
          )}

          {result.mode === "sentiment" && (
            <div className="space-y-3">
              {result.scores.map((s) => (
                <ScoreBar
                  key={s.label}
                  label={s.label}
                  score={s.score}
                  highlight={s.label === result.top.label}
                />
              ))}
            </div>
          )}

          {result.mode === "classification" && (
            <>
              <div className="text-center py-4">
                <Tag className="h-14 w-14 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary capitalize">
                  {result.top_label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Confiança: {Math.round(result.top_score * 100)}%
                </p>
              </div>
              <div className="space-y-3">
                {result.labels.map((label, i) => (
                  <ScoreBar
                    key={label}
                    label={label}
                    score={result.scores[i]}
                    highlight={label === result.top_label}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
