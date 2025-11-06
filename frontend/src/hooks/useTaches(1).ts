import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'taches';

export const useTaches = (lotId?: string) => {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTaches = () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      const allTaches: Tache[] = stored ? JSON.parse(stored) : [];
      const filtered = lotId 
        ? allTaches.filter(t => t.lot_id === lotId)
        : allTaches;
      setTaches(filtered);
    } catch (error) {
      console.error('Error fetching taches:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const addTache = async (tache: Omit<Tache, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allTaches: Tache[] = stored ? JSON.parse(stored) : [];
      
      const newTache: Tache = {
        ...tache,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updated = [newTache, ...allTaches];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setTaches([newTache, ...taches]);
      toast.success('Tâche créée avec succès');
      return newTache;
    } catch (error) {
      console.error('Error adding tache:', error);
      toast.error('Erreur lors de la création de la tâche');
      throw error;
    }
  };

  const updateTache = async (id: string, updates: Partial<Tache>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allTaches: Tache[] = stored ? JSON.parse(stored) : [];
      
      const updated = allTaches.map(t => 
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setTaches(taches.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
      toast.success('Tâche mise à jour');
      return updated.find(t => t.id === id);
    } catch (error) {
      console.error('Error updating tache:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteTache = async (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allTaches: Tache[] = stored ? JSON.parse(stored) : [];
      
      const updated = allTaches.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
