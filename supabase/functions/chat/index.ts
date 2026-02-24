import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");
    // Build system prompt with logistics context
    let systemPrompt = `Você é o assistente LogiOps AI, especialista em operações logísticas. 
Responda sempre em português brasileiro, de forma clara e profissional.
Você ajuda analistas de logística com:
- Análise de rotas e desvios
- Conferência de divergências entre sistemas
- Preparação de reuniões com transportadoras
- Geração de resumos operacionais
- Análise de KPIs de segurança e performance
- Sugestões de melhoria operacional

Quando citar dados, referencie a fonte (ex: "Baseado na conferência #123 de 24/02/2026...").
Nunca invente dados — se não tiver a informação, diga que precisa verificar.
Mantenha respostas concisas e acionáveis.`;

    if (context) {
      systemPrompt += `\n\nContexto atual da operação (${context.date || "hoje"}):\n`;
      if (context.dashboard_snapshot) {
        systemPrompt += `Dashboard: ${JSON.stringify(context.dashboard_snapshot)}\n`;
      }
      if (context.selected_entity) {
        systemPrompt += `Entidade selecionada: ${JSON.stringify(context.selected_entity)}\n`;
      }
      if (context.attachments?.length) {
        systemPrompt += `Anexos disponíveis: ${context.attachments.map((a: any) => a.extracted_text || "").join("\n")}\n`;
      }
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it:free",
        messages: [
          { role: "user", content: `[Instruções do sistema - siga rigorosamente]\n${systemPrompt}` },
          ...messages,
        ],
        stream: true,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos em Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
