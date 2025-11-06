import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, FileText, File, Image, Download, Eye } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";

const Documents = () => {
  const { projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");

  // Aggregate all documents from all projects
  const allDocuments = projects.flatMap(project => 
    project.documents.map(doc => ({
      ...doc,
      projectName: project.name,
      category: doc.type.includes('Plan') ? 'Plans' : 
                doc.type.includes('Contrat') ? 'Contrats' :
                doc.type.includes('Rapport') ? 'Rapports' :
                doc.type.includes('Photo') ? 'Photos' : 'Finances'
    }))
  );

  const documents = allDocuments.length > 0 ? allDocuments : [
    { name: "Plans architecturaux - École Primaire", type: "PDF", size: "12.5 MB", date: "15/01/2025", category: "Plans" },
    { name: "Permis de construire - Hôpital", type: "PDF", size: "2.3 MB", date: "10/01/2025", category: "Administratif" },
    { name: "Contrat entreprise générale", type: "DOCX", size: "850 KB", date: "08/01/2025", category: "Contrats" },
    { name: "Rapport inspection N°1", type: "PDF", size: "1.2 MB", date: "05/11/2025", category: "Rapports" },
    { name: "Photos chantier - Nov 2025", type: "ZIP", size: "45 MB", date: "03/11/2025", category: "Photos" },
    { name: "Devis matériaux phase 2", type: "XLSX", size: "520 KB", date: "28/10/2025", category: "Finances" },
    { name: "PV réunion chantier #12", type: "PDF", size: "340 KB", date: "25/10/2025", category: "Réunions" },
    { name: "Plan sécurité et santé", type: "PDF", size: "3.8 MB", date: "20/10/2025", category: "Sécurité" },
    { name: "Facture travaux Octobre", type: "PDF", size: "680 KB", date: "15/10/2025", category: "Finances" },
  ];

  const categories = [
    { name: "Plans", count: allDocuments.filter(d => d.category === 'Plans').length, color: "bg-primary" },
    { name: "Contrats", count: allDocuments.filter(d => d.category === 'Contrats').length, color: "bg-accent" },
    { name: "Rapports", count: allDocuments.filter(d => d.category === 'Rapports').length, color: "bg-success" },
    { name: "Photos", count: allDocuments.filter(d => d.category === 'Photos').length, color: "bg-warning" },
    { name: "Finances", count: allDocuments.filter(d => d.category === 'Finances').length, color: "bg-destructive" },
  ];

  const handleUpload = () => {
    toast.success('Fonctionnalité de téléversement à venir');
  };

  const handleView = (docName: string) => {
    toast.info(`Ouverture de ${docName}`);
  };

  const handleDownload = (docName: string) => {
    toast.success(`Téléchargement de ${docName}`);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-destructive" />;
      case "DOCX":
        return <FileText className="h-5 w-5 text-primary" />;
      case "XLSX":
        return <File className="h-5 w-5 text-success" />;
      case "ZIP":
        return <Image className="h-5 w-5 text-warning" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gestion documentaire</h1>
              <p className="text-muted-foreground">Centralisez et organisez tous vos documents projet</p>
            </div>
            <Button className="w-fit" onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Téléverser des fichiers
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat, idx) => (
              <Card key={idx} className="hover-lift">
                <CardContent className="p-4">
                  <div className={`h-10 w-10 rounded-full ${cat.color} bg-opacity-10 flex items-center justify-center mb-2`}>
                    <FileText className="h-5 w-5" style={{ color: `hsl(var(--${cat.color.slice(3)}))` }} />
                  </div>
                  <p className="text-2xl font-bold">{cat.count}</p>
                  <p className="text-sm text-muted-foreground">{cat.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Rechercher des documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou catégorie..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tous les documents</CardTitle>
                  <CardDescription>{filteredDocuments.length} fichiers trouvés</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{doc.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{doc.category || doc.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {doc.size} • {'uploadedAt' in doc ? new Date(doc.uploadedAt).toLocaleDateString('fr-FR') : doc.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleView(doc.name)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upload Zone */}
          <Card className="border-dashed">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Glissez-déposez vos fichiers ici</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou cliquez pour parcourir vos fichiers
                  </p>
                  <Button onClick={handleUpload}>Sélectionner des fichiers</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: PDF, DOCX, XLSX, JPG, PNG, ZIP (max 50MB)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Documents;
