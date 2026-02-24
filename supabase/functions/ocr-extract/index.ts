import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HF_BASE = "https://router.huggingface.co/hf-inference/models";

const MODELS = {
  ocr: "microsoft/trocr-large-printed",
  vision: "Salesforce/blip-image-captioning-large",
};

async function callHF(model: string, imageBytes: Uint8Array, apiKey: string): Promise<{ data?: string; error?: string; loading?: boolean }> {
  const resp = await fetch(`${HF_BASE}/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: imageBytes,
  });

  if (resp.status === 503) {
    const body = await resp.json().catch(() => ({}));
    return { error: `Modelo carregando (~${Math.ceil(body.estimated_time || 30)}s)`, loading: true };
  }
  if (resp.status === 402) return { error: "hf_payment_required" };
  if (!resp.ok) {
    console.error(`HF ${model}:`, resp.status, await resp.text().catch(() => ""));
    return { error: `HF erro ${resp.status}` };
  }

  const result = await resp.json();
  if (Array.isArray(result)) {
    return { data: result.map((r: any) => r.generated_text || r.caption || "").filter(Boolean).join("\n") };
  }
  return { data: result.generated_text || result.caption || JSON.stringify(result) };
}

/** Fallback: use Lovable AI Gemini vision to extract text from image */
async function fallbackVisionAI(imageBase64: string, filename: string): Promise<string | null> {
  const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_KEY) return null;

  // Ensure proper data URI format
  let dataUri = imageBase64;
  if (!dataUri.startsWith("data:")) {
    dataUri = `data:image/png;base64,${dataUri}`;
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia TODO o texto visível nesta imagem (arquivo: ${filename}). 
Transcreva o texto exatamente como aparece, mantendo a formatação e estrutura.
Se houver tabelas, reproduza-as com alinhamento.
Se não houver texto, descreva o conteúdo visual da imagem.
Responda APENAS com o conteúdo extraído, sem explicações.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUri },
            },
          ],
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!resp.ok) {
    console.error("Lovable AI vision fallback error:", resp.status, await resp.text().catch(() => ""));
    return null;
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_base64, filename, mode } = await req.json();
    if (!image_base64) throw new Error("image_base64 é obrigatório");

    const HF_KEY = Deno.env.get("HUGGING_FACE_API_KEY");

    // Decode image for HF calls
    const raw = image_base64.replace(/^data:[^;]+;base64,/, "");
    const binary = atob(raw);
    const imageBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) imageBytes[i] = binary.charCodeAt(i);

    const selectedMode = mode || "both";
    const results: Record<string, string> = {};
    const errors: string[] = [];
    let hfFailed = false;

    // Try HF first
    if (HF_KEY) {
      const tasks: Promise<void>[] = [];

      if (selectedMode === "ocr" || selectedMode === "both") {
        tasks.push(
          callHF(MODELS.ocr, imageBytes, HF_KEY).then(r => {
            if (r.data) results.ocr = r.data;
            else if (r.error === "hf_payment_required") hfFailed = true;
            else if (r.loading) errors.push(`OCR: ${r.error}`);
            else errors.push(`OCR: ${r.error}`);
          })
        );
      }

      if (selectedMode === "vision" || selectedMode === "both") {
        tasks.push(
          callHF(MODELS.vision, imageBytes, HF_KEY).then(r => {
            if (r.data) results.vision = r.data;
            else if (r.error === "hf_payment_required") hfFailed = true;
            else if (r.loading) errors.push(`Visão: ${r.error}`);
            else errors.push(`Visão: ${r.error}`);
          })
        );
      }

      await Promise.all(tasks);
    } else {
      hfFailed = true;
    }

    // Fallback to Lovable AI vision if HF unavailable
    if (hfFailed && !results.ocr && !results.vision) {
      console.log("HF unavailable, using Lovable AI vision fallback");
      const aiText = await fallbackVisionAI(image_base64, filename || "image");
      if (aiText) {
        results.ai_vision = aiText;
      } else {
        errors.push("Nenhum serviço de IA disponível");
      }
    }

    // Build output
    const parts: string[] = [];
    if (results.ocr) parts.push(`📝 Texto extraído (OCR):\n${results.ocr}`);
    if (results.vision) parts.push(`👁️ Descrição da imagem:\n${results.vision}`);
    if (results.ai_vision) parts.push(`🤖 Extração via IA (Gemini Vision):\n${results.ai_vision}`);

    if (!parts.length) {
      const allLoading = errors.some(e => e.includes("carregando"));
      return new Response(
        JSON.stringify({ error: errors.join(" | ") || "Falha na extração", loading: allLoading }),
        { status: allLoading ? 503 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted_text = parts.join("\n\n") + (errors.length ? `\n\n⚠️ ${errors.join(" | ")}` : "");
    const source = results.ai_vision ? "lovable-ai" : "huggingface";

    return new Response(
      JSON.stringify({ extracted_text, filename: filename || "image", models: Object.keys(results), source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ocr-extract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
