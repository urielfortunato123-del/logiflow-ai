import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HF_BASE = "https://router.huggingface.co/hf-inference/models";

const MODELS = {
  sentiment: "tabularisai/multilingual-sentiment-analysis",
  classification: "facebook/bart-large-mnli",
};

async function callHF(model: string, body: any, apiKey: string) {
  const resp = await fetch(`${HF_BASE}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 503) {
    const data = await resp.json().catch(() => ({}));
    return { error: `Modelo carregando (~${Math.ceil(data.estimated_time || 30)}s). Tente novamente.`, loading: true };
  }
  if (resp.status === 402) {
    return { error: "hf_payment_required" };
  }
  if (!resp.ok) {
    const t = await resp.text();
    console.error(`HF ${model} error:`, resp.status, t);
    return { error: `Erro ${resp.status} no modelo ${model}` };
  }
  return { data: await resp.json() };
}

/** Fallback: use Lovable AI for text analysis when HF is unavailable */
async function fallbackLovableAI(text: string, mode: string, labels?: string[]) {
  const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_KEY) return null;

  const prompt = mode === "classification"
    ? `Classifique o texto abaixo em uma das categorias: ${(labels || []).join(", ")}.
Responda APENAS em JSON: {"label": "categoria", "confidence": 0.0-1.0, "all_scores": [{"label": "x", "score": 0.0}]}

Texto: "${text}"`
    : `Analise o sentimento do texto abaixo.
Responda APENAS em JSON: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, "all_scores": [{"label": "positive", "score": 0.0}, {"label": "negative", "score": 0.0}, {"label": "neutral", "score": 0.0}]}

Texto: "${text}"`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "Você é um classificador de texto. Responda apenas com JSON válido." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!resp.ok) {
    console.error("Lovable AI fallback error:", resp.status, await resp.text().catch(() => ""));
    return null;
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* ignore */ }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const HF_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
    const { text, mode, labels } = await req.json();
    if (!text) throw new Error("Campo 'text' é obrigatório");

    const selectedMode = mode || "sentiment";
    let output: any = null;
    let source = "huggingface";

    // Try Hugging Face first
    if (HF_KEY) {
      let body: any;
      if (selectedMode === "classification") {
        body = { inputs: text, parameters: { candidate_labels: labels || ["urgente", "informativo", "operacional", "financeiro", "reclamação"] } };
      } else {
        body = { inputs: text };
      }

      const model = selectedMode === "classification" ? MODELS.classification : MODELS.sentiment;
      const result = await callHF(model, body, HF_KEY);

      if (result.data) {
        if (selectedMode === "classification") {
          output = {
            mode: "classification",
            text,
            labels: result.data.labels,
            scores: result.data.scores,
            top_label: result.data.labels?.[0],
            top_score: result.data.scores?.[0],
          };
        } else {
          const scores = Array.isArray(result.data[0]) ? result.data[0] : result.data;
          output = {
            mode: "sentiment",
            text,
            scores,
            top: scores.reduce((a: any, b: any) => (b.score > a.score ? b : a), scores[0]),
          };
        }
      } else if (result.error === "hf_payment_required") {
        console.log("HF 402, falling back to Lovable AI");
      } else if (result.loading) {
        return new Response(JSON.stringify({ error: result.error, loading: true }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback to Lovable AI
    if (!output) {
      source = "lovable-ai";
      const aiResult = await fallbackLovableAI(text, selectedMode, labels);

      if (!aiResult) throw new Error("Nenhum serviço de IA disponível. Verifique a chave da Hugging Face.");

      if (selectedMode === "classification") {
        output = {
          mode: "classification",
          text,
          top_label: aiResult.label,
          top_score: aiResult.confidence,
          labels: aiResult.all_scores?.map((s: any) => s.label) || [aiResult.label],
          scores: aiResult.all_scores?.map((s: any) => s.score) || [aiResult.confidence],
        };
      } else {
        output = {
          mode: "sentiment",
          text,
          top: { label: aiResult.sentiment, score: aiResult.confidence },
          scores: aiResult.all_scores || [{ label: aiResult.sentiment, score: aiResult.confidence }],
        };
      }
    }

    return new Response(JSON.stringify({ ...output, source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("text-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
