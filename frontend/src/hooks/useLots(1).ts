import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Lot {
  id: string;
  chantier_id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'lots';

export const useLots = (chantierId?: string) => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      const allLots: Lot[] = stored ? JSON.parse(stored) : [];
      const filtered = chantierId 
        ? allLots.filter(l => l.chantier_id === chantierId)
        : allLots;
      setLots(filtered);
    } catch (error) {
      console.error('Error fetching lots:', error);
      toast.error('Erreur lors du chargement des lots');
    } finally {
      setLoading(false);
    }
  };

  const addLot = async (lot: Omit<Lot, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allLots: Lot[] = stored ? JSON.parse(stored) : [];
      
      const newLot: Lot = {
        ...lot,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updated = [newLot, ...allLots];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setLots([newLot, ...lots]);
      toast.success('Lot créé avec succès');
      return newLot;
    } catch (error) {
      console.error('Error adding lot:', error);
      toast.error('Erreur lors de la création du lot');
      throw error;
    }
  };

  const updateLot = async (id: string, updates: Partial<Lot>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allLots: Lot[] = stored ? JSON.parse(stored) : [];
      
      const updated = allLots.map(l => 
        l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setLots(lots.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l));
      toast.success('Lot mis à jour');
      return updated.find(l => l.id === id);
    } catch (error) {
      console.error('Error updating lot:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteLot = async (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allLots: Lot[] = stored ? JSON.parse(stored) : [];
      
      const updated = allLots.filter(l => l.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
