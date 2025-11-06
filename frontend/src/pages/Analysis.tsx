import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Clock, PlusCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { useIA } from "@/hooks/useIA";
import { useAlertes } from "@/hooks/useAlertes";
import { toast } from "sonner";

const Analysis = () => {
  const { projects } = useProjects();
  const { ias, loading: iaLoading, addIA } = useIA();
  const { alertes, loading: alertesLoading } = useAlertes();

  const [isIADialogOpen, setIsIADialogOpen] = useState(false);
  const [iaForm, setIAForm] = useState({ modele: "", seuil_confiance: 0.75 });

  // Calculate real risk metrics from project data
  const calculateProjectRisk = (project: any) => {
    const progressVsBudget = (project.budgetUsed / project.budget) * 100;
    const isOverBudget = progressVsBudget > project.progress + 10;
    const isDelayed = project.progress < 50 && new Date(project.endDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
    if (isOverBudget && isDelayed) return "élevé";
    if (isOverBudget || isDelayed) return "moyen";
    return "faible";
  };

  const predictions = useMemo(() => projects.map(project => {
    const delayRisk = calculateProjectRisk(project);
    const budgetRisk = (project.budgetUsed / project.budget) > 0.8 ? "élevé" : 
                       (project.budgetUsed / project.budget) > 0.6 ? "moyen" : "faible";
    
    return {
      project: project.name,
      delayRisk,
      budgetRisk,
      completionDate: new Date(project.endDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      confidence: Math.floor(70 + Math.random() * 20),
      recommendations: delayRisk === "élevé" 
        ? ["Revoir la planification", "Augmenter les ressources", "Optimiser les approvisionnements"]
        : delayRisk === "moyen"
        ? ["Surveiller l'avancement de près", "Anticiper les retards potentiels"]
        : ["Maintenir le rythme actuel", "Continuer la surveillance régulière"]
    };
  }), [projects]);

  const riskCounts = useMemo(() => ({
    low: predictions.filter(p => p.delayRisk === "faible").length,
    medium: predictions.filter(p => p.delayRisk === "moyen").length,
    high: predictions.filter(p => p.delayRisk === "élevé").length,
  }), [predictions]);

  const alertCounts = useMemo(() => ({
    critical: alertes.filter(a => a.type === 'CRITICAL').length,
    warning: alertes.filter(a => a.type === 'WARNING').length,
    info: alertes.filter(a => a.type === 'INFO').length,
  }), [alertes]);

  const handleCreateIA = async () => {
    if (!iaForm.modele.trim()) {
      toast.error('Veuillez indiquer le nom du modèle');
      return;
    }

    const seuil = Math.min(1, Math.max(0, iaForm.seuil_confiance));

    try {
      await addIA({ modele: iaForm.modele.trim(), seuil_confiance: seuil });
      toast.success('Modèle IA créé');
      setIAForm({ modele: "", seuil_confiance: 0.75 });
      setIsIADialogOpen(false);
    } catch (error) {
      toast.error('Impossible de créer le modèle IA');
    }
  };

  const overBudgetProjects = projects
    .filter(p => (p.budgetUsed / p.budget) > 0.95)
    .map(p => ({
      project: p.name,
      forecast: `+${Math.floor(((p.budgetUsed / p.budget) - 1) * 100 + 5)}%`,
      amount: `${((p.budgetUsed - p.budget) / 1000000).toFixed(1)}M €`
    }));

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "faible":
        return <Badge className="bg-success/10 text-success border-success/20">Faible</Badge>;
      case "moyen":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Moyen</Badge>;
      case "élevé":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Élevé</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "faible":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "moyen":
        return <Clock className="h-5 w-5 text-warning" />;
      case "élevé":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Analyse prédictive</h1>
            </div>
            <p className="text-muted-foreground">
              Prédictions basées sur l'IA pour anticiper les risques et optimiser les décisions
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="border-primary/50 bg-primary/5">
            <Brain className="h-4 w-4" />
            <AlertTitle>Fonctionnalité en aperçu</AlertTitle>
            <AlertDescription>
              Cette page présente une maquette des capacités d'analyse prédictive. Les modèles d'IA seront entraînés
              sur des données réelles pour fournir des prévisions précises.
            </AlertDescription>
          </Alert>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-success/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Projets à faible risque</p>
                    <p className="text-3xl font-bold mt-2">{riskCounts.low}</p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Risque moyen</p>
                    <p className="text-3xl font-bold mt-2">{riskCounts.medium}</p>
                  </div>
                  <Clock className="h-10 w-10 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Risque élevé</p>
                    <p className="text-3xl font-bold mt-2">{riskCounts.high}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alertes critiques</p>
                    <p className="text-3xl font-bold mt-2">
                      {alertesLoading ? '...' : alertCounts.critical}
                    </p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {alertCounts.warning} alertes à surveiller, {alertCounts.info} notifications informatives
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Predictions */}
          <div className="space-y-6">
            {predictions.map((pred, idx) => (
              <Card key={idx} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{pred.project}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Confiance:</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {pred.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Date d'achèvement prévue: {pred.completionDate}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Risk Assessment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Risque de retard</span>
                        {getRiskIcon(pred.delayRisk)}
                      </div>
                      {getRiskBadge(pred.delayRisk)}
                    </div>

                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Risque budgétaire</span>
                        {getRiskIcon(pred.budgetRisk)}
                      </div>
                      {getRiskBadge(pred.budgetRisk)}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recommandations
                    </h3>
                    <ul className="space-y-2">
                      {pred.recommendations.map((rec, recIdx) => (
                        <li key={recIdx} className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                          <span className="text-sm text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* IA Models */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Modèles IA
                </CardTitle>
                <CardDescription>Configuration des moteurs d'analyse automatisée</CardDescription>
              </div>
              <Dialog open={isIADialogOpen} onOpenChange={setIsIADialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setIsIADialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un modèle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau modèle IA</DialogTitle>
                    <DialogDescription>
                      Définissez un modèle et un seuil de confiance pour surveiller vos projets.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="ia-modele">Nom du modèle</label>
                      <Input
                        id="ia-modele"
                        value={iaForm.modele}
                        onChange={(event) => setIAForm((prev) => ({ ...prev, modele: event.target.value }))}
                        placeholder="Ex: RiskAnalyzer v1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="ia-seuil">Seuil de confiance</label>
                      <Input
                        id="ia-seuil"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={iaForm.seuil_confiance}
                        onChange={(event) =>
                          setIAForm((prev) => ({
                            ...prev,
                            seuil_confiance: Number(event.target.value),
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">Valeur entre 0 et 1 (ex: 0.8)</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateIA} disabled={iaLoading}>
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {iaLoading ? (
                <div className="py-6 text-center text-muted-foreground">Chargement des modèles...</div>
              ) : ias.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  Aucun modèle configuré pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ias.map((ia) => (
                    <div key={ia.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{ia.modele}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Créé le {new Date(ia.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Seuil {Math.round(ia.seuil_confiance * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Analyse automatique des risques avec déclenchement d'alertes au-delà du seuil défini.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Dépassements budgétaires prévus
                </CardTitle>
                <CardDescription>Projections basées sur les tendances actuelles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overBudgetProjects.length > 0 ? overBudgetProjects.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{item.project}</p>
                        <p className="text-sm text-muted-foreground">Dépassement estimé</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">{item.forecast}</p>
                        <p className="text-sm text-muted-foreground">{item.amount}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun dépassement budgétaire prévu
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Économies potentielles
                </CardTitle>
                <CardDescription>Optimisations identifiées par l'IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { area: "Approvisionnements groupés", savings: "350K €" },
                    { area: "Optimisation planning", savings: "180K €" },
                    { area: "Réduction déchets", savings: "95K €" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <p className="font-medium">{item.area}</p>
                      <p className="font-bold text-success">{item.savings}</p>
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

export default Analysis;
