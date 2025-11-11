import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Download, TrendingUp, PieChart, Calendar, FileText, AlertTriangle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import { useProjets } from "@/hooks/useProjets";
import { useBudgets } from "@/hooks/useBudgets";
import { useRapports } from "@/hooks/useRapports";
import { useAlertes } from "@/hooks/useAlertes";

const Reports = () => {
  const { projects, refreshProjects } = useProjects();
  const { projets: apiProjets, refreshProjets } = useProjets();
  const { budgets, loading: budgetsLoading, refreshBudgets } = useBudgets();
  const { rapports, loading: rapportsLoading, addRapport, refreshRapports } = useRapports();
  const { alertes, loading: alertesLoading, refreshAlertes } = useAlertes();
  const location = useLocation();

  // Rafraîchir les données quand on arrive sur la page (une seule fois)
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshProjects();
      refreshProjets();
      refreshBudgets();
      refreshRapports();
      refreshAlertes();
    }, 100); // Petit délai pour éviter les requêtes multiples

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Retirer les dépendances de fonctions pour éviter les boucles

  const normalizedProjects = useMemo(() => {
    if (apiProjets.length > 0) {
      return apiProjets.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        budget: Number(project.budget ?? 0),
        budgetUsed: 0,
        startDate: project.start_date ?? new Date().toISOString(),
        endDate: project.end_date ?? new Date().toISOString(),
        progress: 0,
        location: project.location ?? "",
      }));
    }

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      budget: project.budget,
      budgetUsed: project.budgetUsed,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: project.progress,
      location: project.location,
    }));
  }, [apiProjets, projects]);

  const projectNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    normalizedProjects.forEach((project) => map.set(project.id, project.name));
    apiProjets.forEach((project) => map.set(project.id, project.name));
    return map;
  }, [apiProjets, normalizedProjects]);

  const totalBudgetFallback = normalizedProjects.reduce((acc, p) => acc + (p.budget ?? 0), 0);
  const totalSpentFallback = normalizedProjects.reduce((acc, p) => acc + (p.budgetUsed ?? 0), 0);
  const avgDuration = normalizedProjects.length
    ? Math.round(
        normalizedProjects.reduce((acc, p) => {
          const months = (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
          return acc + months;
        }, 0) / normalizedProjects.length
      )
    : 0;
  const avgPerformance = normalizedProjects.length
    ? Math.round(normalizedProjects.reduce((acc, p) => acc + (p.progress ?? 0), 0) / normalizedProjects.length)
    : 0;

  const budgetTotals = useMemo(() => {
    if (budgets.length > 0) {
      const total = budgets.reduce((acc, budget) => acc + Number(budget.montant_prev), 0);
      const spent = budgets.reduce((acc, budget) => acc + Number(budget.montant_depense), 0);
      return { total, spent };
    }
    return { total: totalBudgetFallback, spent: totalSpentFallback };
  }, [budgets, totalBudgetFallback, totalSpentFallback]);

  const budgetRows = useMemo(() => {
    if (budgets.length > 0) {
      return budgets.map((budget) => ({
        id: budget.id,
        name: projectNameLookup.get(budget.projet_id) ?? `Projet ${budget.projet_id.slice(0, 8)}`,
        total: Number(budget.montant_prev),
        spent: Number(budget.montant_depense),
      }));
    }

    return normalizedProjects.map((project) => ({
      id: project.id,
      name: project.name,
      total: project.budget,
      spent: project.budgetUsed,
    }));
  }, [budgets, normalizedProjects, projectNameLookup]);

  const [rapportForm, setRapportForm] = useState({ projet: "", titre: "", contenu: "" });
  const [isRapportDialogOpen, setIsRapportDialogOpen] = useState(false);

  const totalBudget = budgetTotals.total;
  const totalSpent = budgetTotals.spent;
  const budgetPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const availableProjects = normalizedProjects;
  const latestRapports = rapports.slice(0, 5);
  const latestAlertes = alertes.slice(0, 5);

  const handleCreateRapport = async () => {
    if (!rapportForm.projet || !rapportForm.titre || !rapportForm.contenu) {
      toast.error('Veuillez renseigner tous les champs');
      return;
    }

    try {
      await addRapport({
        projet: rapportForm.projet,
        titre: rapportForm.titre,
        contenu: rapportForm.contenu,
      });
      // Rafraîchir toutes les données pour synchroniser
      await Promise.all([
        refreshRapports(),
        refreshProjects(),
        refreshProjets(),
      ]);
      toast.success('Rapport généré');
      setRapportForm({ projet: "", titre: "", contenu: "" });
      setIsRapportDialogOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la création du rapport');
    }
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(safeAmount);
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch (error) {
      return date;
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Projet', 'Budget Total', 'Dépenses', 'Pourcentage', 'Restant'];
      const rows = budgetRows.map(item => [
        item.name,
        formatCurrency(item.total),
        formatCurrency(item.spent),
        `${Math.round((item.spent / item.total) * 100)}%`,
        formatCurrency(item.total - item.spent)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapports_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export CSV réussi');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportToExcel = () => {
    try {
      // Créer un fichier CSV qui peut être ouvert dans Excel
      const headers = ['Projet', 'Budget Total', 'Dépenses', 'Pourcentage', 'Restant', 'Date'];
      const rows = budgetRows.map(item => [
        item.name,
        item.total.toString(),
        item.spent.toString(),
        Math.round((item.spent / item.total) * 100).toString(),
        (item.total - item.spent).toString(),
        new Date().toLocaleDateString('fr-FR')
      ]);

      const csvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapports_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const exportToPDF = () => {
    try {
      // Créer un contenu HTML pour le PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Rapport - ${new Date().toLocaleDateString('fr-FR')}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Rapport des Projets</h1>
            <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
            <table>
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Budget Total</th>
                  <th>Dépenses</th>
                  <th>Pourcentage</th>
                  <th>Restant</th>
                </tr>
              </thead>
              <tbody>
                ${budgetRows.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${formatCurrency(item.total)}</td>
                    <td>${formatCurrency(item.spent)}</td>
                    <td>${Math.round((item.spent / item.total) * 100)}%</td>
                    <td>${formatCurrency(item.total - item.spent)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapports_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export HTML réussi (ouvrez dans votre navigateur et imprimez en PDF)');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
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
              <h1 className="text-4xl font-bold mb-2">Rapports</h1>
              <p className="text-muted-foreground">Analyse détaillée des performances et indicateurs</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isRapportDialogOpen} onOpenChange={setIsRapportDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      try {
                        setIsRapportDialogOpen(true);
                      } catch (error) {
                        console.error('Error opening dialog:', error);
                      }
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Nouveau rapport
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Générer un rapport</DialogTitle>
                    <DialogDescription>
                      Sélectionnez un projet et renseignez les informations du rapport.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Projet</label>
                      <Select
                        value={rapportForm.projet}
                        onValueChange={(value) => setRapportForm((prev) => ({ ...prev, projet: value }))}
                        disabled={availableProjects.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez un projet" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="rapport-title">Titre</label>
                      <Input
                        id="rapport-title"
                        value={rapportForm.titre}
                        onChange={(event) => setRapportForm((prev) => ({ ...prev, titre: event.target.value }))}
                        placeholder="Compte-rendu hebdomadaire"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="rapport-content">Contenu</label>
                      <Textarea
                        id="rapport-content"
                        value={rapportForm.contenu}
                        onChange={(event) => setRapportForm((prev) => ({ ...prev, contenu: event.target.value }))}
                        rows={6}
                        placeholder="Résumé des avancées, risques, recommandations..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={async () => {
                        try {
                          await handleCreateRapport();
                        } catch (error) {
                          console.error('Error creating rapport:', error);
                        }
                      }} 
                      disabled={rapportsLoading || availableProjects.length === 0}
                    >
                      Générer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                onClick={() => {
                  try {
                    exportToCSV();
                  } catch (error) {
                    console.error('Error exporting:', error);
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter (CSV)
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
                      {budgetPercent}% du budget
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
              {budgetsLoading ? (
                <div className="py-6 text-center text-muted-foreground">
                  Chargement des budgets...
                </div>
              ) : budgetRows.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  Aucun budget disponible.
                </div>
              ) : (
                <div className="space-y-6">
                  {budgetRows.map((item) => {
                    const percentage = item.total > 0 ? Math.round((item.spent / item.total) * 100) : 0;
                    return (
                      <div key={item.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.spent)} / {formatCurrency(item.total)}
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
                            Restant: {formatCurrency(item.total - item.spent)}
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
              )}
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
                {normalizedProjects.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    Aucun projet pour le moment.
                  </div>
                ) : (
                  normalizedProjects.map((item) => {
                    const plannedMonths = Math.max(
                      1,
                      Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    );
                    const elapsedMonths = Math.max(
                      0,
                      Math.round((Date.now() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    );
                    const remaining = Math.max(0, plannedMonths - elapsedMonths);
                    const plannedProgress = (elapsedMonths / plannedMonths) * 100;
                    const onTime = item.progress >= plannedProgress;
                    const progressValue = Math.min(100, plannedProgress);

                    return (
                      <div key={item.id} className="space-y-3 p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            {item.location && (
                              <p className="text-xs text-muted-foreground mt-1">{item.location}</p>
                            )}
                          </div>
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
                            <p className="font-semibold">{plannedMonths} mois</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Écoulé</p>
                            <p className="font-semibold">{elapsedMonths} mois</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Restant</p>
                            <p className="font-semibold">{remaining} mois</p>
                          </div>
                        </div>

                        <Progress value={progressValue} className="h-2" />
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rapports & Alertes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapports récents</CardTitle>
                <CardDescription>Documents générés automatiquement</CardDescription>
              </CardHeader>
              <CardContent>
                {rapportsLoading ? (
                  <div className="py-6 text-center text-muted-foreground">Chargement des rapports...</div>
                ) : latestRapports.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    Aucun rapport disponible.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {latestRapports.map((rapport) => (
                      <div key={rapport.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{rapport.titre}</h3>
                          <Badge variant="outline">{formatDate(rapport.date_generation)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {projectNameLookup.get(rapport.projet_id) ?? 'Projet inconnu'}
                        </p>
                        <p className="text-sm mt-3 line-clamp-3">
                          {rapport.contenu}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes IA</CardTitle>
                <CardDescription>Signaux automatiques à surveiller</CardDescription>
              </CardHeader>
              <CardContent>
                {alertesLoading ? (
                  <div className="py-6 text-center text-muted-foreground">Chargement des alertes...</div>
                ) : latestAlertes.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    Aucune alerte en cours.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {latestAlertes.map((alerte) => (
                      <div key={alerte.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">{formatDate(alerte.date)}</p>
                            <h3 className="font-semibold mt-1">{projectNameLookup.get(alerte.projet_id) ?? 'Projet inconnu'}</h3>
                          </div>
                          <Badge className={
                            alerte.type === 'CRITICAL'
                              ? 'bg-destructive text-destructive-foreground'
                              : alerte.type === 'WARNING'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-primary/10 text-primary'
                          }>
                            {alerte.type}
                          </Badge>
                        </div>
                        <p className="text-sm mt-3">
                          {alerte.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Statut: {alerte.statut}</span>
                          {alerte.ia && <span>IA #{alerte.ia.slice(0, 8)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance by Category - Calculé depuis les projets réels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance par projet</CardTitle>
                <CardDescription>Répartition des projets par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {normalizedProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun projet disponible</p>
                  ) : (
                    normalizedProjects.slice(0, 5).map((project) => (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">{project.status}</p>
                          </div>
                          <p className="text-xl font-bold">{project.progress || 0}%</p>
                        </div>
                        <Progress value={project.progress || 0} className="h-2" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicateurs globaux</CardTitle>
                <CardDescription>Métriques calculées depuis les données réelles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Progression moyenne</p>
                      <p className="text-xl font-bold">{avgPerformance}%</p>
                    </div>
                    <Progress value={avgPerformance} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Budget consommé</p>
                      <p className="text-xl font-bold">{budgetPercent}%</p>
                    </div>
                    <Progress value={budgetPercent} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Durée moyenne</p>
                      <p className="text-xl font-bold">{avgDuration} mois</p>
                    </div>
                    <Progress value={Math.min(100, (avgDuration / 24) * 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Total projets</p>
                      <p className="text-xl font-bold">{normalizedProjects.length}</p>
                    </div>
                  </div>
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
