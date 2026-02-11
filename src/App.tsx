import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ErrorBoundary from "@/components/ErrorBoundary";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import OfflineIndicator from "@/components/OfflineIndicator";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import Dashboard from "./pages/Dashboard";
import HomefolioEdit from "./pages/HomefolioEdit";
import ClientView from "./pages/ClientView";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ShowingHub from "./pages/ShowingHub";
import SessionDetail from "./pages/SessionDetail";
import PublicSession from "./pages/PublicSession";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import ManageUsers from "./pages/ManageUsers";
import Welcome from "./pages/Welcome";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPromptBanner />
        <OfflineIndicator />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/install" element={<Install />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/homefolio/:id" element={<HomefolioEdit />} />
            <Route path="/view/:link" element={<ClientView />} />
            {/* Showing Sessions Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/welcome/:token" element={<Welcome />} />
            <Route path="/admin/showings" element={<ShowingHub />} />
            <Route path="/admin/session/:id" element={<SessionDetail />} />
            <Route path="/s/:token" element={<PublicSession />} />
            
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/manage-users" element={<ManageUsers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
