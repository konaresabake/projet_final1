import { createContext, useCallback, useContext, useMemo, useState, useRef, ReactNode } from 'react';
import { Project, Comment, Activity } from '@/types/project';
import { useProjets, Projet as ApiProjet } from '@/hooks/useProjets';
import { useChantiers, Chantier } from '@/hooks/useChantiers';
import { useBudgets, Budget } from '@/hooks/useBudgets';

type NewProjectInput = Pick<Project, 'name' | 'description' | 'status' | 'priority' | 'budget' | 'startDate' | 'endDate' | 'location' | 'manager'>;

const STATUS_VALUES: Project['status'][] = ['En cours', 'Terminé', 'En attente', 'Planifié'];
const PRIORITY_VALUES: Project['priority'][] = ['Haute', 'Moyenne', 'Basse'];

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  addProject: (project: NewProjectInput) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  comments: Comment[];
  activities: Activity[];
  addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

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
    content: "Quelques ajustements nécessaires sur les plans d'exécution. Je propose une réunion cette semaine.",
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
    description: "Nouveau document ajouté: Plan d'exécution.pdf",
    user: 'Sophie Martin',
    timestamp: '2024-12-14T16:45:00',
    projectId: '1',
  },
];

const ensureDate = (value?: string | null, fallback?: string) => {
  if (value) {
    return value;
  }
  if (fallback) {
    return fallback;
  }
  return new Date().toISOString().slice(0, 10);
};

const mapPhaseStatus = (status: string): 'completed' | 'in-progress' | 'pending' => {
  const normalized = status?.toLowerCase() ?? '';
  if (['terminé', 'terminée', 'termine', 'terminee', 'completed', 'achevé', 'achevee'].includes(normalized)) {
    return 'completed';
  }
  if (['en cours', 'in-progress', 'active'].includes(normalized)) {
    return 'in-progress';
  }
  return 'pending';
};

const mapProjetToProject = (
  projet: ApiProjet,
  chantiers: Chantier[],
  budgets: Budget[],
): Project => {
  // Filtrer les chantiers liés au projet - s'assurer que projet_id existe et correspond
  const relatedChantiers = chantiers.filter((chantier) => {
    if (!chantier || !projet) return false;
    return chantier.projet_id === projet.id;
  });
  
  const phases = relatedChantiers.map((chantier) => {
    // Normaliser l'avancement - utiliser avancement_calcule si disponible, sinon progress
    let progressValue = 0;
    if (chantier.avancement_calcule !== undefined && chantier.avancement_calcule !== null) {
      progressValue = Number(chantier.avancement_calcule);
    } else if (chantier.progress !== undefined && chantier.progress !== null) {
      progressValue = Number(chantier.progress);
    }
    // S'assurer que progressValue est entre 0 et 100
    progressValue = Math.max(0, Math.min(100, progressValue));
    
    return {
      id: chantier.id,
      name: chantier.name || '',
      progress: progressValue,
      status: mapPhaseStatus(chantier.status ?? ''),
      startDate: ensureDate(chantier.start_date),
      endDate: ensureDate(chantier.end_date, chantier.start_date),
    };
  });

  // Utilise avancement_calcule du backend si disponible, sinon calcule manuellement
  let progress = 0;
  if (projet.avancement_calcule !== undefined && projet.avancement_calcule !== null) {
    progress = Number(projet.avancement_calcule);
  } else if (phases.length > 0) {
    progress = Math.round(phases.reduce((sum, phase) => sum + (phase.progress ?? 0), 0) / phases.length);
  }
  // S'assurer que progress est entre 0 et 100
  progress = Math.max(0, Math.min(100, progress));

  const budgetRecord = budgets.find((budget) => budget && budget.projet_id === projet.id);

  const rawStatus = projet.status ?? '';
  const status = STATUS_VALUES.includes(rawStatus as Project['status'])
    ? (rawStatus as Project['status'])
    : 'En cours';

  const rawPriority = projet.priority ?? '';
  const priority = PRIORITY_VALUES.includes(rawPriority as Project['priority'])
    ? (rawPriority as Project['priority'])
    : 'Moyenne';

  // Normaliser le budget - s'assurer que c'est un nombre valide
  let budgetValue = 0;
  if (projet.budget !== undefined && projet.budget !== null) {
    if (typeof projet.budget === 'string') {
      budgetValue = parseFloat(projet.budget) || 0;
    } else {
      budgetValue = Number(projet.budget) || 0;
    }
  }

  // Normaliser budgetUsed depuis le budget record
  let budgetUsedValue = 0;
  if (budgetRecord && budgetRecord.montant_depense !== undefined && budgetRecord.montant_depense !== null) {
    if (typeof budgetRecord.montant_depense === 'string') {
      budgetUsedValue = parseFloat(budgetRecord.montant_depense) || 0;
    } else {
      budgetUsedValue = Number(budgetRecord.montant_depense) || 0;
    }
  }

  return {
    id: projet.id,
    name: projet.name || '',
    description: projet.description ?? '',
    status,
    priority,
    progress,
    budget: budgetValue,
    budgetUsed: budgetUsedValue,
    startDate: ensureDate(projet.start_date, projet.created_at?.slice(0, 10)),
    endDate: ensureDate(projet.end_date, projet.start_date ?? projet.created_at?.slice(0, 10)),
    location: projet.location ?? '',
    manager: projet.manager ?? '',
    team: [],
    phases,
    documents: [],
    activities: [],
  };
};

