import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Mail, Phone, MapPin } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";

const Teams = () => {
  const { teamMembers, projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectsForMember = (memberId: string) => {
    return projects
      .filter(project => project.team.some(t => t.id === memberId))
      .map(p => p.name);
  };

  const departments = [
    { name: "Direction", count: 3 },
    { name: "Architecture", count: 5 },
    { name: "Ingénierie", count: 12 },
    { name: "Construction", count: 8 },
    { name: "Qualité & Sécurité", count: 6 },
  ];

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
            <Button className="w-fit">
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un membre
            </Button>
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
                        onClick={() => toast.info(`Contacter ${member.name}`)}
                      >
                        Contacter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => toast.info('Fonctionnalité à venir')}
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
          <Card>
            <CardHeader>
              <CardTitle>Organigramme</CardTitle>
              <CardDescription>Structure hiérarchique de l'organisation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Direction */}
                <div className="text-center">
                  <div className="inline-block p-4 bg-primary/10 rounded-lg border-2 border-primary">
                    <p className="font-semibold">Direction Générale</p>
                    <p className="text-sm text-muted-foreground">3 membres</p>
                  </div>
                </div>

                {/* Departments */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {["Architecture", "Ingénierie", "Construction", "Qualité"].map((dept, idx) => (
                    <div key={idx} className="text-center">
                      <div className="h-12 border-l-2 border-primary mx-auto w-0 mb-4" />
                      <div className="p-3 bg-muted rounded-lg border">
                        <p className="font-medium text-sm">{dept}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.floor(Math.random() * 10) + 3} membres
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Teams;
