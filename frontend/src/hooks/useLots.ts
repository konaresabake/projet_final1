import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Lot {
  id: string;
  chantier_id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  avancement_calcule?: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export const useLots = (chantierId?: string) => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const endpoint = chantierId ? `/lots/?chantier_id=${chantierId}` : '/lots/';
      const data = await api.get<Lot[]>(endpoint);
      setLots(data);
    } catch (error) {
      console.error('Error fetching lots:', error);
      toast.error('Erreur lors du chargement des lots');
    } finally {
      setLoading(false);
    }
  };

  const addLot = async (lot: Omit<Lot, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const payload: any = { ...lot, chantier: lot.chantier_id };
      const created = await api.post<Lot>('/lots/', payload);
      setLots([created, ...lots]);
      // Rafraîchir pour s'assurer que les calculs d'avancement sont à jour
      await fetchLots();
      toast.success('Lot créé avec succès');
      return created;
    } catch (error) {
      console.error('Error adding lot:', error);
      toast.error('Erreur lors de la création du lot');
      throw error;
    }
  };

  const updateLot = async (id: string, updates: Partial<Lot>) => {
    try {
      const payload: any = { ...updates };
      if ((updates as any).chantier_id) {
        payload.chantier = (updates as any).chantier_id;
        delete payload.chantier_id;
      }
      const updated = await api.patch<Lot>(`/lots/${id}/`, payload);
      setLots(lots.map(l => (l.id === id ? updated : l)));
      // Rafraîchir pour s'assurer que les calculs d'avancement sont à jour
      await fetchLots();
      toast.success('Lot mis à jour');
      return updated;
    } catch (error) {
      console.error('Error updating lot:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteLot = async (id: string) => {
    try {
      await api.delete(`/lots/${id}/`);
      setLots(lots.filter(l => l.id !== id));
      toast.success('Lot supprimé');
    } catch (error) {
      console.error('Error deleting lot:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchLots();
  }, [chantierId]);

  return {
    lots,
    loading,
    addLot,
    updateLot,
    deleteLot,
    refreshLots: fetchLots,
  };
};
