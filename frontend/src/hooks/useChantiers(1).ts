import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Chantier {
  id: string;
  projet_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  budget: number;
  budget_used: number;
  start_date: string;
  end_date: string;
  location: string;
  manager: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'chantiers';

export const useChantiers = (projetId?: string) => {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChantiers = () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      const allChantiers: Chantier[] = stored ? JSON.parse(stored) : [];
      const filtered = projetId 
        ? allChantiers.filter(c => c.projet_id === projetId)
        : allChantiers;
      setChantiers(filtered);
    } catch (error) {
      console.error('Error fetching chantiers:', error);
      toast.error('Erreur lors du chargement des chantiers');
    } finally {
      setLoading(false);
    }
  };

  const addChantier = async (chantier: Omit<Chantier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allChantiers: Chantier[] = stored ? JSON.parse(stored) : [];
      
      const newChantier: Chantier = {
        ...chantier,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updated = [newChantier, ...allChantiers];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setChantiers([newChantier, ...chantiers]);
      toast.success('Chantier créé avec succès');
      return newChantier;
    } catch (error) {
      console.error('Error adding chantier:', error);
      toast.error('Erreur lors de la création du chantier');
      throw error;
    }
  };

  const updateChantier = async (id: string, updates: Partial<Chantier>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allChantiers: Chantier[] = stored ? JSON.parse(stored) : [];
      
      const updated = allChantiers.map(c => 
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setChantiers(chantiers.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
      toast.success('Chantier mis à jour');
      return updated.find(c => c.id === id);
    } catch (error) {
      console.error('Error updating chantier:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteChantier = async (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allChantiers: Chantier[] = stored ? JSON.parse(stored) : [];
      
      const updated = allChantiers.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setChantiers(chantiers.filter(c => c.id !== id));
      toast.success('Chantier supprimé');
    } catch (error) {
      console.error('Error deleting chantier:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchChantiers();
  }, [projetId]);

  return {
    chantiers,
    loading,
    addChantier,
    updateChantier,
    deleteChantier,
    refreshChantiers: fetchChantiers,
  };
};
