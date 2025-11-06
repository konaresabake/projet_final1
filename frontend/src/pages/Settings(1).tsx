import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ApiSettings from '@/components/settings/ApiSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Database, Bell, User } from 'lucide-react';

const Settings = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="animate-fade-in space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Paramètres</h1>
            </div>
            <p className="text-muted-foreground">
              Configurez votre application et vos préférences
            </p>
          </div>

          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="api">
                <Database className="h-4 w-4 mr-2" />
                API Backend
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="general">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Général
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="mt-6">
              <ApiSettings />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Configuration des notifications à venir
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Gestion du profil à venir
              </div>
            </TabsContent>

            <TabsContent value="general" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Paramètres généraux à venir
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
