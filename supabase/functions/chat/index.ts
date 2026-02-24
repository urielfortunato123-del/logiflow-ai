import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-exp:free";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY não configurada");

    let systemPrompt = `Você é o assistente LogiOps AI, especialista em operações logísticas.
Responda sempre em português brasileiro, de forma clara e profissional.
Você ajuda analistas de logística com:
- Análise de rotas e desvios
- Conferência de divergências entre sistemas
- Preparação de reuniões com transportadoras
- Geração de resumos operacionais
- Análise de KPIs de segurança e performance
- Sugestões de melhoria operacional

IMPORTANTE: Você tem acesso aos dados REAIS da operação de hoje. Use esses dados para dar respostas precisas.
Quando citar dados, seja específico (ex: "A rota MAR-001 está com 5 de 12 paradas realizadas").
Nunca invente dados — use apenas os dados fornecidos no contexto.
Mantenha respostas concisas e acionáveis.
Quando pedido para gerar tabelas, use tabelas markdown com | e ---.`;

    if (context) {
      systemPrompt += `\n\n=== DADOS REAIS DA OPERAÇÃO (${context.date || "hoje"}) ===\n`;

      if (context.dashboard_snapshot) {
        const s = context.dashboard_snapshot;
        systemPrompt += `\nRESUMO DO DASHBOARD:
- Gate Queue: ${s.total_gate_orders} veículos total | ${s.vehicles_in_queue} aguardando | ${s.at_dock || 0} em doca | ${s.loading_now} carregando | ${s.finished || 0} finalizados
- Rotas: ${s.routes_total} total | ${s.routes_planned} planejadas | ${s.routes_in_progress} em andamento | ${s.routes_done} concluídas
- Conferências: ${s.total_conferences} total | ${s.divergences} com divergência
- KPIs: ${s.total_kpis} indicadores registrados
- Incidentes: ${s.total_incidents} ocorrências\n`;
      }

      if (context.gate_orders?.length) {
        systemPrompt += `\nORDENS NO GATE (detalhe):\n`;
        context.gate_orders.forEach((o: any) => {
          systemPrompt += `- Placa ${o.plate} | Motorista: ${o.driver} | Doca: ${o.dock || "sem doca"} | Status: ${o.status}`;
          if (o.released_at) systemPrompt += ` | Liberado: ${o.released_at}`;
          if (o.loading_end_at) systemPrompt += ` | Finalizado: ${o.loading_end_at}`;
          systemPrompt += `\n`;
        });
      }

      if (context.routes?.length) {
        systemPrompt += `\nROTAS (detalhe):\n`;
        context.routes.forEach((r: any) => {
          systemPrompt += `- ${r.code} | Agência: ${r.agency} | Status: ${r.status} | Paradas: ${r.actual_stops ?? 0}/${r.planned_stops} | Tempo: ${r.actual_minutes ?? 0}/${r.planned_minutes}min | ${r.planned_km}km`;
          if (r.notes) systemPrompt += ` | Notas: ${r.notes}`;
          systemPrompt += `\n`;
        });
      }

      if (context.conferences?.length) {
        systemPrompt += `\nCONFERÊNCIAS (detalhe):\n`;
        context.conferences.forEach((c: any) => {
          systemPrompt += `- Agência: ${c.agency} | Sacas: ${c.sacks} | Cotas: ${c.cotas} | SysA: ${c.sys_a} | SysB: ${c.sys_b} | Divergente: ${c.divergent ? "SIM" : "NÃO"}`;
          if (c.reason) systemPrompt += ` | Motivo: ${c.reason}`;
          systemPrompt += `\n`;
        });
      }

      if (context.kpis?.length) {
        systemPrompt += `\nKPIs:\n`;
        context.kpis.forEach((k: any) => {
          systemPrompt += `- [${k.type}] ${k.metric}: ${k.value} ${k.unit} | Motorista: ${k.driver} | Transp: ${k.carrier}\n`;
        });
      }

      if (context.incidents?.length) {
        systemPrompt += `\nINCIDENTES:\n`;
        context.incidents.forEach((i: any) => {
          systemPrompt += `- ${i.type} | ${i.duration_min}min | Impacto: ${i.impact}`;
          if (i.notes) systemPrompt += ` | Notas: ${i.notes}`;
          systemPrompt += `\n`;
        });
      }

      if (context.closing?.length) {
        systemPrompt += `\nFECHAMENTO:\n`;
        context.closing.forEach((c: any) => {
          systemPrompt += `- Data: ${c.date} | Pacotes saídos: ${c.packages_out} | Em base: ${c.packages_in_base}\n`;
        });
      }

      systemPrompt += `\n=== FIM DOS DADOS ===`;
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) throw { status: 429, message: "Rate limit excedido. Tente novamente." };
      if (response.status === 402) throw { status: 402, message: "Créditos insuficientes." };
      throw new Error(`AI erro ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("chat error:", e);
    const status = e.status || 500;
    return new Response(JSON.stringify({ error: e.message || "Erro desconhecido" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
