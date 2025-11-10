import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileEdit, UserPlus, Upload, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";

const Traceability = () => {
  const { activities } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredActivities = activities.filter(activity =>
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'update': return FileEdit;
      case 'comment': return MessageSquare;
      case 'document': return Upload;
      case 'milestone': return CheckCircle2;
      default: return AlertCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'update': return 'text-primary';
      case 'comment': return 'text-accent';
      case 'document': return 'text-warning';
      case 'milestone': return 'text-success';
      default: return 'text-destructive';
    }
  };

  const mockActivities = [
    {
      id: 1,
      type: "modification",
      action: "Mise à jour du budget",
      user: "Marie Dubois",
      project: "École Primaire Centrale",
      details: "Budget modifié de 2.3M XOF à 2.5M XOF",
      timestamp: "2025-11-08 14:30",
      icon: FileEdit,
      color: "text-primary",
    },
    {
      id: 2,
      type: "document",
      action: "Document ajouté",
      user: "Jean Martin",
      project: "Hôpital Régional",
      details: "Plans architecturaux phase 2 téléversés",
      timestamp: "2025-11-08 11:15",
      icon: Upload,
      color: "text-accent",
    },
    {
      id: 3,
      type: "validation",
      action: "Phase validée",
      user: "Sophie Laurent",
      project: "École Primaire Centrale",
      details: "Validation: Fondations terminées",
      timestamp: "2025-11-07 16:45",
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      id: 4,
      type: "team",
      action: "Membre ajouté",
      user: "Pierre Durand",
      project: "Bâtiment Administratif",
      details: "Lucas Bernard ajouté comme ingénieur",
      timestamp: "2025-11-07 10:20",
      icon: UserPlus,
      color: "text-warning",
    },
    {
      id: 5,
      type: "alert",
      action: "Alerte créée",
      user: "Système",
      project: "Hôpital Régional",
      details: "Retard potentiel détecté sur phase installations",
      timestamp: "2025-11-06 15:00",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      id: 6,
      type: "modification",
      action: "Échéance modifiée",
      user: "Marie Dubois",
      project: "Bâtiment Administratif",
      details: "Date de fin reportée au 15/02/2026",
      timestamp: "2025-11-06 09:30",
      icon: FileEdit,
      color: "text-primary",
    },
    {
      id: 7,
      type: "document",
      action: "Document mis à jour",
      user: "Jean Martin",
      project: "École Primaire Centrale",
      details: "Révision des plans électriques",
      timestamp: "2025-11-05 14:00",
      icon: Upload,
      color: "text-accent",
    },
    {
      id: 8,
      type: "validation",
      action: "Inspection réalisée",
      user: "Inspecteur Régional",
      project: "Route Nationale N12",
      details: "Inspection conforme - Rapport disponible",
      timestamp: "2025-11-05 11:30",
      icon: CheckCircle2,
      color: "text-success",
    },
  ];

  const getActionType = (type: string) => {
    switch (type) {
      case "modification":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Modification</Badge>;
      case "document":
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Document</Badge>;
      case "validation":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Validation</Badge>;
      case "team":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Équipe</Badge>;
      case "alert":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Alerte</Badge>;
      default:
        return <Badge variant="outline">Action</Badge>;
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Utilisateur', 'Type', 'Description'];
      const rows = filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleString('fr-FR'),
        activity.user,
        activity.type,
        activity.description
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `traçabilité_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export CSV réussi');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportToExcel = () => {
    try {
      const headers = ['Date', 'Utilisateur', 'Type', 'Description'];
      const rows = filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleString('fr-FR'),
        activity.user,
        activity.type,
        activity.description
      ]);

      const csvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `traçabilité_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const exportToPDF = () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Traçabilité - ${new Date().toLocaleDateString('fr-FR')}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Historique de Traçabilité</h1>
            <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${filteredActivities.map(activity => `
                  <tr>
                    <td>${new Date(activity.timestamp).toLocaleString('fr-FR')}</td>
                    <td>${activity.user}</td>
                    <td>${activity.type}</td>
                    <td>${activity.description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `traçabilité_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export HTML réussi (ouvrez dans votre navigateur et imprimez en PDF)');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Traçabilité</h1>
            <p className="text-muted-foreground">
              Historique complet de toutes les actions et modifications
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{activities.length}</p>
                <p className="text-sm text-muted-foreground">Actions totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{activities.filter(a => a.type === 'update').length}</p>
                <p className="text-sm text-muted-foreground">Modifications</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{activities.filter(a => a.type === 'document').length}</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{activities.filter(a => a.type === 'milestone').length}</p>
                <p className="text-sm text-muted-foreground">Jalons</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{activities.filter(a => a.type === 'comment').length}</p>
                <p className="text-sm text-muted-foreground">Commentaires</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Rechercher dans l'historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par projet, utilisateur ou action..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Tous</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Modifications</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Documents</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Validations</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Alertes</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Journal des activités</CardTitle>
              <CardDescription>Historique chronologique de toutes les opérations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredActivities.map((activity, idx) => {
                  const Icon = getActivityIcon(activity.type);
                  const color = getActivityColor(activity.type);
                  return (
                    <div key={activity.id} className="relative pl-8 pb-8 last:pb-0">
                      {idx !== filteredActivities.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
                      )}
                      
                      <div className={`absolute left-0 top-1 h-8 w-8 rounded-full bg-background border-2 flex items-center justify-center ${
                        activity.type === "update" ? "border-primary" :
                        activity.type === "document" ? "border-accent" :
                        activity.type === "milestone" ? "border-success" :
                        activity.type === "comment" ? "border-warning" :
                        "border-destructive"
                      }`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>

                      <div className="bg-card border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{activity.description}</h3>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                            {new Date(activity.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{activity.user}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Exporter l'historique</CardTitle>
              <CardDescription>Téléchargez un rapport d'audit complet</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  try {
                    exportToPDF();
                  } catch (error) {
                    console.error('Error exporting PDF:', error);
                  }
                }}
              >
                Exporter en PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  try {
                    exportToExcel();
                  } catch (error) {
                    console.error('Error exporting Excel:', error);
                  }
                }}
              >
                Exporter en Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  try {
                    exportToCSV();
                  } catch (error) {
                    console.error('Error exporting CSV:', error);
                  }
                }}
              >
                Exporter en CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Traceability;
