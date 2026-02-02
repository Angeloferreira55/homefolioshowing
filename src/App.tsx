import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import Dashboard from "./pages/Dashboard";
import HomefolioEdit from "./pages/HomefolioEdit";
import ClientView from "./pages/ClientView";
import Auth from "./pages/Auth";
import ShowingHub from "./pages/ShowingHub";
import SessionDetail from "./pages/SessionDetail";
import PublicSession from "./pages/PublicSession";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/homefolio/:id" element={<HomefolioEdit />} />
          <Route path="/view/:link" element={<ClientView />} />
          {/* Showing Sessions Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/showings" element={<ShowingHub />} />
          <Route path="/admin/session/:id" element={<SessionDetail />} />
          <Route path="/s/:token" element={<PublicSession />} />
          
          <Route path="/admin/profile" element={<Profile />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
