import { Lock, Truck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Truck className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">LogiOps AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Plataforma de Operações Logísticas</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card rounded-lg p-6 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="analista@empresa.com"
              className="w-full px-4 py-2.5 rounded-lg ops-input text-sm border"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg ops-input text-sm border"
              required
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" /> Entrar
          </button>
          <p className="text-xs text-center text-muted-foreground">Esqueceu a senha? Contate o administrador.</p>
        </form>
      </div>
    </div>
  );
}
