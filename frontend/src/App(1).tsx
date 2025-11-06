import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectProvider } from "@/contexts/ProjectContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Progress from "./pages/Progress";
import Analysis from "./pages/Analysis";
import Documents from "./pages/Documents";
import Collaboration from "./pages/Collaboration";
import Traceability from "./pages/Traceability";
import Teams from "./pages/Teams";
import Reports from "./pages/Reports";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Projets from "./pages/Projets";
import Chantiers from "./pages/Chantiers";
import Lots from "./pages/Lots";
import Taches from "./pages/Taches";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ProjectProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/collaboration" element={<Collaboration />} />
          <Route path="/traceability" element={<Traceability />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/projets" element={<Projets />} />
          <Route path="/projets/:projetId/chantiers" element={<Chantiers />} />
          <Route path="/projets/:projetId/chantiers/:chantierId/lots" element={<Lots />} />
          <Route path="/projets/:projetId/chantiers/:chantierId/lots/:lotId/taches" element={<Taches />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ProjectProvider>
  </QueryClientProvider>
);

export default App;
