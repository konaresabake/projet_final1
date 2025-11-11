import { useParams, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, DollarSign, Users, FileText, TrendingUp, ArrowLeft, Edit, Plus, ChevronDown, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { useChantiers, Chantier } from "@/hooks/useChantiers";
import { useLots, Lot } from "@/hooks/useLots";
import { useTaches, Tache } from "@/hooks/useTaches";
import { ChantierForm, ChantierFormData } from "@/components/chantiers/ChantierForm";
import { LotForm, LotFormData } from "@/components/lots/LotForm";
import { TacheForm, TacheFormData } from "@/components/taches/TacheForm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// Composant pour afficher un lot avec ses tâches
const LotItem = ({ 
  lot, 
  chantierId, 
  isExpanded, 
  onToggle, 
  onCreateTache 
}: { 
  lot: Lot;
  chantierId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateTache: (lotId: string) => void;
}) => {
  const { taches, loading: tachesLoading, addTache, refreshTaches, updateTache } = useTaches(lot.id);
  const lotProgress = lot.avancement_calcule ?? lot.progress ?? 0;

  const handleCreateTache = async (data: TacheFormData) => {
    try {
      await addTache({
        lot_id: lot.id,
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigned_to: data.assigned_to,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      });
      await refreshTaches();
      toast.success('Tâche créée avec succès');
    } catch (error) {
      console.error('Error creating tache:', error);
    }
  };

  return (
    <div className="border rounded p-3 space-y-2 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
          <div className="flex-1">
            <h4 className="text-sm font-medium">{lot.name}</h4>
            <p className="text-xs text-muted-foreground">
              {new Date(lot.start_date).toLocaleDateString('fr-FR')} - {new Date(lot.end_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-xs", lot.status === 'Terminé' ? "bg-success/10 text-success border-success/20" : lot.status === 'En cours' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted")}>
            {lot.status}
          </Badge>
          <div className="text-right min-w-[50px]">
            <p className="text-xs font-semibold">{lotProgress}%</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle tâche</DialogTitle>
            </DialogHeader>
            <TacheForm
              lotId={lot.id}
              onSubmit={handleCreateTache}
              onCancel={() => {}}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Progress value={lotProgress} className="h-1.5" />
      
      {isExpanded && (
        <div className="pl-6 space-y-2 mt-2">
          {tachesLoading ? (
            <div className="text-xs text-muted-foreground py-1">Chargement...</div>
          ) : taches.length === 0 ? (
            <div className="text-xs text-muted-foreground py-1">
              Aucune tâche. Créez-en une pour ce lot.
            </div>
          ) : (
            taches.map((tache) => (
              <div key={tache.id} className="flex items-center justify-between p-2 rounded bg-background border gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{tache.name}</p>
                  {tache.description && (
                    <p className="text-xs text-muted-foreground">{tache.description}</p>
                  )}
                </div>
                <Badge variant="outline" className={cn("text-xs", tache.status === 'Terminé' || tache.status === 'terminé' ? "bg-success/10 text-success border-success/20" : tache.status === 'En cours' || tache.status === 'en cours' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted")}>
                  {tache.status}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={tache.status === 'En cours' || tache.status?.toLowerCase() === 'en cours' || tache.status === 'Terminé' || tache.status?.toLowerCase() === 'terminé'}
                    onClick={async () => {
                      await updateTache(tache.id, { status: 'En cours' } as Partial<Tache>);
                      await refreshTaches();
                    }}
                  >
                    Démarrer
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={tache.status === 'Terminé' || tache.status?.toLowerCase() === 'terminé'}
                    onClick={async () => {
                      await updateTache(tache.id, { status: 'Terminé', progress: 100 } as Partial<Tache>);
                      await refreshTaches();
                    }}
                  >
                    Terminer
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Composant pour afficher un chantier avec ses lots
const ChantierItem = ({ 
  chantier, 
  isExpanded, 
  onToggle, 
  onCreateLot,
  refreshProjects 
}: { 
  chantier: Chantier;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateLot: (chantierId: string) => void;
  refreshProjects: () => Promise<void>;
}) => {
  const { lots, loading: lotsLoading, addLot, refreshLots } = useLots(chantier.id);
  const [lotDialogOpen, setLotDialogOpen] = useState<string | null>(null);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const progress = chantier.avancement_calcule ?? chantier.progress ?? 0;

  const toggleLot = (lotId: string) => {
    const newExpanded = new Set(expandedLots);
    if (newExpanded.has(lotId)) {
      newExpanded.delete(lotId);
    } else {
      newExpanded.add(lotId);
    }
    setExpandedLots(newExpanded);
  };

  const handleCreateLot = async (data: LotFormData) => {
    try {
      await addLot({
        chantier_id: chantier.id,
        name: data.name,
        description: data.description,
        status: data.status,
        progress: data.progress,
        start_date: data.start_date,
        end_date: data.end_date,
      });
      setLotDialogOpen(null);
      await refreshLots();
      await refreshProjects();
      toast.success('Lot créé avec succès');
    } catch (error) {
      console.error('Error creating lot:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold">{chantier.name}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(chantier.start_date).toLocaleDateString('fr-FR')} - {new Date(chantier.end_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Badge className={cn(chantier.status === 'Terminé' ? "bg-success/10 text-success border-success/20" : chantier.status === 'En cours' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted")}>
            {chantier.status}
          </Badge>
          <div className="text-right min-w-[60px]">
            <p className="text-sm font-semibold">{progress}%</p>
          </div>
        </div>
        <Dialog open={!!lotDialogOpen} onOpenChange={(open) => setLotDialogOpen(open ? chantier.id : null)}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLotDialogOpen(chantier.id)}
            >
              <Plus className="mr-2 h-3 w-3" />
              Lot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau lot</DialogTitle>
            </DialogHeader>
            <LotForm
              chantierId={chantier.id}
              onSubmit={handleCreateLot}
              onCancel={() => setLotDialogOpen(null)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Progress value={progress} className="h-2" />
      
      {isExpanded && (
        <div className="pl-8 space-y-3 mt-3">
          {lotsLoading ? (
            <div className="text-sm text-muted-foreground py-2">Chargement...</div>
          ) : lots.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              Aucun lot. Créez-en un pour ce chantier.
            </div>
          ) : (
            lots.map((lot) => (
              <LotItem
                key={lot.id}
                lot={lot}
                chantierId={chantier.id}
                isExpanded={expandedLots.has(lot.id)}
                onToggle={() => toggleLot(lot.id)}
                onCreateTache={() => {}}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const { projects, refreshProjects } = useProjects();
  const project = projects.find(p => p.id === id);

  // Charger les chantiers pour ce projet
  const { chantiers, loading: chantiersLoading, addChantier, refreshChantiers } = useChantiers(id);
  
  // États pour les dialogues
  const [chantierDialogOpen, setChantierDialogOpen] = useState(false);
  
  // États pour l'affichage hiérarchique
  const [expandedChantiers, setExpandedChantiers] = useState<Set<string>>(new Set());

  // Rafraîchir les données quand on arrive sur la page ou quand l'ID change
  useEffect(() => {
    refreshProjects();
    refreshChantiers();
  }, [id, refreshProjects, refreshChantiers]);

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Projet introuvable</h1>
            <Link to="/projects">
              <Button>Retour aux projets</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'Terminé':
      case 'terminé':
      case 'Terminée':
      case 'terminée':
      case 'completed':
        return 'Terminé';
      case 'En cours':
      case 'en cours':
      case 'in-progress':
        return 'En cours';
      default:
        return 'En attente';
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = status?.toLowerCase() ?? '';
    if (['terminé', 'terminée', 'completed'].includes(normalized)) {
      return "bg-success/10 text-success border-success/20";
    }
    if (['en cours', 'in-progress'].includes(normalized)) {
      return "bg-primary/10 text-primary border-primary/20";
    }
    return "bg-muted";
  };

  const toggleChantier = (chantierId: string) => {
    const newExpanded = new Set(expandedChantiers);
    if (newExpanded.has(chantierId)) {
      newExpanded.delete(chantierId);
    } else {
      newExpanded.add(chantierId);
    }
    setExpandedChantiers(newExpanded);
  };

  const handleCreateChantier = async (data: ChantierFormData) => {
    try {
      await addChantier({
        projet_id: id!,
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        progress: data.progress,
        budget: data.budget,
        budget_used: data.budget_used,
        start_date: data.start_date,
        end_date: data.end_date,
        location: data.location,
        manager: data.manager,
      });
      setChantierDialogOpen(false);
      await refreshChantiers();
      await refreshProjects();
    } catch (error) {
      console.error('Error creating chantier:', error);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link to="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline">{project.priority}</Badge>
              <Badge className={cn("border-primary/20", getStatusColor(project.status))}>
                {project.status}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground">{project.location}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progression</p>
                    <p className="text-2xl font-bold">{project.progress}%</p>
                    <p className="text-xs text-muted-foreground">Calculée automatiquement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-2xl font-bold">{formatCurrency(project.budget)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Échéance</p>
                    <p className="text-lg font-bold">{new Date(project.endDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chantiers</p>
                    <p className="text-2xl font-bold">{chantiers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="structure" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="structure">Structure du projet</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="team">Équipe</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{project.description}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Budget</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Consommé</span>
                        <span className="font-medium">{formatCurrency(project.budgetUsed)}</span>
                      </div>
                      <Progress value={(project.budgetUsed / project.budget) * 100} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget total</p>
                        <p className="font-semibold text-lg">{formatCurrency(project.budget)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Restant</p>
                        <p className="font-semibold text-lg">{formatCurrency(project.budget - project.budgetUsed)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date de début</p>
                      <p className="font-medium">{new Date(project.startDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date de fin prévue</p>
                      <p className="font-medium">{new Date(project.endDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Durée totale</p>
                      <p className="font-medium">
                        {Math.round((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} mois
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Structure du projet</CardTitle>
                      <CardDescription>
                        Hiérarchie : Chantiers → Lots → Tâches
                      </CardDescription>
                    </div>
                    <Button onClick={() => setChantierDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouveau chantier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chantiersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                  ) : chantiers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun chantier. Créez-en un pour commencer.
                    </div>
                  ) : (
                    chantiers.map((chantier) => (
                      <ChantierItem
                        key={chantier.id}
                        chantier={chantier}
                        isExpanded={expandedChantiers.has(chantier.id)}
                        onToggle={() => {
                          const newExpanded = new Set(expandedChantiers);
                          if (newExpanded.has(chantier.id)) {
                            newExpanded.delete(chantier.id);
                          } else {
                            newExpanded.add(chantier.id);
                          }
                          setExpandedChantiers(newExpanded);
                        }}
                        onCreateLot={() => {}}
                        refreshProjects={refreshProjects}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="phases" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Phases du projet</CardTitle>
                  <CardDescription>Suivi détaillé de chaque phase de construction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {project.phases.map((phase) => (
                    <div key={phase.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{phase.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(phase.startDate).toLocaleDateString('fr-FR')} - {new Date(phase.endDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            phase.status === "completed"
                              ? "bg-success/10 text-success border-success/20"
                              : phase.status === "in-progress"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted"
                          }
                        >
                          {getTaskStatusLabel(phase.status)}
                        </Badge>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                      <p className="text-sm text-right text-muted-foreground">{phase.progress}%</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Membres de l'équipe</CardTitle>
                  <CardDescription>Personnes assignées à ce projet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.team.map((member) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Documents</CardTitle>
                      <CardDescription>Fichiers et documents du projet</CardDescription>
                    </div>
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{doc.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')} • {doc.size} • {doc.uploadedBy}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => toast.info('Fonctionnalité à venir')}>
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Dialogues pour créer des entités */}
      <Dialog open={chantierDialogOpen} onOpenChange={setChantierDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau chantier</DialogTitle>
          </DialogHeader>
          <ChantierForm
            projetId={id!}
            onSubmit={handleCreateChantier}
            onCancel={() => setChantierDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProjectDetail;
