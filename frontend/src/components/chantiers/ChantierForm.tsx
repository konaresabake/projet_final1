import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ChantierFormData {
  projet_id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  budget: number;
  budget_used: number;
  start_date: string;
  end_date: string;
  location: string;
  manager: string;
}

interface ChantierFormProps {
  projetId: string;
  initialData?: Partial<ChantierFormData>;
  onSubmit: (data: ChantierFormData) => void;
  onCancel: () => void;
}

export const ChantierForm = ({ projetId, initialData, onSubmit, onCancel }: ChantierFormProps) => {
  const [formData, setFormData] = useState<ChantierFormData>({
    projet_id: projetId,
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'En cours',
    priority: initialData?.priority || 'Moyenne',
    progress: initialData?.progress || 0,
    budget: initialData?.budget || 0,
    budget_used: initialData?.budget_used || 0,
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    location: initialData?.location || '',
    manager: initialData?.manager || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du chantier *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manager">Responsable *</Label>
          <Input
            id="manager"
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Localisation *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="Planifié">Planifié</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Haute">Haute</SelectItem>
              <SelectItem value="Moyenne">Moyenne</SelectItem>
              <SelectItem value="Basse">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Date de début *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Date de fin *</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (€) *</Label>
          <Input
            id="budget"
            type="number"
            step="0.01"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
            required
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget_used">Budget utilisé (€)</Label>
          <Input
            id="budget_used"
            type="number"
            step="0.01"
            value={formData.budget_used}
            onChange={(e) => setFormData({ ...formData, budget_used: parseFloat(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="progress">Avancement (%)</Label>
        <Input
          id="progress"
          type="number"
          min="0"
          max="100"
          value={formData.progress}
          onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? 'Mettre à jour' : 'Créer'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
      </div>
    </form>
  );
};
