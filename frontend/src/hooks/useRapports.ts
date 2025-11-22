import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Rapport {
  id: string;
  projet_id: string;
  titre: string;
  contenu: string;
  date_generation: string;
  created_at: string;
  updated_at: string;
}

export const useRapports = (projetId?: string) => {
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRapports = async () => {
    try {
      setLoading(true);
      const endpoint = projetId ? `/rapports/?projet_id=${projetId}` : '/rapports/';
      const data = await api.get<Rapport[]>(endpoint);
      // S'assurer que data est un tableau
      setRapports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rapports:', error);
      // Ne pas afficher de toast pour les erreurs 404 ou de connexion réseau
      const apiError = error as { response?: { status?: number }; message?: string };
      const isNetworkError = apiError?.response?.status === 404 || 
                            apiError?.response?.status === 0 ||
                            apiError?.message === 'Failed to fetch';
      
      if (!isNetworkError) {
        toast.error('Erreur lors du chargement des rapports');
      }
      setRapports([]); // Toujours initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const addRapport = async (rapport: Omit<Rapport, 'id' | 'created_at' | 'updated_at' | 'projet_id' | 'date_generation'> & { projet: string }) => {
    try {
      const created = await api.post<Rapport>('/rapports/', rapport);
      setRapports([created, ...rapports]);
      toast.success('Rapport créé');
      return created;
    } catch (error) {
      console.error('Error adding rapport:', error);
      toast.error('Erreur lors de la création du rapport');
      throw error;
    }
  };

  const updateRapport = async (id: string, updates: Partial<Rapport> & { projet?: string }) => {
    try {
      const updated = await api.patch<Rapport>(`/rapports/${id}/`, updates as any);
      setRapports(rapports.map(r => (r.id === id ? updated : r)));
      toast.success('Rapport mis à jour');
      return updated;
    } catch (error) {
      console.error('Error updating rapport:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteRapport = async (id: string) => {
    try {
      await api.delete(`/rapports/${id}/`);
      setRapports(rapports.filter(r => r.id !== id));
      toast.success('Rapport supprimé');
    } catch (error) {
      console.error('Error deleting rapport:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [projetId]);

  return {
    rapports,
    loading,
    addRapport,
    updateRapport,
    deleteRapport,
    refreshRapports: fetchRapports,
  };
};


