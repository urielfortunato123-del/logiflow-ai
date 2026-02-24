import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Truck, Container, MapPin, FileCheck, BarChart3,
  AlertTriangle, FileText, Compass, Upload, Brain, MessageSquare,
  Settings, ChevronRight, ChevronLeft, X, Sparkles, Rocket
} from "lucide-react";

interface TourStep {
  route: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  tips: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    route: "/",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Visão geral em tempo real de toda a operação logística. Acompanhe veículos, rotas, conferências e KPIs em um só lugar.",
    tips: ["Os cards mostram métricas ao vivo", "Clique nos cards para ir ao módulo detalhado"],
  },
  {
    route: "/gate-queue",
    title: "Fila / Pátio",
    icon: Truck,
    description: "Gerencie a fila de veículos no portão. Controle a entrada, liberação, carregamento e saída de cada veículo.",
    tips: ["Use '+ Nova Ordem' para registrar veículos", "Avance o status com os botões de ação", "Use 'Sugerir com IA' para gerar observações automáticas"],
  },
  {
    route: "/dock",
    title: "Docas",
    icon: Container,
    description: "Visualize a ocupação das docas em tempo real. Veja quais estão livres, ocupadas ou em manutenção.",
    tips: ["Clique na doca para ver detalhes do veículo", "Cores indicam o status: verde (livre), azul (ocupada)"],
  },
  {
    route: "/routes",
    title: "Rotas",
    icon: MapPin,
    description: "Acompanhe todas as rotas de entrega. Monitore paradas realizadas, tempo decorrido e desvios.",
    tips: ["Filtre por status: planejada, em andamento, concluída", "A IA pode sugerir notas sobre desvios de rota"],
  },
  {
    route: "/conference",
    title: "Conferência",
    icon: FileCheck,
    description: "Compare dados entre sistemas (Sys A vs Sys B). Identifique divergências em sacas, cotas e pedidos.",
    tips: ["Divergências são destacadas automaticamente", "Registre o motivo da divergência para auditoria"],
  },
  {
    route: "/kpis",
    title: "KPIs",
    icon: BarChart3,
    description: "Indicadores de performance: entregas/hora, velocidade, frenagem brusca e mais. Acompanhe motoristas e transportadoras.",
    tips: ["Compare performance entre motoristas", "Use os dados para reuniões com transportadoras"],
  },
  {
    route: "/incidents",
    title: "Incidentes",
    icon: AlertTriangle,
    description: "Registre ocorrências operacionais: atrasos, simulados de incêndio, acidentes e seus impactos na operação.",
    tips: ["Classifique por tipo e impacto", "A IA ajuda a redigir relatórios de ocorrência"],
  },
  {
    route: "/closing",
    title: "Fechamento",
    icon: FileText,
    description: "Relatório diário de fechamento: pacotes expedidos, volume em base, e resumo geral da operação.",
    tips: ["Gere o relatório ao final de cada turno", "Histórico fica salvo para consulta"],
  },
  {
    route: "/coverage",
    title: "Cobertura",
    icon: Compass,
    description: "Mapa de cobertura das agências e cidades atendidas. Visualize a abrangência geográfica da operação.",
    tips: ["Filtre por agência ou região", "Veja quais cidades são atendidas"],
  },
  {
    route: "/ocr",
    title: "OCR Center",
    icon: Upload,
    description: "Extraia texto de imagens e PDFs automaticamente com IA. Ideal para digitalizar CTes, notas fiscais e documentos.",
    tips: ["Arraste arquivos ou cole imagens", "A IA interpreta o conteúdo extraído"],
  },
  {
    route: "/text-analysis",
    title: "Análise de Texto",
    icon: Brain,
    description: "Analise sentimento e classifique textos com IA. Útil para avaliar feedbacks, reclamações e comunicações.",
    tips: ["Escolha entre Sentimento e Classificação", "Powered by Gemma 3n via OpenRouter"],
  },
  {
    route: "/chatbot",
    title: "Assistente IA",
    icon: MessageSquare,
    description: "Chat inteligente com acesso aos dados reais da operação. Pergunte sobre rotas, divergências, KPIs e mais.",
    tips: ["A IA conhece todos os dados do dia", "Peça resumos, análises e preparação de reuniões"],
  },
  {
    route: "/settings",
    title: "Configurações",
    icon: Settings,
    description: "Personalize o sistema: provedor de IA, modelo, tema, idioma, notificações e preferências de OCR.",
    tips: ["Troque o modelo de IA a qualquer momento", "Configurações são salvas localmente"],
  },
];

const TOUR_KEY = "logiops_tour_completed";

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Show tour on first visit
  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done && location.pathname === "/") {
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    setActive(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  const goTo = (index: number) => {
    setStep(index);
    navigate(TOUR_STEPS[index].route);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) goTo(step + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) goTo(step - 1);
  };

  if (!active) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto" onClick={close} />

      {/* Card */}
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 rounded-xl border border-border bg-card shadow-2xl pointer-events-auto animate-fade-in-up overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Rocket className="h-3.5 w-3.5 text-primary" />
            Tour LogiOps • {step + 1}/{TOUR_STEPS.length}
          </div>
          <button onClick={close} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{current.title}</h3>
              <p className="text-xs text-muted-foreground">{current.route}</p>
            </div>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            {current.description}
          </p>

          <div className="space-y-1.5 mb-4">
            {current.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1 px-5 pb-3">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <button
            onClick={close}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular tour
          </button>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              {step < TOUR_STEPS.length - 1 ? (
                <>Próximo <ChevronRight className="h-3.5 w-3.5" /></>
              ) : (
                <>Concluir <Rocket className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Button to restart the tour from settings or anywhere */
export function StartTourButton() {
  const navigate = useNavigate();

  const start = () => {
    localStorage.removeItem(TOUR_KEY);
    navigate("/");
    window.location.reload();
  };

  return (
    <button
      onClick={start}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
    >
      <Rocket className="h-4 w-4 text-primary" /> Iniciar Tour Guiado
    </button>
  );
}
