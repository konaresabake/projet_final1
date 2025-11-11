import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChantierForm, ChantierFormData } from '@/components/chantiers/ChantierForm';
import { useChantiers } from '@/hooks/useChantiers';
import { useProjects } from '@/contexts/ProjectContext';
import { Plus, MapPin, Calendar, Euro, TrendingUp, ArrowLeft } from 'lucide-react';

const Chantiers = () => {
  const { projetId } = useParams<{ projetId: string }>();
  const { chantiers, loading, addChantier, refreshChantiers } = useChantiers(projetId);
  const { refreshProjects } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const location = useLocation();

  // Rafraîchir les données quand on arrive sur la page
  useEffect(() => {
    refreshChantiers();
    refreshProjects();
  }, [location.pathname, projetId, refreshChantiers, refreshProjects]);

  const handleCreateChantier = async (data: ChantierFormData) => {
    await addChantier(data);
    // Rafraîchir le contexte global pour synchroniser toutes les pages
    await refreshProjects();
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-primary';
      case 'Terminé': return 'bg-success';
      case 'En attente': return 'bg-warning';
      case 'Planifié': return 'bg-muted';
      default: return 'bg-muted';
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
          <div className="flex items-center gap-4 mb-8">
            <Link to="/projets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">Chantiers</h1>
              <p className="text-muted-foreground">
                {chantiers.length} chantier{chantiers.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button 
              onClick={() => {
                try {
                  setIsDialogOpen(true);
                } catch (error) {
                  console.error('Error opening dialog:', error);
                }
              }} 
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Chantier
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chantiers.map((chantier) => (
                <Link to={`/projets/${projetId}/chantiers/${chantier.id}/lots`} key={chantier.id}>
                  <Card className="h-full card-hover">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={getPriorityColor(chantier.priority)}>
                          {chantier.priority}
                        </Badge>
                        <Badge className={getStatusColor(chantier.status)}>
                          {chantier.status}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{chantier.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {chantier.description || 'Aucune description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avancement</span>
                          <span className="font-semibold">{chantier.progress}%</span>
                        </div>
                        <Progress value={chantier.progress} />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{chantier.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(chantier.start_date).toLocaleDateString('fr-FR')} - 
                            {new Date(chantier.end_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Euro className="h-4 w-4" />
                          <span>{(chantier.budget / 1000).toFixed(0)}kXOF</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>{chantier.manager}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!loading && chantiers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">Aucun chantier trouvé</p>
              <Button 
                onClick={() => {
                  try {
                    setIsDialogOpen(true);
                  } catch (error) {
                    console.error('Error opening dialog:', error);
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer votre premier chantier
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau chantier</DialogTitle>
          </DialogHeader>
          <ChantierForm
            projetId={projetId!}
            onSubmit={handleCreateChantier}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chantiers;
