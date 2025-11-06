import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Budget {
  id: string;
  projet_id: string;
  montant_prev: string | number; // Peut être string car coerce_to_string=True
  montant_depense: string | number;
  created_at: string;
  updated_at: string;
}

export const useBudgets = (projetId?: string) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const endpoint = projetId ? `/budgets/?projet_id=${projetId}` : '/budgets/';
      const data = await api.get<Budget[]>(endpoint);
      // S'assurer que data est un tableau et gérer les cas où l'API retourne null ou un objet
      if (Array.isArray(data)) {
        setBudgets(data);
      } else if (data === null || data === undefined) {
        console.warn('Le backend a retourné null, utilisation d\'un tableau vide');
        setBudgets([]);
      } else if (typeof data === 'object' && 'error' in data) {
        toast.error((data as any).error || 'Erreur lors du chargement des budgets');
        setBudgets([]);
      } else {
        console.warn('Réponse inattendue du backend, tentative de conversion:', data);
        setBudgets([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching budgets:', error);
      const errorMessage = (error as { response?: { data?: { error?: string; detail?: string }; message?: string } })?.response?.data?.error || 
        (error as { response?: { data?: { error?: string; detail?: string }; message?: string } })?.response?.data?.detail ||
        (error as { message?: string })?.message || 
        'Erreur lors du chargement des budgets';
      toast.error(errorMessage);
      setBudgets([]); // Initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'projet_id'> & { projet: string }) => {
    try {
      const created = await api.post<Budget>('/budgets/', budget);
      setBudgets([created, ...budgets]);
      toast.success('Budget créé');
      return created;
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error('Erreur lors de la création du budget');
      throw error;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget> & { projet?: string }) => {
    try {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.projet) {
        payload.projet = updates.projet;
      }
      const updated = await api.patch<Budget>(`/budgets/${id}/`, payload);
      setBudgets(budgets.map(b => (b.id === id ? updated : b)));
      toast.success('Budget mis à jour');
      return updated;
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}/`);
      setBudgets(budgets.filter(b => b.id !== id));
      toast.success('Budget supprimé');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetId]);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    refreshBudgets: fetchBudgets,
  };
};


