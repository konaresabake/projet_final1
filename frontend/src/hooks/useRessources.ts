import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface RessourceBase {
  id: string;
  nom: string;
  quantite: number;
  cout_unitaire: number;
  fournisseur_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RessourceHumaine extends RessourceBase {
  role: string;
  competence: string;
}

export interface RessourceMaterielle extends RessourceBase {
  type: string;
  etat: string;
}

export const useRessources = (fournisseurId?: string) => {
  const [ressources, setRessources] = useState<RessourceBase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRessources = async () => {
    try {
      setLoading(true);
      const endpoint = fournisseurId ? `/ressources/?fournisseur_id=${fournisseurId}` : '/ressources/';
      const data = await api.get<RessourceBase[]>(endpoint);
      setRessources(data);
    } catch (error) {
      console.error('Error fetching ressources:', error);
      toast.error('Erreur lors du chargement des ressources');
    } finally {
      setLoading(false);
    }
  };

  const addRessource = async (ressource: Omit<RessourceBase, 'id' | 'created_at' | 'updated_at' | 'fournisseur_id'> & { fournisseur?: string }) => {
    try {
      const created = await api.post<RessourceBase>('/ressources/', ressource as any);
      setRessources([created, ...ressources]);
      toast.success('Ressource créée');
      return created;
    } catch (error) {
      console.error('Error adding ressource:', error);
      toast.error('Erreur lors de la création de la ressource');
      throw error;
    }
  };

  const updateRessource = async (id: string, updates: Partial<RessourceBase> & { fournisseur?: string }) => {
    try {
      const updated = await api.patch<RessourceBase>(`/ressources/${id}/`, updates as any);
      setRessources(ressources.map(r => (r.id === id ? updated : r)));
      toast.success('Ressource mise à jour');
      return updated;
    } catch (error) {
      console.error('Error updating ressource:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteRessource = async (id: string) => {
    try {
      await api.delete(`/ressources/${id}/`);
      setRessources(ressources.filter(r => r.id !== id));
      toast.success('Ressource supprimée');
    } catch (error) {
      console.error('Error deleting ressource:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchRessources();
  }, [fournisseurId]);

  return {
    ressources,
    loading,
    addRessource,
    updateRessource,
    deleteRessource,
    refreshRessources: fetchRessources,
  };
};


