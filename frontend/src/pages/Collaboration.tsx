import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/contexts/ProjectContext';
import { MessageSquare, Send, Bell } from 'lucide-react';
import { toast } from 'sonner';

const Collaboration = () => {
  const { projects, comments, addComment, activities } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [newComment, setNewComment] = useState('');

  const filteredComments = selectedProject === 'all'
    ? comments
    : comments.filter(c => c.projectId === selectedProject);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Veuillez entrer un commentaire');
      return;
    }

    if (selectedProject === 'all') {
      toast.error('Veuillez sélectionner un projet');
      return;
    }

    addComment({
      author: 'Utilisateur',
      content: newComment,
      projectId: selectedProject,
    });

    setNewComment('');
    toast.success('Commentaire ajouté avec succès');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Utiliser les activités récentes comme notifications
  const notifications = activities.slice(0, 5).map((activity, idx) => ({
    id: activity.id,
    message: activity.description,
    time: new Date(activity.timestamp).toLocaleString('fr-FR'),
    read: idx > 2, // Les 3 premiers sont non lus
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Collaboration</h1>
            <p className="text-muted-foreground">Communiquez avec votre équipe en temps réel</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nouveau commentaire</CardTitle>
                  <CardDescription>Partagez vos idées avec l'équipe</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitComment} className="space-y-4">
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Textarea
                      placeholder="Écrivez votre commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                    />

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Fil de discussion</CardTitle>
                    <CardDescription>
                      {filteredComments.length} commentaire{filteredComments.length > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les projets</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredComments.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun commentaire pour le moment</p>
                      </div>
                    ) : (
                      filteredComments.map((comment) => {
                        const project = projects.find(p => p.id === comment.projectId);
                        return (
                          <div key={comment.id} className="flex gap-4 p-4 rounded-lg border">
                            <Avatar>
                              <AvatarFallback>{getInitials(comment.author)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{comment.author}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.timestamp).toLocaleString('fr-FR')}
                                </span>
                                {project && (
                                  <Badge variant="outline" className="ml-auto">
                                    {project.name}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications
                    </CardTitle>
                    <Badge variant="destructive">{notifications.filter(n => !n.read).length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg border ${
                          !notif.read ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                      >
                        <p className="text-sm font-medium">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activités récentes</CardTitle>
                  <CardDescription>Dernières actions sur les projets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>{getInitials(activity.user)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.user}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Collaboration;
