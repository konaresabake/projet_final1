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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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
              value={`${stats.totalBudget}M€`}
              description={`${stats.budgetUsed}M€ consommés (${stats.budgetPercentage}%)`}
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
                <Link to="/projects">
                  <Button variant="ghost" size="sm">
                    Voir tout <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link to={`/projects/${project.id}`} key={project.id}>
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Distribution des statuts - Camembert */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribution des statuts projets</CardTitle>
                <CardDescription>Répartition des projets par statut</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'En cours', value: projects.filter(p => p.status === 'En cours').length, color: '#3b82f6' },
                          { name: 'Terminé', value: projects.filter(p => p.status === 'Terminé').length, color: '#10b981' },
                          { name: 'En attente', value: projects.filter(p => p.status === 'En attente').length, color: '#eab308' },
                          { name: 'Planifié', value: projects.filter(p => p.status === 'Planifié').length, color: '#8b5cf6' },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'En cours', value: projects.filter(p => p.status === 'En cours').length, color: '#3b82f6' },
                          { name: 'Terminé', value: projects.filter(p => p.status === 'Terminé').length, color: '#10b981' },
                          { name: 'En attente', value: projects.filter(p => p.status === 'En attente').length, color: '#eab308' },
                          { name: 'Planifié', value: projects.filter(p => p.status === 'Planifié').length, color: '#8b5cf6' },
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun projet</p>
                )}
              </CardContent>
            </Card>

            {/* Avancement par projet - Barres horizontales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avancement par projet</CardTitle>
                <CardDescription>Progression individuelle des projets</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={projects.slice(0, 10).map(p => ({
                        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                        fullName: p.name,
                        avancement: Math.round(p.progress)
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Avancement']}
                        labelFormatter={(label) => projects.find(p => (p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name) === label)?.name || label}
                      />
                      <Bar dataKey="avancement" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun projet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Budget et Timeline Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Évolution du budget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget par projet</CardTitle>
                <CardDescription>Comparaison des budgets alloués et utilisés</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={projects.slice(0, 8).map(p => ({
                        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                        fullName: p.name,
                        'Budget alloué': Math.round(p.budget / 1000),
                        'Budget utilisé': Math.round(p.budgetUsed / 1000)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis label={{ value: 'Montant (k€)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} k€`, '']}
                        labelFormatter={(label) => projects.find(p => (p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name) === label)?.name || label}
                      />
                      <Legend />
                      <Bar dataKey="Budget alloué" fill="#3b82f6" />
                      <Bar dataKey="Budget utilisé" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun projet</p>
                )}
              </CardContent>
            </Card>

            {/* Évolution de l'avancement dans le temps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évolution de l'avancement</CardTitle>
                <CardDescription>Progression moyenne des projets sur le temps</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={projects.slice(0, 8).map((p, index) => ({
                        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                        fullName: p.name,
                        avancement: Math.round(p.progress)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis domain={[0, 100]} label={{ value: 'Avancement (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Avancement']}
                        labelFormatter={(label) => projects.find(p => (p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name) === label)?.name || label}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avancement" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun projet</p>
                )}
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
