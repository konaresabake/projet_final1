import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/contexts/ProjectContext';
import { Building2, TrendingUp, AlertCircle, CheckCircle, Clock, Euro, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { projects, activities } = useProjects();

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'En cours').length;
    const completedProjects = projects.filter(p => p.status === 'Terminé').length;
    const delayedProjects = projects.filter(p => {
      const endDate = new Date(p.endDate);
      const today = new Date();
      return endDate < today && p.status !== 'Terminé';
    }).length;
    
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalBudgetUsed = projects.reduce((sum, p) => sum + p.budgetUsed, 0);
    const budgetPercentage = totalBudget > 0 ? (totalBudgetUsed / totalBudget) * 100 : 0;
    
    const avgProgress = projects.length > 0 
      ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length 
      : 0;

    return {
      activeProjects,
      completedProjects,
      delayedProjects,
      totalBudget: (totalBudget / 1000000).toFixed(1),
      budgetUsed: (totalBudgetUsed / 1000000).toFixed(1),
      budgetPercentage: budgetPercentage.toFixed(1),
      avgProgress: avgProgress.toFixed(0),
    };
  }, [projects]);

  const recentProjects = projects
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 4);

  const recentActivities = activities.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-blue-500';
      case 'Terminé': return 'bg-green-500';
      case 'En attente': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Tableau de bord</h1>
            <p className="text-muted-foreground">Vue d'ensemble de vos projets de construction</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Projets actifs"
              value={stats.activeProjects.toString()}
              description={`${stats.completedProjects} terminés`}
              icon={Building2}
              trend="up"
            />
            <StatCard
              title="Avancement moyen"
              value={`${stats.avgProgress}%`}
              description="Sur tous les projets"
              icon={TrendingUp}
              trend="up"
            />
            <StatCard
              title="Budget total"
              value={`${stats.totalBudget}MXOF`}
              description={`${stats.budgetUsed}MXOF consommés (${stats.budgetPercentage}%)`}
              icon={Euro}
            />
            <StatCard
              title="Retards"
              value={stats.delayedProjects.toString()}
              description="Projets en retard"
              icon={AlertCircle}
              trend={stats.delayedProjects > 0 ? "down" : "up"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Projets récents</CardTitle>
                  <CardDescription>Vos derniers projets en cours</CardDescription>
                </div>
                <Link to="/projets">
                  <Button variant="ghost" size="sm">
                    Voir tout <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link to={`/projets/${project.id}/chantiers`} key={project.id}>
                      <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{project.name}</h3>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                            {project.location}
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Avancement</span>
                              <span className="font-semibold">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activités récentes</CardTitle>
                <CardDescription>Dernières modifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-1">
                        {activity.type === 'update' && <Clock className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'milestone' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {activity.type === 'document' && <Building2 className="h-4 w-4 text-purple-500" />}
                        {activity.type === 'comment' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.user} • {new Date(activity.timestamp).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Phases en cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {projects.reduce((sum, p) => sum + p.phases.filter(ph => ph.status === 'in-progress').length, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">phases actives</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg">Phases terminées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {projects.reduce((sum, p) => sum + p.phases.filter(ph => ph.status === 'completed').length, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">phases complétées</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {projects.reduce((sum, p) => sum + p.documents.length, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">fichiers partagés</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
