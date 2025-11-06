import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Projet {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'projets';

export const useProjets = () => {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjets = () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      setProjets(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error fetching projets:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const addProjet = async (projet: Omit<Projet, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProjet: Projet = {
        ...projet,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updated = [newProjet, ...projets];
      setProjets(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success('Projet créé avec succès');
      return newProjet;
    } catch (error) {
      console.error('Error adding projet:', error);
      toast.error('Erreur lors de la création du projet');
      throw error;
    }
  };

  const updateProjet = async (id: string, updates: Partial<Projet>) => {
    try {
      const updated = projets.map(p => 
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      );
      setProjets(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success('Projet mis à jour');
      return updated.find(p => p.id === id);
    } catch (error) {
      console.error('Error updating projet:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteProjet = async (id: string) => {
    try {
      const updated = projets.filter(p => p.id !== id);
      setProjets(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
