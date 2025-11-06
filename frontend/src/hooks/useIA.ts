import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface IA {
  id: string;
  modele: string;
  seuil_confiance: number;
  created_at: string;
  updated_at: string;
}

export const useIA = () => {
  const [ias, setIAs] = useState<IA[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIAs = async () => {
    try {
      setLoading(true);
      const data = await api.get<IA[]>('/ia/');
      setIAs(data);
    } catch (error: any) {
      console.error('Error fetching IA:', error);
      const errorMessage = error?.response?.data?.error || 'Erreur lors du chargement des modèles IA';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addIA = async (ia: Omit<IA, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await api.post<IA>('/ia/', ia);
      setIAs([created, ...ias]);
      toast.success('Modèle IA créé');
      return created;
    } catch (error: any) {
      console.error('Error adding IA:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors de la création du modèle IA';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateIA = async (id: string, updates: Partial<IA>) => {
    try {
      const updated = await api.patch<IA>(`/ia/${id}/`, updates);
      setIAs(ias.map(x => (x.id === id ? updated : x)));
      toast.success('Modèle IA mis à jour');
      return updated;
    } catch (error: any) {
      console.error('Error updating IA:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteIA = async (id: string) => {
    try {
      await api.delete(`/ia/${id}/`);
      setIAs(ias.filter(x => x.id !== id));
      toast.success('Modèle IA supprimé');
    } catch (error: any) {
      console.error('Error deleting IA:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors de la suppression';
      toast.error(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    fetchIAs();
  }, []);

  return {
    ias,
    loading,
    addIA,
    updateIA,
    deleteIA,
    refreshIA: fetchIAs,
  };
};


