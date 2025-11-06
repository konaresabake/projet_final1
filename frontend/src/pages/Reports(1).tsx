import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, TrendingUp, PieChart, Calendar } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";

const Reports = () => {
  const { projects } = useProjects();

  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = projects.reduce((acc, p) => acc + p.budgetUsed, 0);
  const avgDuration = Math.round(
    projects.reduce((acc, p) => {
      const months = (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return acc + months;
    }, 0) / projects.length
  );
  const avgPerformance = Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Rapports</h1>
              <p className="text-muted-foreground">Analyse détaillée des performances et indicateurs</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => toast.info('Export en cours...')}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget total</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(totalBudget)}</p>
                    <p className="text-xs text-success mt-1">Tous projets</p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dépenses</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(totalSpent)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((totalSpent / totalBudget) * 100)}% du budget
                    </p>
                  </div>
                  <PieChart className="h-10 w-10 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Délai moyen</p>
                    <p className="text-2xl font-bold mt-2">{avgDuration} mois</p>
                    <p className="text-xs text-muted-foreground mt-1">Durée moyenne</p>
                  </div>
                  <Calendar className="h-10 w-10 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="text-2xl font-bold mt-2">{avgPerformance}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Progression moyenne</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse budgétaire par projet</CardTitle>
              <CardDescription>Suivi des dépenses et budget restant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projects.map((item) => {
                  const percentage = Math.round((item.budgetUsed / item.budget) * 100);
                  return (
                    <div key={item.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.budgetUsed)} / {formatCurrency(item.budget)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            percentage > 85 ? 'text-destructive' : 
                            percentage > 70 ? 'text-warning' : 
                            'text-success'
                          }`}>
                            {percentage}%
                          </p>
                          <p className="text-xs text-muted-foreground">consommé</p>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Restant: {formatCurrency(item.budget - item.budgetUsed)}
                        </span>
                        <span className={`font-medium ${
                          percentage > 85 ? 'text-destructive' : 'text-success'
                        }`}>
                          {percentage > 85 ? 'Attention' : 'Conforme'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse des délais</CardTitle>
              <CardDescription>Progression temporelle des projets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projects.map((item) => {
                  const planned = Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
                  const elapsed = Math.round((Date.now() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
                  const remaining = Math.max(0, planned - elapsed);
                  const onTime = item.progress >= (elapsed / planned) * 100;
                  return (
                    <div key={item.id} className="space-y-3 p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{item.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          onTime
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {onTime ? 'Dans les délais' : 'Risque de retard'}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Durée prévue</p>
                          <p className="font-semibold">{planned} mois</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Écoulé</p>
                          <p className="font-semibold">{elapsed} mois</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Restant</p>
                          <p className="font-semibold">{remaining} mois</p>
                        </div>
                      </div>

                      <Progress value={(elapsed / planned) * 100} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Performance by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance par type</CardTitle>
                <CardDescription>Répartition des projets par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: "Éducation", projects: 8, progress: 72 },
                    { category: "Santé", projects: 5, progress: 65 },
                    { category: "Infrastructure", projects: 7, progress: 85 },
                    { category: "Administration", projects: 4, progress: 58 },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          <p className="text-sm text-muted-foreground">{item.projects} projets</p>
                        </div>
                        <p className="text-xl font-bold">{item.progress}%</p>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>KPIs clés</CardTitle>
                <CardDescription>Indicateurs de performance globaux</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Respect des délais", value: 85, target: 90 },
                    { label: "Respect du budget", value: 78, target: 85 },
                    { label: "Qualité des livrables", value: 92, target: 90 },
                    { label: "Satisfaction clients", value: 88, target: 85 },
                  ].map((kpi, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{kpi.label}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">Objectif: {kpi.target}%</p>
                          <p className={`text-xl font-bold ${
                            kpi.value >= kpi.target ? 'text-success' : 'text-warning'
                          }`}>
                            {kpi.value}%
                          </p>
                        </div>
                      </div>
                      <Progress value={kpi.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reports;
