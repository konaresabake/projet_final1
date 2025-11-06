import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Tache {
  id: string;
  lot_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string | null;
  assigned_to: string | null;
  start_date: string | null;
  end_date: string | null;
  cost?: string | number; // Peut être string car coerce_to_string=True
  progress?: number;
  created_at: string;
  updated_at: string;
}

export const useTaches = (lotId?: string) => {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTaches = async () => {
    try {
      setLoading(true);
      const endpoint = lotId ? `/taches/?lot_id=${lotId}` : '/taches/';
      const data = await api.get<Tache[]>(endpoint);
      setTaches(data);
    } catch (error) {
      console.error('Error fetching taches:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const addTache = async (tache: Omit<Tache, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const payload: any = { ...tache, lot: tache.lot_id };
      const created = await api.post<Tache>('/taches/', payload);
      setTaches([created, ...taches]);
      toast.success('Tâche créée avec succès');
      return created;
    } catch (error) {
      console.error('Error adding tache:', error);
      toast.error('Erreur lors de la création de la tâche');
      throw error;
    }
  };

  const updateTache = async (id: string, updates: Partial<Tache>) => {
    try {
      const payload: any = { ...updates };
      if ((updates as any).lot_id) {
        payload.lot = (updates as any).lot_id;
        delete payload.lot_id;
      }
      const updated = await api.patch<Tache>(`/taches/${id}/`, payload);
      setTaches(taches.map(t => (t.id === id ? updated : t)));
      toast.success('Tâche mise à jour');
      return updated;
    } catch (error) {
      console.error('Error updating tache:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteTache = async (id: string) => {
    try {
      await api.delete(`/taches/${id}/`);
      setTaches(taches.filter(t => t.id !== id));
      toast.success('Tâche supprimée');
    } catch (error) {
      console.error('Error deleting tache:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchTaches();
  }, [lotId]);

  return {
    taches,
    loading,
    addTache,
    updateTache,
    deleteTache,
    refreshTaches: fetchTaches,
  };
};
