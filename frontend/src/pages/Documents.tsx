import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, FileText, File, Image, Download, Eye } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import type { Document } from "@/types/project";

interface LocalDocument extends Document {
  projectName?: string;
  category?: string;
  file?: File;
  date?: string;
}

const Documents = () => {
  const { projects, refreshProjects, addActivity } = useProjects();
  const location = useLocation();

  // Rafraîchir les données quand on arrive sur la page (une seule fois)
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshProjects();
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<LocalDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  // Fonction pour convertir un File en Document
  const fileToDocument = (file: File): LocalDocument => {
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
    const fileType = fileExtension === 'PDF' ? 'PDF' :
                     fileExtension === 'DOCX' || fileExtension === 'DOC' ? 'DOCX' :
                     fileExtension === 'XLSX' || fileExtension === 'XLS' ? 'XLSX' :
                     fileExtension === 'ZIP' ? 'ZIP' :
                     fileExtension === 'JPG' || fileExtension === 'JPEG' || fileExtension === 'PNG' ? 'Image' :
                     fileExtension;
    
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    const category = fileType.includes('Plan') ? 'Plans' : 
                    fileType.includes('Contrat') ? 'Contrats' :
                    fileType.includes('Rapport') ? 'Rapports' :
                    fileType.includes('Photo') || fileType === 'Image' ? 'Photos' : 
                    fileType.includes('Finance') ? 'Finances' : 'Autres';

    return {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: fileType,
      size: `${sizeInMB} MB`,
      uploadedBy: 'Vous', // Vous pouvez récupérer le nom de l'utilisateur connecté
      uploadedAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('fr-FR'),
      category,
      file, // Garder la référence au fichier pour le téléchargement
    };
  };

  // Aggregate all documents from all projects + documents téléversés localement
  const allDocuments = [
    ...projects.flatMap(project => 
      project.documents.map(doc => ({
        ...doc,
        projectName: project.name,
        category: doc.type?.includes('Plan') ? 'Plans' : 
                  doc.type?.includes('Contrat') ? 'Contrats' :
                  doc.type?.includes('Rapport') ? 'Rapports' :
                  doc.type?.includes('Photo') ? 'Photos' : 'Autres'
      }))
    ),
    ...uploadedDocuments
  ];

  const documents = allDocuments;

  const categories = [
    { name: "Plans", count: allDocuments.filter(d => d.category === 'Plans').length, color: "bg-primary" },
    { name: "Contrats", count: allDocuments.filter(d => d.category === 'Contrats').length, color: "bg-accent" },
    { name: "Rapports", count: allDocuments.filter(d => d.category === 'Rapports').length, color: "bg-success" },
    { name: "Photos", count: allDocuments.filter(d => d.category === 'Photos').length, color: "bg-warning" },
    { name: "Finances", count: allDocuments.filter(d => d.category === 'Finances').length, color: "bg-destructive" },
  ];

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                         'image/jpeg', 'image/png', 'application/zip'];

    const newDocuments: LocalDocument[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} dépasse la taille maximale de 50MB`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`Le format du fichier ${file.name} n'est pas supporté`);
        return;
      }

      // Convertir le fichier en document et l'ajouter à la liste
      const document = fileToDocument(file);
      newDocuments.push(document);
    });

    if (newDocuments.length > 0) {
      // Ajouter les documents à l'état local pour qu'ils s'affichent immédiatement
      setUploadedDocuments(prev => [...newDocuments, ...prev]);
      toast.success(`${newDocuments.length} fichier${newDocuments.length > 1 ? 's' : ''} téléversé${newDocuments.length > 1 ? 's' : ''} avec succès`);
      
      // Ajouter une activité pour synchroniser avec les autres pages
      newDocuments.forEach(doc => {
        addActivity({
          type: 'document',
          description: `Document téléversé: ${doc.name}`,
          user: 'Vous',
          projectId: '', // Peut être associé à un projet si nécessaire
        });
      });
      
      // TODO: Ici vous pouvez envoyer les fichiers à votre API
      // Exemple avec FormData:
      // const formData = new FormData();
      // formData.append('file', file);
      // await api.post('/documents/', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
    }

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadZoneRef.current) {
      uploadZoneRef.current.classList.add('bg-primary/5');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadZoneRef.current) {
      uploadZoneRef.current.classList.remove('bg-primary/5');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadZoneRef.current) {
      uploadZoneRef.current.classList.remove('bg-primary/5');
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Traiter directement les fichiers sans passer par l'input
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                           'image/jpeg', 'image/png', 'application/zip'];

      const newDocuments: LocalDocument[] = [];

      Array.from(files).forEach((file) => {
        if (file.size > maxSize) {
          toast.error(`Le fichier ${file.name} dépasse la taille maximale de 50MB`);
          return;
        }

        if (!allowedTypes.includes(file.type)) {
          toast.error(`Le format du fichier ${file.name} n'est pas supporté`);
          return;
        }

        // Convertir le fichier en document et l'ajouter à la liste
        const document = fileToDocument(file);
        newDocuments.push(document);
      });

      if (newDocuments.length > 0) {
        // Ajouter les documents à l'état local pour qu'ils s'affichent immédiatement
        setUploadedDocuments(prev => [...newDocuments, ...prev]);
        toast.success(`${newDocuments.length} fichier${newDocuments.length > 1 ? 's' : ''} téléversé${newDocuments.length > 1 ? 's' : ''} avec succès`);
        
        // Ajouter une activité pour synchroniser avec les autres pages
        newDocuments.forEach(doc => {
          addActivity({
            type: 'document',
            description: `Document téléversé: ${doc.name}`,
            user: 'Vous',
            projectId: '', // Peut être associé à un projet si nécessaire
          });
        });
        
        // TODO: Ici vous pouvez envoyer les fichiers à votre API
      }
    }
  };

  const handleView = (docName: string) => {
    toast.info(`Ouverture de ${docName}`);
    // Ici vous pouvez implémenter l'ouverture du fichier
  };

  const handleDownload = (doc: LocalDocument) => {
    // Si le document a un fichier local, le télécharger directement
    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Téléchargement de ${doc.name} démarré`);
    } else if (doc.url) {
      // Si le document a une URL, ouvrir dans un nouvel onglet
      window.open(doc.url, '_blank');
      toast.success(`Ouverture de ${doc.name}`);
    } else {
      // Sinon, créer un fichier de démonstration
      const content = `Contenu du document: ${doc.name}\n\nCeci est un exemple de téléchargement.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Téléchargement de ${doc.name} démarré`);
    }
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              className="w-fit" 
              onClick={() => {
                try {
                  handleUpload();
                } catch (error) {
                  console.error('Error uploading:', error);
                }
              }}
            >
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
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          try {
                            handleView(doc.name);
                          } catch (error) {
                            console.error('Error viewing document:', error);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          try {
                            handleDownload(doc);
                          } catch (error) {
                            console.error('Error downloading document:', error);
                          }
                        }}
                      >
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
              <div 
                ref={uploadZoneRef}
                className="flex flex-col items-center justify-center text-center space-y-4 transition-colors"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Glissez-déposez vos fichiers ici</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou cliquez pour parcourir vos fichiers
                  </p>
                  <Button 
                    onClick={() => {
                      try {
                        handleUpload();
                      } catch (error) {
                        console.error('Error selecting files:', error);
                      }
                    }}
                  >
                    Sélectionner des fichiers
                  </Button>
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
