import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HF_BASE = "https://router.huggingface.co/hf-inference/models";

// Two complementary models:
// 1. OCR: extracts printed text from images
// 2. Vision: describes/understands image content
const MODELS = {
  ocr: "microsoft/trocr-large-printed",
  vision: "Salesforce/blip-image-captioning-large",
};

async function callHF(model: string, imageBytes: Uint8Array, apiKey: string): Promise<string> {
  const resp = await fetch(`${HF_BASE}/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: imageBytes,
  });

  if (resp.status === 503) {
    const body = await resp.json().catch(() => ({}));
    const wait = body.estimated_time ? Math.ceil(body.estimated_time) : 30;
    throw { loading: true, wait, model };
  }

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`HF ${model} error:`, resp.status, text);
    throw new Error(`Erro ${resp.status} no modelo ${model}`);
  }

  const result = await resp.json();

  if (Array.isArray(result)) {
    return result.map((r: any) => r.generated_text || r.caption || "").filter(Boolean).join("\n");
  }
  if (result.generated_text) return result.generated_text;
  if (result.caption) return result.caption;
  return JSON.stringify(result);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const HF_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
    if (!HF_KEY) throw new Error("HUGGING_FACE_API_KEY não configurada");

    const { image_base64, filename, mode } = await req.json();
    if (!image_base64) throw new Error("image_base64 é obrigatório");

    // Decode base64
    const raw = image_base64.replace(/^data:[^;]+;base64,/, "");
    const binary = atob(raw);
    const imageBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) imageBytes[i] = binary.charCodeAt(i);

    const selectedMode = mode || "both"; // "ocr" | "vision" | "both"

    const results: Record<string, string> = {};
    const errors: string[] = [];

    const tasks: Promise<void>[] = [];

    if (selectedMode === "ocr" || selectedMode === "both") {
      tasks.push(
        callHF(MODELS.ocr, imageBytes, HF_KEY)
          .then(t => { results.ocr = t; })
          .catch(e => {
            if (e.loading) { errors.push(`Modelo OCR carregando (~${e.wait}s). Tente novamente.`); }
            else { errors.push(`OCR: ${e.message}`); }
          })
      );
    }

    if (selectedMode === "vision" || selectedMode === "both") {
      tasks.push(
        callHF(MODELS.vision, imageBytes, HF_KEY)
          .then(t => { results.vision = t; })
          .catch(e => {
            if (e.loading) { errors.push(`Modelo de visão carregando (~${e.wait}s). Tente novamente.`); }
            else { errors.push(`Visão: ${e.message}`); }
          })
      );
    }

    await Promise.all(tasks);

    // Build combined text
    const parts: string[] = [];
    if (results.ocr) parts.push(`📝 Texto extraído (OCR):\n${results.ocr}`);
    if (results.vision) parts.push(`👁️ Descrição da imagem:\n${results.vision}`);
    if (errors.length && !parts.length) {
      return new Response(
        JSON.stringify({ error: errors.join(" | "), loading: errors.some(e => e.includes("carregando")) }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted_text = parts.join("\n\n") + (errors.length ? `\n\n⚠️ ${errors.join(" | ")}` : "");

    return new Response(
      JSON.stringify({ extracted_text, filename: filename || "image", models: Object.keys(results), errors }),
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
