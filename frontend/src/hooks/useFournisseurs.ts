import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Fournisseur {
  id: string;
  societe: string;
  contact: string;
  created_at: string;
  updated_at: string;
}

export const useFournisseurs = () => {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFournisseurs = async () => {
    try {
      setLoading(true);
      const data = await api.get<Fournisseur[]>('/fournisseurs/');
      // S'assurer que data est un tableau
      setFournisseurs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching fournisseurs:', error);
      // Ne pas afficher de toast pour les erreurs 404 ou de connexion réseau
      const apiError = error as { response?: { status?: number }; message?: string };
      const isNetworkError = apiError?.response?.status === 404 || 
                            apiError?.response?.status === 0 ||
                            apiError?.message === 'Failed to fetch';
      
      if (!isNetworkError) {
        toast.error('Erreur lors du chargement des fournisseurs');
      }
      setFournisseurs([]); // Toujours initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const addFournisseur = async (fournisseur: Omit<Fournisseur, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await api.post<Fournisseur>('/fournisseurs/', fournisseur);
      setFournisseurs([created, ...fournisseurs]);
      toast.success('Fournisseur créé');
      return created;
    } catch (error) {
      console.error('Error adding fournisseur:', error);
      toast.error('Erreur lors de la création du fournisseur');
      throw error;
    }
  };

  const updateFournisseur = async (id: string, updates: Partial<Fournisseur>) => {
    try {
      const updated = await api.patch<Fournisseur>(`/fournisseurs/${id}/`, updates);
      setFournisseurs(fournisseurs.map(f => (f.id === id ? updated : f)));
      toast.success('Fournisseur mis à jour');
      return updated;
    } catch (error) {
      console.error('Error updating fournisseur:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteFournisseur = async (id: string) => {
    try {
      await api.delete(`/fournisseurs/${id}/`);
      setFournisseurs(fournisseurs.filter(f => f.id !== id));
      toast.success('Fournisseur supprimé');
    } catch (error) {
      console.error('Error deleting fournisseur:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  return {
    fournisseurs,
    loading,
    addFournisseur,
    updateFournisseur,
    deleteFournisseur,
    refreshFournisseurs: fetchFournisseurs,
  };
};


