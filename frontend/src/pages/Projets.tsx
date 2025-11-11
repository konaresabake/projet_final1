import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjetForm, ProjetFormData } from '@/components/projets/ProjetForm';
import { useProjets } from '@/hooks/useProjets';
import { useProjects } from '@/contexts/ProjectContext';
import { Plus, Folder } from 'lucide-react';

const Projets = () => {
  const { projets, loading, addProjet, refreshProjets } = useProjets();
  const { refreshProjects } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const location = useLocation();

  // Rafraîchir les données quand on arrive sur la page
  useEffect(() => {
    refreshProjets();
    refreshProjects();
  }, [location.pathname, refreshProjets, refreshProjects]);

  const handleCreateProjet = async (data: ProjetFormData) => {
    await addProjet(data);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Projets</h1>
              <p className="text-muted-foreground">
                {projets.length} projet{projets.length > 1 ? 's' : ''}
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
              Nouveau Projet
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projets.map((projet) => (
                <Link to={`/projets/${projet.id}/chantiers`} key={projet.id}>
                  <Card className="h-full card-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Folder className="h-6 w-6 text-primary" />
                        <Badge className={getStatusColor(projet.status)}>
                          {projet.status}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{projet.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {projet.description || 'Aucune description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Créé le {new Date(projet.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!loading && projets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">Aucun projet trouvé</p>
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
                Créer votre premier projet
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
          </DialogHeader>
          <ProjetForm
            onSubmit={handleCreateProjet}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projets;
