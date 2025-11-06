import { api } from '@/lib/api';
import type { Projet } from '@/hooks/useProjets';

type ApiProjectInput = Omit<Projet, 'id' | 'created_at' | 'updated_at'>;

const BASE_PATH = '/projets/';

export const projectService = {
  getAll: async (): Promise<Projet[]> => {
    try {
      return await api.get<Projet[]>(BASE_PATH);
    } catch (error) {
      console.error('Failed to fetch projets:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Projet> => {
    try {
      return await api.get<Projet>(`${BASE_PATH}${id}/`);
    } catch (error) {
      console.error(`Failed to fetch projet ${id}:`, error);
      throw error;
    }
  },

  create: async (projet: ApiProjectInput): Promise<Projet> => {
    try {
      return await api.post<Projet>(BASE_PATH, projet);
    } catch (error) {
      console.error('Failed to create projet:', error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Projet>): Promise<Projet> => {
    try {
      return await api.patch<Projet>(`${BASE_PATH}${id}/`, updates);
    } catch (error) {
      console.error(`Failed to update projet ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`${BASE_PATH}${id}/`);
    } catch (error) {
      console.error(`Failed to delete projet ${id}:`, error);
      throw error;
    }
  },
};

export default projectService;
