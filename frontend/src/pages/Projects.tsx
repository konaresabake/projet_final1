import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm, ProjectFormData } from '@/components/projects/ProjectForm';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { useProjects } from '@/contexts/ProjectContext';
import { Plus, MapPin, Calendar, Euro, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const Projects = () => {
  const { projects, addProject, loading } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      await addProject({
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        budget: data.budget,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        manager: data.manager,
      });
      setIsDialogOpen(false);
      toast.success('Projet créé avec succès!');
    } catch (error) {
      toast.error('Erreur lors de la création du projet');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-blue-500';
      case 'Terminé': return 'bg-green-500';
      case 'En attente': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Haute': return 'destructive';
      case 'Moyenne': return 'default';
      case 'Basse': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Projets</h1>
              <p className="text-muted-foreground">
                {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} trouvé{filteredProjects.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Projet
            </Button>
          </div>

          <div className="mb-6">
            <ProjectFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="h-full animate-pulse">
                  <CardHeader>
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="mt-3 h-6 w-3/4 bg-muted rounded" />
                    <div className="mt-2 h-4 w-full bg-muted rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-3 bg-muted rounded" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
              <Link to={`/projects/${project.id}`} key={project.id}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avancement</span>
                        <span className="font-semibold">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{project.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.startDate).toLocaleDateString('fr-FR')} - {new Date(project.endDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4" />
                        <span>{(project.budget / 1000000).toFixed(1)}MXOF</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Chef: {project.manager}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              ))}
            </div>
          )}

          {!loading && filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Aucun projet trouvé</p>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Créer votre premier projet
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
