import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { OnboardingTour } from "@/components/OnboardingTour";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Truck, Container, MapPin, FileCheck, BarChart3, AlertTriangle,
  FileText, MessageSquare, Upload, Settings, Menu, X, ChevronLeft, LogOut, Compass, Brain, CarFront
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/gate-queue", label: "Fila / Pátio", icon: Truck },
  { path: "/fleet", label: "Frota", icon: CarFront },
  { path: "/dock", label: "Docas", icon: Container },
  { path: "/routes", label: "Rotas", icon: MapPin },
  { path: "/conference", label: "Conferência", icon: FileCheck },
  { path: "/kpis", label: "KPIs", icon: BarChart3 },
  { path: "/incidents", label: "Incidentes", icon: AlertTriangle },
  { path: "/closing", label: "Fechamento", icon: FileText },
  { path: "/coverage", label: "Cobertura", icon: Compass },
  { path: "/ocr", label: "OCR Center", icon: Upload },
  { path: "/text-analysis", label: "Análise de Texto", icon: Brain },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 lg:relative",
        collapsed ? "w-16" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md gradient-primary flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground tracking-tight">LogiOps AI</span>
            </div>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground">
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Config</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md hover:bg-accent lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {navItems.find(i => i.path === location.pathname)?.label ?? "LogiOps"}
              </h2>
              <p className="text-xs text-muted-foreground">24 Fev 2026 • Marília-SP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/chatbot" className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground relative">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            </NavLink>
            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              AS
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <OnboardingTour />
    </div>
  );
}
