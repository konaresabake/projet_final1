import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  mot_de_passe?: string;
  role: 'ADMINISTRATEUR' | 'MAITRE_OUVRAGE' | 'CHEF_DE_PROJET' | 'MEMBRE_TECHNIQUE';
  is_approved?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export const useUtilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUtilisateurs = async () => {
    try {
      setLoading(true);
      const data = await api.get<Utilisateur[]>('/utilisateurs/');
      // S'assurer que data est un tableau
      setUtilisateurs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching utilisateurs:', error);
      // Ne pas afficher de toast pour les erreurs 404 ou de connexion réseau
      const apiError = error as { response?: { status?: number; data?: { error?: string } }; message?: string };
      const isNetworkError = apiError?.response?.status === 404 || 
                            apiError?.response?.status === 0 ||
                            apiError?.message === 'Failed to fetch';
      
      if (!isNetworkError) {
        const errorMessage = apiError?.response?.data?.error || 'Erreur lors du chargement des utilisateurs';
        toast.error(errorMessage);
      }
      setUtilisateurs([]); // Toujours initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const addUtilisateur = async (utilisateur: Omit<Utilisateur, 'id' | 'created_at' | 'updated_at' | 'is_approved' | 'is_active'> & { mot_de_passe: string }) => {
    try {
      const created = await api.post<Utilisateur>('/utilisateurs/', utilisateur);
      setUtilisateurs([created, ...utilisateurs]);
      toast.success('Utilisateur créé');
      return created;
    } catch (error: any) {
      console.error('Error adding utilisateur:', error);
      const errorMessage = error?.response?.data?.error || 
        Object.values(error?.response?.data || {}).flat().join(', ') || 
        "Erreur lors de la création de l'utilisateur";
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateUtilisateur = async (id: string, updates: Partial<Utilisateur>) => {
    try {
      const updated = await api.patch<Utilisateur>(`/utilisateurs/${id}/`, updates);
      setUtilisateurs(utilisateurs.map(u => (u.id === id ? updated : u)));
      toast.success('Utilisateur mis à jour');
      return updated;
    } catch (error) {
      console.error('Error updating utilisateur:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteUtilisateur = async (id: string) => {
    try {
      await api.delete(`/utilisateurs/${id}/`);
      setUtilisateurs(utilisateurs.filter(u => u.id !== id));
      toast.success('Utilisateur supprimé');
    } catch (error) {
      console.error('Error deleting utilisateur:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  return {
    utilisateurs,
    loading,
    addUtilisateur,
    updateUtilisateur,
    deleteUtilisateur,
    refreshUtilisateurs: fetchUtilisateurs,
  };
};


