import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ClientConfigProvider } from "@/contexts/ClientConfigContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ClientChat from "./pages/ClientChat";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";

const queryClient = new QueryClient();

// Wrapper to conditionally apply ClientConfigProvider only for chat routes
const ChatRoutes = () => (
  <ClientConfigProvider>
    <Routes>
      <Route path="/" element={<ClientChat />} />
      <Route path="/legacy" element={<Index />} />
    </Routes>
  </ClientConfigProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
          <Route path="/admin/*" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
          <Route path="/*" element={<ChatRoutes />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
