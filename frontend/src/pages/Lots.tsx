import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LotForm, LotFormData } from '@/components/lots/LotForm';
import { useLots } from '@/hooks/useLots';
import { Plus, Calendar, ArrowLeft, Package } from 'lucide-react';

const Lots = () => {
  const { projetId, chantierId } = useParams<{ projetId: string; chantierId: string }>();
  const { lots, loading, addLot } = useLots(chantierId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateLot = async (data: LotFormData) => {
    await addLot(data);
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
          <div className="flex items-center gap-4 mb-8">
            <Link to={`/projets/${projetId}/chantiers`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">Lots</h1>
              <p className="text-muted-foreground">
                {lots.length} lot{lots.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Lot
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lots.map((lot) => (
                <Link to={`/projets/${projetId}/chantiers/${chantierId}/lots/${lot.id}/taches`} key={lot.id}>
                  <Card className="h-full card-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Package className="h-6 w-6 text-primary" />
                        <Badge className={getStatusColor(lot.status)}>
                          {lot.status}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{lot.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {lot.description || 'Aucune description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avancement</span>
                          <span className="font-semibold">{lot.progress}%</span>
                        </div>
                        <Progress value={lot.progress} />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(lot.start_date).toLocaleDateString('fr-FR')} - 
                            {new Date(lot.end_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!loading && lots.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">Aucun lot trouvé</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer votre premier lot
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau lot</DialogTitle>
          </DialogHeader>
          <LotForm
            chantierId={chantierId!}
            onSubmit={handleCreateLot}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lots;
