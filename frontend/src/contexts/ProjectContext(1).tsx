import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Comment, Activity, TeamMember } from '@/types/project';

interface ProjectContextType {
  projects: Project[];
  comments: Comment[];
  activities: Activity[];
  teamMembers: TeamMember[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Construction du Pont de la Seine',
    description: 'Projet de construction d\'un nouveau pont pour améliorer la circulation urbaine',
    status: 'En cours',
    priority: 'Haute',
    progress: 65,
    budget: 15000000,
    budgetUsed: 9750000,
    startDate: '2024-01-15',
    endDate: '2025-06-30',
    location: 'Paris, Île-de-France',
    manager: 'Sophie Martin',
    team: [
      { id: '1', name: 'Sophie Martin', role: 'Chef de Projet', email: 'sophie.martin@buildflow.fr', phone: '06 12 34 56 78' },
      { id: '2', name: 'Jean Dupont', role: 'Ingénieur Structure', email: 'jean.dupont@buildflow.fr', phone: '06 23 45 67 89' },
    ],
    phases: [
      { id: '1', name: 'Études préliminaires', progress: 100, status: 'completed', startDate: '2024-01-15', endDate: '2024-03-30' },
      { id: '2', name: 'Fondations', progress: 100, status: 'completed', startDate: '2024-04-01', endDate: '2024-08-15' },
      { id: '3', name: 'Structure principale', progress: 75, status: 'in-progress', startDate: '2024-08-16', endDate: '2025-03-30' },
      { id: '4', name: 'Finitions', progress: 0, status: 'pending', startDate: '2025-04-01', endDate: '2025-06-30' },
    ],
    documents: [
      { id: '1', name: 'Plan d\'exécution.pdf', type: 'PDF', size: '2.5 MB', uploadedBy: 'Sophie Martin', uploadedAt: '2024-01-20' },
    ],
    activities: [],
  },
  {
    id: '2',
    name: 'Rénovation Gare Centrale',
    description: 'Modernisation complète de la gare centrale avec nouvelles installations',
    status: 'En cours',
    priority: 'Haute',
    progress: 42,
    budget: 8500000,
    budgetUsed: 3570000,
    startDate: '2024-03-01',
    endDate: '2025-08-31',
    location: 'Lyon, Auvergne-Rhône-Alpes',
    manager: 'Marc Leblanc',
    team: [
      { id: '3', name: 'Marc Leblanc', role: 'Chef de Projet', email: 'marc.leblanc@buildflow.fr', phone: '06 34 56 78 90' },
    ],
    phases: [
      { id: '1', name: 'Démolition', progress: 100, status: 'completed', startDate: '2024-03-01', endDate: '2024-05-15' },
      { id: '2', name: 'Reconstruction', progress: 60, status: 'in-progress', startDate: '2024-05-16', endDate: '2025-08-31' },
    ],
    documents: [],
    activities: [],
  },
  {
    id: '3',
    name: 'Ligne Métro Extension Nord',
    description: 'Extension de 5 km de la ligne de métro vers les quartiers nord',
    status: 'Planifié',
    priority: 'Moyenne',
    progress: 15,
    budget: 25000000,
    budgetUsed: 1250000,
    startDate: '2024-06-01',
    endDate: '2026-12-31',
    location: 'Marseille, PACA',
    manager: 'Claire Dubois',
    team: [
      { id: '4', name: 'Claire Dubois', role: 'Chef de Projet', email: 'claire.dubois@buildflow.fr', phone: '06 45 67 89 01' },
    ],
    phases: [
      { id: '1', name: 'Études de faisabilité', progress: 80, status: 'in-progress', startDate: '2024-06-01', endDate: '2024-12-31' },
      { id: '2', name: 'Excavation', progress: 0, status: 'pending', startDate: '2025-01-01', endDate: '2025-12-31' },
    ],
    documents: [],
    activities: [],
  },
];

const initialComments: Comment[] = [
  {
    id: '1',
    author: 'Sophie Martin',
    content: 'Les travaux de fondation sont terminés. Nous passons à la phase suivante dès lundi.',
    timestamp: '2024-12-15T10:30:00',
    projectId: '1',
  },
  {
    id: '2',
    author: 'Jean Dupont',
    content: 'Quelques ajustements nécessaires sur les plans d\'exécution. Je propose une réunion cette semaine.',
    timestamp: '2024-12-14T14:20:00',
    projectId: '1',
  },
];

const initialActivities: Activity[] = [
  {
    id: '1',
    type: 'update',
    description: 'Mise à jour du planning: Phase "Fondations" terminée',
    user: 'Sophie Martin',
    timestamp: '2024-12-15T10:30:00',
    projectId: '1',
  },
  {
    id: '2',
    type: 'document',
    description: 'Nouveau document ajouté: Plan d\'exécution.pdf',
    user: 'Sophie Martin',
    timestamp: '2024-12-14T16:45:00',
    projectId: '1',
  },
];

const initialTeamMembers: TeamMember[] = [
  { id: '1', name: 'Sophie Martin', role: 'Chef de Projet', email: 'sophie.martin@buildflow.fr', phone: '06 12 34 56 78' },
  { id: '2', name: 'Jean Dupont', role: 'Ingénieur Structure', email: 'jean.dupont@buildflow.fr', phone: '06 23 45 67 89' },
  { id: '3', name: 'Marc Leblanc', role: 'Chef de Projet', email: 'marc.leblanc@buildflow.fr', phone: '06 34 56 78 90' },
  { id: '4', name: 'Claire Dubois', role: 'Chef de Projet', email: 'claire.dubois@buildflow.fr', phone: '06 45 67 89 01' },
  { id: '5', name: 'Pierre Durand', role: 'Architecte', email: 'pierre.durand@buildflow.fr', phone: '06 56 78 90 12' },
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [teamMembers] = useState<TeamMember[]>(initialTeamMembers);

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: generateId() };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const addComment = (comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment = {
      ...comment,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setComments([newComment, ...comments]);
  };

  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setActivities([newActivity, ...activities]);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        comments,
        activities,
        teamMembers,
        addProject,
        updateProject,
        deleteProject,
        addComment,
        addActivity,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within ProjectProvider');
  }
  return context;
};