const toApiPayload = (input: Partial<NewProjectInput>): Partial<ApiProjet> => {
  const payload: Partial<ApiProjet> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.budget !== undefined) payload.budget = input.budget;
  if (input.startDate !== undefined) payload.start_date = input.startDate;
  if (input.endDate !== undefined) payload.end_date = input.endDate;
  if (input.location !== undefined) payload.location = input.location;
  if (input.manager !== undefined) payload.manager = input.manager;
  return payload;
};

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const {
    projets,
    loading: projetsLoading,
    addProjet,
    updateProjet,
    deleteProjet,
    refreshProjets,
  } = useProjets();

  const {
    chantiers,
    loading: chantiersLoading,
    refreshChantiers,
  } = useChantiers();

  const {
    budgets,
    loading: budgetsLoading,
    refreshBudgets,
  } = useBudgets();

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const projects = useMemo(() => projets.map((projet) => mapProjetToProject(projet, chantiers, budgets)), [projets, chantiers, budgets]);

  const loading = projetsLoading || chantiersLoading || budgetsLoading;

  // Définir addActivity et addComment avant les callbacks qui les utilisent
  const addComment = useCallback((comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment = {
      ...comment,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setComments((prev) => [newComment, ...prev]);
  }, []);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  }, []);

  const handleAddProject = useCallback(async (project: NewProjectInput) => {
    const payload: Omit<ApiProjet, 'id' | 'created_at' | 'updated_at'> = {
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      budget: project.budget,
      start_date: project.startDate,
      end_date: project.endDate,
      location: project.location,
      manager: project.manager,
    };
    const created = await addProjet(payload);
    // Rafraîchir toutes les données liées
    await Promise.all([
      refreshProjets(),
      refreshChantiers(),
      refreshBudgets(),
    ]);
    // Ajouter une activité
    addActivity({
      type: 'update',
      description: `Nouveau projet créé: ${project.name}`,
      user: 'Vous',
      projectId: created?.id || '',
    });
  }, [addProjet, refreshProjets, refreshChantiers, refreshBudgets, addActivity]);

  const handleUpdateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const payload = toApiPayload(updates);
    await updateProjet(id, payload);
    // Rafraîchir toutes les données liées
    await Promise.all([
      refreshProjets(),
      refreshChantiers(),
      refreshBudgets(),
    ]);
    // Ajouter une activité
    const project = projects.find(p => p.id === id);
    addActivity({
      type: 'update',
      description: `Projet mis à jour: ${project?.name || id}`,
      user: 'Vous',
      projectId: id,
    });
  }, [updateProjet, refreshProjets, refreshChantiers, refreshBudgets, projects, addActivity]);

  const handleDeleteProject = useCallback(async (id: string) => {
    const project = projects.find(p => p.id === id);
    await deleteProjet(id);
    // Rafraîchir toutes les données liées
    await Promise.all([
      refreshProjets(),
      refreshChantiers(),
      refreshBudgets(),
    ]);
    // Ajouter une activité
    addActivity({
      type: 'update',
      description: `Projet supprimé: ${project?.name || id}`,
      user: 'Vous',
      projectId: id,
    });
  }, [deleteProjet, refreshProjets, refreshChantiers, refreshBudgets, projects, addActivity]);

  // Utiliser un ref pour éviter les rafraîchissements multiples simultanés
  const isRefreshingRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_COOLDOWN = 2000; // 2 secondes entre les rafraîchissements

  const refreshProjects = useCallback(async () => {
    const now = Date.now();
    // Si on rafraîchit déjà ou si on vient de rafraîchir, ignorer
    if (isRefreshingRef.current || (now - lastRefreshRef.current < REFRESH_COOLDOWN)) {
      return;
    }

    isRefreshingRef.current = true;
    lastRefreshRef.current = now;

    try {
      await Promise.all([
        refreshProjets(),
        refreshChantiers(),
        refreshBudgets(),
      ]);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshProjets, refreshChantiers, refreshBudgets]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loading,
        addProject: handleAddProject,
        updateProject: handleUpdateProject,
        deleteProject: handleDeleteProject,
        refreshProjects,
        comments,
        activities,
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
