import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Projet {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority?: string;
  budget?: string | number; // Peut être string car coerce_to_string=True
  start_date?: string;
  end_date?: string;
  location?: string;
  manager?: string;
  avancement_calcule?: number;
  created_at: string;
  updated_at: string;
}

export const useProjets = () => {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjets = async () => {
    try {
      setLoading(true);
      const data = await api.get<Projet[]>('/projets/');
      // S'assurer que data est un tableau et gérer les cas où l'API retourne null ou un objet
      if (Array.isArray(data)) {
      setProjets(data);
      } else if (data === null || data === undefined) {
        // Si le backend retourne null, utiliser un tableau vide
        console.warn('Le backend a retourné null, utilisation d\'un tableau vide');
        setProjets([]);
      } else if (typeof data === 'object' && 'error' in data) {
        // Si c'est un objet d'erreur, afficher le message
        toast.error((data as any).error || 'Erreur lors du chargement des projets');
        setProjets([]);
      } else {
        // Autre cas, essayer de convertir en tableau
        console.warn('Réponse inattendue du backend, tentative de conversion:', data);
        setProjets([]);
      }
    } catch (error: any) {
      console.error('Error fetching projets:', error);
      const errorMessage = error?.response?.data?.error || 
        error?.response?.data?.detail || 
        error?.message || 
        "Erreur lors du chargement des projets";
      toast.error(errorMessage);
      setProjets([]); // Toujours initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const addProjet = async (projet: Omit<Projet, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await api.post<Projet>('/projets/', projet);
      setProjets([created, ...projets]);
      toast.success('Projet créé avec succès');
      return created;
    } catch (error) {
      console.error('Error adding projet:', error);
      toast.error("Erreur lors de la création du projet");
      throw error;
    }
  };

  const updateProjet = async (id: string, updates: Partial<Projet>) => {
    try {
      const updated = await api.patch<Projet>(`/projets/${id}/`, updates);
      setProjets(projets.map(p => (p.id === id ? updated : p)));
      toast.success('Projet mis à jour');
      return updated;
    } catch (error) {
      console.error('Error updating projet:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteProjet = async (id: string) => {
    try {
      await api.delete(`/projets/${id}/`);
      setProjets(projets.filter(p => p.id !== id));
      toast.success('Projet supprimé');
    } catch (error) {
      console.error('Error deleting projet:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchProjets();
  }, []);

  return {
    projets,
    loading,
    addProjet,
    updateProjet,
    deleteProjet,
    refreshProjets: fetchProjets,
  };
};
