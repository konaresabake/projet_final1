import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Alerte {
  id: string;
  projet_id: string;
  ia_id: string | null;
  ia: string | null;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  date: string;
  statut: string;
  created_at: string;
  updated_at: string;
}

export const useAlertes = (projetId?: string) => {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertes = async () => {
    try {
      setLoading(true);
      const endpoint = projetId ? `/alertes/?projet_id=${projetId}` : '/alertes/';
      const data = await api.get<Alerte[]>(endpoint);
      setAlertes(data);
    } catch (error: any) {
      console.error('Error fetching alertes:', error);
      const errorMessage = error?.response?.data?.error || 'Erreur lors du chargement des alertes';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addAlerte = async (alerte: Omit<Alerte, 'id' | 'created_at' | 'updated_at' | 'projet_id' | 'ia_id'> & { projet: string; ia?: string | null }) => {
    try {
      const payload: Record<string, unknown> = {
        ...alerte,
        projet: alerte.projet,
      };
      if (alerte.ia) {
        payload.ia = alerte.ia;
      }
      const created = await api.post<Alerte>('/alertes/', payload);
      setAlertes([created, ...alertes]);
      toast.success('Alerte créée');
      return created;
    } catch (error: any) {
      console.error('Error adding alerte:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || "Erreur lors de la création de l'alerte";
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateAlerte = async (id: string, updates: Partial<Alerte> & { projet?: string; ia?: string | null }) => {
    try {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.projet) {
        payload.projet = updates.projet;
      }
      if (updates.ia !== undefined) {
        payload.ia = updates.ia;
      }
      const updated = await api.patch<Alerte>(`/alertes/${id}/`, payload);
      setAlertes(alertes.map(a => (a.id === id ? updated : a)));
      toast.success('Alerte mise à jour');
      return updated;
    } catch (error: any) {
      console.error('Error updating alerte:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteAlerte = async (id: string) => {
    try {
      await api.delete(`/alertes/${id}/`);
      setAlertes(alertes.filter(a => a.id !== id));
      toast.success('Alerte supprimée');
    } catch (error) {
      console.error('Error deleting alerte:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchAlertes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetId]);

  return {
    alertes,
    loading,
    addAlerte,
    updateAlerte,
    deleteAlerte,
    refreshAlertes: fetchAlertes,
  };
};


