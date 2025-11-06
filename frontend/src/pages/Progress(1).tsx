import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";

const ProgressPage = () => {
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const filteredProjects = selectedProject === "all" 
    ? projects 
    : projects.filter(p => p.id === selectedProject);

  const completedPhases = projects.reduce((acc, project) => 
    acc + project.phases.filter(p => p.status === 'completed').length, 0
  );

  const inProgressPhases = projects.reduce((acc, project) => 
    acc + project.phases.filter(p => p.status === 'in-progress').length, 0
  );

  const delayedProjects = projects.filter(p => p.progress < 50 && p.status === 'En cours').length;

  const avgProgress = Math.round(
    projects.reduce((acc, p) => acc + p.progress, 0) / projects.length
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "active":
        return <Clock className="h-5 w-5 text-primary" />;
      case "delayed":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "active":
        return "bg-primary/10 text-primary border-primary/20";
      case "delayed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Suivi de l'avancement</h1>
              <p className="text-muted-foreground">Indicateurs de progression par projet et phase</p>
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Phases terminées</p>
                    <p className="text-3xl font-bold mt-2">{completedPhases}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En cours</p>
                    <p className="text-3xl font-bold mt-2">{inProgressPhases}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En retard</p>
                    <p className="text-3xl font-bold mt-2">{delayedProjects}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Progression moy.</p>
                    <p className="text-3xl font-bold mt-2">{avgProgress}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Progress */}
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>Progression globale du projet</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{project.progress}%</p>
                      <p className="text-sm text-muted-foreground">Achèvement</p>
                    </div>
                  </div>
                  <Progress value={project.progress} className="h-3 mt-4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Phases de construction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.phases.map((phase) => (
                        <div key={phase.id} className="p-4 rounded-lg border bg-card space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(phase.status)}
                              <span className="font-medium">{phase.name}</span>
                            </div>
                            <Badge variant="outline" className={getStatusColor(phase.status)}>
                              {phase.progress}%
                            </Badge>
                          </div>
                          <Progress value={phase.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeline Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline des projets</CardTitle>
              <CardDescription>Vue chronologique de l'avancement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 4).map((project) => {
                  const latestPhase = project.phases.sort((a, b) => 
                    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                  )[0];
                  return (
                    <div key={project.id} className="flex items-start gap-4">
                      <div className={`h-3 w-3 rounded-full mt-1 ${
                        latestPhase?.status === "completed" 
                          ? "bg-success" 
                          : latestPhase?.status === "in-progress" 
                          ? "bg-primary animate-pulse-slow" 
                          : "bg-muted-foreground"
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{latestPhase?.name} - {project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(latestPhase?.endDate || '').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProgressPage;
