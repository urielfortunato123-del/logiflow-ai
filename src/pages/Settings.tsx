import { useState } from "react";
import { Settings, Bot, Palette, Bell, Database, Save, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const SETTINGS_KEY = "logiops_settings";

function loadSettings(): Partial<AppSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

interface AppSettings {
  ai_provider: "openrouter" | "huggingface" | "lovable";
  ai_model: string;
  theme: "dark" | "light" | "system";
  language: "pt-BR" | "en";
  notifications: boolean;
  auto_ocr: boolean;
  max_pdf_pages: number;
  chatbot_context: boolean;
}

const defaultSettings: AppSettings = {
  ai_provider: "openrouter",
  ai_model: "google/gemma-3n-e4b-it:free",
  theme: "dark",
  language: "pt-BR",
  notifications: true,
  auto_ocr: true,
  max_pdf_pages: 10,
  chatbot_context: true,
};

const AI_MODELS: Record<string, { label: string; models: { value: string; label: string; free?: boolean }[] }> = {
  openrouter: {
    label: "OpenRouter",
    models: [
      { value: "google/gemma-3n-e4b-it:free", label: "Gemma 3n 4B (Free)", free: true },
      { value: "google/gemma-3-27b-it:free", label: "Gemma 3 27B (Free)", free: true },
      { value: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick (Free)", free: true },
      { value: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3 (Free)", free: true },
      { value: "qwen/qwen3-235b-a22b:free", label: "Qwen 3 235B (Free)", free: true },
    ],
  },
  huggingface: {
    label: "Hugging Face",
    models: [
      { value: "microsoft/trocr-large-printed", label: "TrOCR Large (OCR)" },
      { value: "Salesforce/blip-image-captioning-large", label: "BLIP (Visão)" },
      { value: "tabularisai/multilingual-sentiment-analysis", label: "Sentiment Analysis" },
    ],
  },
  lovable: {
    label: "Lovable AI",
    models: [
      { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
    ],
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...defaultSettings,
    ...loadSettings(),
  }));
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    saveSettings(settings);
    setSaved(true);
    toast.success("Configurações salvas!");
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    toast.success("Configurações restauradas ao padrão");
  };

  const providerModels = AI_MODELS[settings.ai_provider]?.models || [];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Configurações</h1>
            <p className="text-xs text-muted-foreground">Gerencie preferências do sistema</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Restaurar
          </button>
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Salvo!" : "Salvar"}
          </button>
        </div>
      </div>

      {/* AI Configuration */}
      <section className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bot className="h-4 w-4 text-primary" /> Inteligência Artificial
        </div>

        <div className="grid gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Provedor principal</label>
            <select
              value={settings.ai_provider}
              onChange={e => {
                const provider = e.target.value as AppSettings["ai_provider"];
                update("ai_provider", provider);
                update("ai_model", AI_MODELS[provider].models[0].value);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
            >
              {Object.entries(AI_MODELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Modelo</label>
            <select
              value={settings.ai_model}
              onChange={e => update("ai_model", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
            >
              {providerModels.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label} {m.free ? "✨" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {settings.ai_provider === "openrouter" && "Modelos gratuitos marcados com ✨"}
              {settings.ai_provider === "huggingface" && "Requer créditos na Hugging Face"}
              {settings.ai_provider === "lovable" && "Requer créditos Lovable AI"}
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Contexto operacional no chatbot</p>
              <p className="text-xs text-muted-foreground">Enviar dados reais da operação ao assistente</p>
            </div>
            <button
              onClick={() => update("chatbot_context", !settings.chatbot_context)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.chatbot_context ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.chatbot_context ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* OCR Configuration */}
      <section className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Database className="h-4 w-4 text-primary" /> OCR & Documentos
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">OCR automático</p>
              <p className="text-xs text-muted-foreground">Extrair texto automaticamente ao enviar imagens</p>
            </div>
            <button
              onClick={() => update("auto_ocr", !settings.auto_ocr)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.auto_ocr ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.auto_ocr ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Máximo de páginas PDF</label>
            <select
              value={settings.max_pdf_pages}
              onChange={e => update("max_pdf_pages", Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
            >
              {[5, 10, 15, 20, 30, 50].map(n => (
                <option key={n} value={n}>{n} páginas</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Palette className="h-4 w-4 text-primary" /> Aparência
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tema</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "dark", label: "Escuro" },
              { value: "light", label: "Claro" },
              { value: "system", label: "Sistema" },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => update("theme", t.value as AppSettings["theme"])}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  settings.theme === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Idioma</label>
          <select
            value={settings.language}
            onChange={e => update("language", e.target.value as AppSettings["language"])}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
          >
            <option value="pt-BR">Português (BR)</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bell className="h-4 w-4 text-primary" /> Notificações
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Notificações do sistema</p>
            <p className="text-xs text-muted-foreground">Alertas de incidentes, divergências e desvios</p>
          </div>
          <button
            onClick={() => update("notifications", !settings.notifications)}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.notifications ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.notifications ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </section>

      {/* Status */}
      <section className="glass-card rounded-lg p-5">
        <p className="text-xs text-muted-foreground text-center">
          LogiOps AI v1.0 • Provedor: <span className="text-foreground font-medium">{AI_MODELS[settings.ai_provider]?.label}</span> • Modelo: <span className="text-foreground font-medium">{settings.ai_model}</span>
        </p>
      </section>
    </div>
  );
}
