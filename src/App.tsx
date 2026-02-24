import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import GateQueue from "@/pages/GateQueue";
import DockBoard from "@/pages/DockBoard";
import RoutesPage from "@/pages/Routes";
import Conference from "@/pages/Conference";
import KPIs from "@/pages/KPIs";
import Incidents from "@/pages/Incidents";
import Closing from "@/pages/Closing";
import Coverage from "@/pages/Coverage";
import OCRCenter from "@/pages/OCRCenter";
import Chatbot from "@/pages/Chatbot";
import SettingsPage from "@/pages/Settings";
import TextAnalysis from "@/pages/TextAnalysis";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function LayoutRoute({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<LayoutRoute><Dashboard /></LayoutRoute>} />
          <Route path="/gate-queue" element={<LayoutRoute><GateQueue /></LayoutRoute>} />
          <Route path="/dock" element={<LayoutRoute><DockBoard /></LayoutRoute>} />
          <Route path="/routes" element={<LayoutRoute><RoutesPage /></LayoutRoute>} />
          <Route path="/conference" element={<LayoutRoute><Conference /></LayoutRoute>} />
          <Route path="/kpis" element={<LayoutRoute><KPIs /></LayoutRoute>} />
          <Route path="/incidents" element={<LayoutRoute><Incidents /></LayoutRoute>} />
          <Route path="/closing" element={<LayoutRoute><Closing /></LayoutRoute>} />
          <Route path="/coverage" element={<LayoutRoute><Coverage /></LayoutRoute>} />
          <Route path="/ocr" element={<LayoutRoute><OCRCenter /></LayoutRoute>} />
          <Route path="/chatbot" element={<LayoutRoute><Chatbot /></LayoutRoute>} />
          <Route path="/text-analysis" element={<LayoutRoute><TextAnalysis /></LayoutRoute>} />
          <Route path="/settings" element={<LayoutRoute><SettingsPage /></LayoutRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
