import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Mail, Phone } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";

const Teams = () => {
  const { projects } = useProjects();
  const { utilisateurs, loading, addUtilisateur } = useUtilisateurs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ nom: "", email: "", mot_de_passe: "", role: "CHEF_DE_PROJET" as const });

  const normalizedMembers = useMemo(() => {
    const roleLabels: Record<string, string> = {
      ADMINISTRATEUR: "Administrateur",
      MAITRE_OUVRAGE: "Maître d'ouvrage",
      CHEF_DE_PROJET: "Chef de projet",
      MEMBRE_TECHNIQUE: "Membre technique",
    };

    return utilisateurs.map(utilisateur => ({
      id: utilisateur.id,
      name: utilisateur.nom,
      role: roleLabels[utilisateur.role] ?? utilisateur.role,
      email: utilisateur.email,
      phone: "--",
    }));
  }, [utilisateurs]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = normalizedMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectsForMember = (memberId: string) => {
    return projects
      .filter(project => project.team.some(t => t.id === memberId))
      .map(p => p.name);
  };

  // Calculer les départements depuis les rôles réels
  const departments = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    normalizedMembers.forEach(member => {
      const dept = member.role.includes('Administrateur') ? 'Direction' :
                   member.role.includes('Chef') ? 'Direction' :
                   member.role.includes('Maître') ? 'Direction' :
                   member.role.includes('Ingénieur') ? 'Ingénierie' :
                   member.role.includes('Technique') ? 'Ingénierie' : 'Autres';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    return Object.entries(deptCounts).map(([name, count]) => ({ name, count }));
  }, [normalizedMembers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
      case "away":
        return "bg-warning";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online":
        return "En ligne";
      case "away":
        return "Absent";
      default:
        return "Hors ligne";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Équipes</h1>
              <p className="text-muted-foreground">Gérez les membres et leurs rôles</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-fit" 
                  onClick={() => {
                    try {
                      setIsDialogOpen(true);
                    } catch (error) {
                      console.error('Error opening dialog:', error);
                    }
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ajouter un membre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un utilisateur</DialogTitle>
                  <DialogDescription>
                    Créez un nouvel utilisateur pour votre organisation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="nom">Nom complet</label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(event) => setFormData({ ...formData, nom: event.target.value })}
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      placeholder="prenom.nom@buildflow.fr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="password">Mot de passe provisoire</label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.mot_de_passe}
                      onChange={(event) => setFormData({ ...formData, mot_de_passe: event.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rôle</label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMINISTRATEUR">Administrateur</SelectItem>
                        <SelectItem value="MAITRE_OUVRAGE">Maître d'ouvrage</SelectItem>
                        <SelectItem value="CHEF_DE_PROJET">Chef de projet</SelectItem>
                        <SelectItem value="MEMBRE_TECHNIQUE">Membre technique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={async () => {
                      if (!formData.nom || !formData.email || !formData.mot_de_passe) {
                        toast.error("Veuillez remplir tous les champs");
                        return;
                      }
                      try {
                        await addUtilisateur(formData);
                        setFormData({ nom: "", email: "", mot_de_passe: "", role: "CHEF_DE_PROJET" });
                        setIsDialogOpen(false);
                      } catch (error) {
                        toast.error("Impossible de créer l'utilisateur");
                      }
                    }}
                  >
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Departments Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {departments.map((dept, idx) => (
              <Card key={idx} className="hover-lift">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{dept.count}</p>
                  <p className="text-sm text-muted-foreground">{dept.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Rechercher un membre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, rôle ou localisation..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-muted-foreground">
                  Chargement des utilisateurs...
                </CardContent>
              </Card>
            )}
            {!loading && filteredMembers.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucun utilisateur trouvé. Ajoutez un premier membre pour commencer.
                </CardContent>
              </Card>
            )}
            {filteredMembers.map((member, idx) => {
              const memberProjects = getProjectsForMember(member.id);
              const status = idx % 3 === 0 ? 'online' : idx % 3 === 1 ? 'away' : 'offline';
              return (
                <Card key={member.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${getStatusColor(status)}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription>{member.role}</CardDescription>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {getStatusLabel(status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Projets assignés:</p>
                      <div className="flex flex-wrap gap-1">
                        {memberProjects.length > 0 ? memberProjects.map((project, pIdx) => (
                          <Badge key={pIdx} variant="outline" className="text-xs">
                            {project}
                          </Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground">Aucun projet assigné</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          try {
                            toast.info(`Contacter ${member.name}`);
                          } catch (error) {
                            console.error('Error contacting member:', error);
                          }
                        }}
                      >
                        Contacter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          try {
                            toast.info('Fonctionnalité à venir');
                          } catch (error) {
                            console.error('Error:', error);
                          }
                        }}
                      >
                        Profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Organization Chart */}
          {departments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Organigramme</CardTitle>
                <CardDescription>Structure hiérarchique de l'organisation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Direction */}
                  {departments.find(d => d.name === 'Direction') && (
                    <div className="text-center">
                      <div className="inline-block p-4 bg-primary/10 rounded-lg border-2 border-primary">
                        <p className="font-semibold">Direction</p>
                        <p className="text-sm text-muted-foreground">
                          {departments.find(d => d.name === 'Direction')?.count || 0} membre{departments.find(d => d.name === 'Direction')?.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Other Departments */}
                  {departments.filter(d => d.name !== 'Direction').length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {departments.filter(d => d.name !== 'Direction').map((dept) => (
                        <div key={dept.name} className="text-center">
                          <div className="h-12 border-l-2 border-primary mx-auto w-0 mb-4" />
                          <div className="p-3 bg-muted rounded-lg border">
                            <p className="font-medium text-sm">{dept.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {dept.count} membre{dept.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Teams;
