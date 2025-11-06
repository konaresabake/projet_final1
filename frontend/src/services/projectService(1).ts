import api from '@/lib/api';
import type { Project } from '@/types/project';

// Project API endpoints
export const projectService = {
  // Get all projects
  getAll: async () => {
    try {
      return await api.get<Project[]>('/api/projects');
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  },

  // Get single project by ID
  getById: async (id: string) => {
    try {
      return await api.get<Project>(`/api/projects/${id}`);
    } catch (error) {
      console.error(`Failed to fetch project ${id}:`, error);
      throw error;
    }
  },

  // Create new project
  create: async (project: Omit<Project, 'id'>) => {
    try {
      return await api.post<Project>('/api/projects', project);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  // Update project
  update: async (id: string, updates: Partial<Project>) => {
    try {
      return await api.put<Project>(`/api/projects/${id}`, updates);
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error);
      throw error;
    }
  },

  // Delete project
  delete: async (id: string) => {
    try {
      return await api.delete(`/api/projects/${id}`);
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error);
      throw error;
    }
  },

  // Get project statistics
  getStats: async () => {
    try {
      return await api.get('/api/projects/stats');
    } catch (error) {
      console.error('Failed to fetch project stats:', error);
      throw error;
    }
  },
};

export default projectService;
