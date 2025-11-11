import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TacheForm, TacheFormData } from '@/components/taches/TacheForm';
import { useTaches } from '@/hooks/useTaches';
import { useProjects } from '@/contexts/ProjectContext';
import { Plus, Calendar, User, ArrowLeft, CheckSquare } from 'lucide-react';

const Taches = () => {
  const { projetId, chantierId, lotId } = useParams<{ projetId: string; chantierId: string; lotId: string }>();
  const { taches, loading, addTache, updateTache, refreshTaches } = useTaches(lotId);
  const { refreshProjects, addActivity } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const location = useLocation();

  // Rafraîchir les données quand on arrive sur la page
  useEffect(() => {
    refreshTaches();
    refreshProjects();
  }, [location.pathname, lotId, refreshTaches, refreshProjects]);

  const handleCreateTache = async (data: TacheFormData) => {
    await addTache(data);
    // Rafraîchir le contexte global pour synchroniser toutes les pages
    await refreshProjects();
    // Ajouter une activité
    addActivity({
      type: 'update',
      description: `Nouvelle tâche créée: ${data.name}`,
      user: 'Vous',
      projectId: projetId || '',
    });
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-primary';
      case 'Terminé': return 'bg-success';
      case 'En attente': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string | null) => {
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
          <div className="flex items-center gap-4 mb-8">
            <Link to={`/projets/${projetId}/chantiers/${chantierId}/lots`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">Tâches</h1>
              <p className="text-muted-foreground">
                {taches.length} tâche{taches.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button 
              onClick={() => {
                setIsDialogOpen(true);
              }} 
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Tâche
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {taches.map((tache) => (
                <Card key={tache.id} className="h-full card-hover">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-primary" />
                        {tache.priority && (
                          <Badge variant={getPriorityColor(tache.priority)}>
                            {tache.priority}
                          </Badge>
                        )}
                      </div>
                      <Badge className={getStatusColor(tache.status)}>
                        {tache.status}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{tache.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {tache.description || 'Aucune description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {tache.assigned_to && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{tache.assigned_to}</span>
                      </div>
                    )}
                    {tache.start_date && tache.end_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(tache.start_date).toLocaleDateString('fr-FR')} - 
                          {new Date(tache.end_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={tache.status === 'En cours' || tache.status === 'Terminé'}
                        onClick={async () => {
                          try {
                            await updateTache(tache.id, { status: 'En cours' } as any);
                            await refreshProjects();
                            addActivity({
                              type: 'update',
                              description: `Tâche démarrée: ${tache.name}`,
                              user: 'Vous',
                              projectId: projetId || '',
                            });
                          } catch (error) {
                            console.error('Error updating tache:', error);
                          }
                        }}
                      >
                        Démarrer
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={tache.status === 'Terminé'}
                        onClick={async () => {
                          try {
                            await updateTache(tache.id, { status: 'Terminé', progress: 100 } as any);
                            await refreshProjects();
                            addActivity({
                              type: 'milestone',
                              description: `Tâche terminée: ${tache.name}`,
                              user: 'Vous',
                              projectId: projetId || '',
                            });
                          } catch (error) {
                            console.error('Error updating tache:', error);
                          }
                        }}
                      >
                        Terminer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && taches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">Aucune tâche trouvée</p>
              <Button 
                onClick={() => {
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première tâche
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle tâche</DialogTitle>
          </DialogHeader>
          <TacheForm
            lotId={lotId!}
            onSubmit={handleCreateTache}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Taches;
