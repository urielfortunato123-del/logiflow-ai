import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const HF_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
    if (!HF_KEY) throw new Error("HUGGING_FACE_API_KEY não configurada");

    const contentType = req.headers.get("content-type") || "";

    let imageBytes: Uint8Array;
    let filename = "image";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) throw new Error("Nenhum arquivo enviado");
      filename = file.name;
      imageBytes = new Uint8Array(await file.arrayBuffer());
    } else {
      // JSON with base64
      const { image_base64, filename: fn } = await req.json();
      if (!image_base64) throw new Error("image_base64 é obrigatório");
      filename = fn || filename;

      // Remove data URI prefix if present
      const raw = image_base64.replace(/^data:[^;]+;base64,/, "");
      const binary = atob(raw);
      imageBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) imageBytes[i] = binary.charCodeAt(i);
    }

    // Use microsoft/trocr-large-printed for OCR (image-to-text)
    const hfResp = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/trocr-large-printed",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${HF_KEY}` },
        body: imageBytes,
      }
    );

    if (!hfResp.ok) {
      const errText = await hfResp.text();
      console.error("HF error:", hfResp.status, errText);

      // Model loading - retry hint
      if (hfResp.status === 503) {
        return new Response(
          JSON.stringify({ error: "Modelo carregando na Hugging Face. Tente novamente em ~30s.", loading: true }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Hugging Face API erro ${hfResp.status}`);
    }

    const result = await hfResp.json();

    // trocr returns [{ generated_text: "..." }]
    let extractedText = "";
    if (Array.isArray(result)) {
      extractedText = result.map((r: any) => r.generated_text || "").join("\n");
    } else if (result.generated_text) {
      extractedText = result.generated_text;
    } else {
      extractedText = JSON.stringify(result);
    }

    return new Response(
      JSON.stringify({ extracted_text: extractedText.trim(), filename, model: "microsoft/trocr-large-printed" }),
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
