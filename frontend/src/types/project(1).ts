export type ProjectStatus = 'En cours' | 'Terminé' | 'En attente' | 'Planifié';
export type ProjectPriority = 'Haute' | 'Moyenne' | 'Basse';
export type TaskStatus = 'completed' | 'in-progress' | 'pending';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  budget: number;
  budgetUsed: number;
  startDate: string;
  endDate: string;
  location: string;
  manager: string;
  team: TeamMember[];
  phases: Phase[];
  documents: Document[];
  activities: Activity[];
}

export interface Phase {
  id: string;
  name: string;
  progress: number;
  status: TaskStatus;
  startDate: string;
  endDate: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface Activity {
  id: string;
  type: 'update' | 'comment' | 'document' | 'milestone';
  description: string;
  user: string;
  timestamp: string;
  projectId: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  projectId?: string;
}
