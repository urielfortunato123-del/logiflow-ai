import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

interface AiNoteHelperProps {
  module: string;
  fields: Record<string, any>;
  fieldTarget: string;
  onAccept: (text: string) => void;
}

export function AiNoteHelper({ module, fields, fieldTarget, onAccept }: AiNoteHelperProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ module, fields, field_target: fieldTarget }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar sugestão");
      }

      const data = await resp.json();
      setSuggestion(data.suggestion || "");
    } catch (e: any) {
      toast.error(e.message || "Erro ao conectar com a IA");
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (suggestion) {
      onAccept(suggestion);
      setSuggestion(null);
    }
  };

  const dismiss = () => setSuggestion(null);

  if (suggestion) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2 animate-fade-in-up">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" /> Sugestão da IA
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{suggestion}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={accept}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Check className="h-3 w-3" /> Usar
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-accent transition-colors"
          >
            <X className="h-3 w-3" /> Descartar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {loading ? "Gerando..." : "Sugerir com IA"}
    </button>
  );
}
