import { useState } from "react";
import { Send, Sparkles, X, Maximize2, Minimize2 } from "lucide-react";
import { ChatMessage } from "@/types/domain";

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", role: "assistant", content: "Olá! Sou o assistente LogiOps AI. Posso ajudar com análise de rotas, conferências, preparação de reuniões e muito mais. Como posso ajudar?", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(input),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="glass-card rounded-lg flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">LogiOps AI Assistant</p>
            <p className="text-xs text-muted-foreground">Contexto: Operações de hoje • Marília-SP</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Pergunte sobre operações, rotas, divergências..."
              className="flex-1 px-4 py-2.5 rounded-lg ops-input text-sm border"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("rota") || lower.includes("route")) {
    return "📊 Baseado nos dados de hoje:\n\n• MAR-001: Em andamento, 38/45 paradas (84%), tempo dentro do esperado\n• BAU-015: Planejada, aguardando saída (caminhão atrasou 1.5h — incidente registrado)\n• MAR-003: Concluída com sucesso, 25/25 paradas\n• ASS-007: Em andamento, 22/30 paradas — motorista reportou trânsito intenso\n• OUR-012: Concluída, 50/50 paradas\n\nSugestão: Acompanhar ASS-007 e verificar plano alternativo para BAU-015.";
  }
  if (lower.includes("divergência") || lower.includes("conferência")) {
    return "⚠️ Divergência detectada na conferência #c2 (Bauru Hub):\n\n• Sistema A: 245 pedidos\n• Sistema B: 241 pedidos\n• Diferença: 4 pedidos\n\nPossíveis causas:\n1. Sincronização tardia entre sistemas\n2. Cancelamentos não refletidos\n3. Erro de digitação\n\nRecomendação: Verificar os 4 pedidos faltantes no Sistema B e confirmar status no WMS.";
  }
  if (lower.includes("reunião") || lower.includes("meeting") || lower.includes("agenda")) {
    return "📋 Agenda sugerida para reunião de rotas:\n\n1. **Status do dia** — 5 rotas, 3 concluídas, 2 em andamento\n2. **Incidentes** — Simulado incêndio (40min) + atraso TransLog (90min)\n3. **Divergência Bauru** — 4 pedidos faltantes, pendente resolução\n4. **Treinamentos** — 2 motoristas com treinamento pendente (TransLog)\n5. **Plano amanhã** — Redistribuir volume de BAU-015 se atraso persistir\n\nDeseja que eu gere um e-mail com estes pontos?";
  }
  return "Entendido! Analisei os dados de operações de hoje. Há 2 rotas em andamento, 1 divergência pendente na conferência, e 2 incidentes registrados. Posso detalhar qualquer um desses pontos. O que gostaria de saber?";
}
