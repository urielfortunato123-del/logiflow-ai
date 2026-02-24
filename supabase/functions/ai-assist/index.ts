import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMMA_MODEL = "google/gemma-3n-e4b-it:free";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { module, fields, field_target } = await req.json();
    const OR_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OR_KEY) throw new Error("OPENROUTER_API_KEY não configurada");

    const systemPrompt = `Você é um assistente de operações logísticas (LogiOps AI).
Sua tarefa é ajudar o usuário a preencher campos de formulários com textos profissionais e concisos.
Baseie-se nos dados já preenchidos para gerar sugestões relevantes.
Responda APENAS com o texto sugerido, sem explicações adicionais.
Mantenha o texto curto (1-3 frases), profissional e em português brasileiro.`;

    const userPrompt = `Módulo: ${module}
Dados preenchidos: ${JSON.stringify(fields)}
Campo alvo: ${field_target}

Gere um texto profissional e conciso para o campo "${field_target}" baseado nos dados acima.`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: [
          { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("OpenRouter error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ suggestion: text.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
