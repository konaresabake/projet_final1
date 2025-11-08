import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Chantier {
  id: string;
  projet_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  avancement_calcule?: number;
  budget: string | number; // Peut être string car coerce_to_string=True
  budget_used: string | number;
  start_date: string;
  end_date: string;
  location: string;
  manager: string;
  created_at: string;
  updated_at: string;
}

export const useChantiers = (projetId?: string) => {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChantiers = async () => {
    try {
      setLoading(true);
      const endpoint = projetId ? `/chantiers/?projet_id=${projetId}` : '/chantiers/';
      const data = await api.get<Chantier[]>(endpoint);
      // S'assurer que data est un tableau et gérer les cas où l'API retourne null ou un objet
      if (Array.isArray(data)) {
        setChantiers(data);
      } else if (data === null || data === undefined) {
        console.warn('Le backend a retourné null, utilisation d\'un tableau vide');
        setChantiers([]);
      } else if (typeof data === 'object' && 'error' in data) {
        toast.error((data as any).error || 'Erreur lors du chargement des chantiers');
        setChantiers([]);
      } else {
        console.warn('Réponse inattendue du backend, tentative de conversion:', data);
        setChantiers([]);
      }
    } catch (error: any) {
      console.error('Error fetching chantiers:', error);
      const errorMessage = error?.response?.data?.error || 
        error?.response?.data?.detail || 
        error?.message || 
        'Erreur lors du chargement des chantiers';
      toast.error(errorMessage);
      setChantiers([]); // Initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const addChantier = async (chantier: Omit<Chantier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Convertir les budgets en nombres si ce sont des strings
      const payload: Record<string, unknown> = {
        ...chantier,
        projet: chantier.projet_id,
      };
      
      // S'assurer que budget et budget_used sont des nombres
      if (typeof payload.budget === 'string') {
        payload.budget = parseFloat(payload.budget as string) || 0;
      }
      if (typeof payload.budget_used === 'string') {
        payload.budget_used = parseFloat(payload.budget_used as string) || 0;
      }
      
      const created = await api.post<Chantier>('/chantiers/', payload);
      setChantiers([created, ...chantiers]);
      toast.success('Chantier créé avec succès');
      return created;
    } catch (error: any) {
      console.error('Error adding chantier:', error);
      const errorMessage = error?.response?.data?.error || 
        Object.values(error?.response?.data || {}).flat().join(', ') || 
        "Erreur lors de la création du chantier";
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateChantier = async (id: string, updates: Partial<Chantier>) => {
    try {
      const payload: any = { ...updates };
      if ((updates as any).projet_id) {
        payload.projet = (updates as any).projet_id;
        delete payload.projet_id;
      }
      const updated = await api.patch<Chantier>(`/chantiers/${id}/`, payload);
      setChantiers(chantiers.map(c => (c.id === id ? updated : c)));
      toast.success('Chantier mis à jour');
      return updated;
    } catch (error) {
      console.error('Error updating chantier:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteChantier = async (id: string) => {
    try {
      await api.delete(`/chantiers/${id}/`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
