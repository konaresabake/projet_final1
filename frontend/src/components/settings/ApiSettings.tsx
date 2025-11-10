import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ApiSettings = () => {
  const [apiUrl, setApiUrl] = useState('https://pff-anmq.onrender.com');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  const testConnection = async () => {
    setTesting(true);
    setStatus('testing');

    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setStatus('connected');
        toast.success('Connexion au backend réussie!');
      } else {
        setStatus('disconnected');
        toast.error('Échec de la connexion au backend');
      }
    } catch (error) {
      setStatus('disconnected');
      toast.error('Impossible de se connecter au backend');
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('api_url', apiUrl);
    toast.success('Paramètres sauvegardés');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration Backend API</CardTitle>
        <CardDescription>
          Configurez la connexion à votre backend déployé sur Render
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="api-url">URL de l'API</Label>
          <Input
            id="api-url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://votre-api.render.com"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={async () => {
              try {
                await testConnection();
              } catch (error) {
                console.error('Error testing connection:', error);
              }
            }} 
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester la connexion'
            )}
          </Button>

          <div className="flex items-center gap-2">
            {status === 'connected' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Connecté
                </Badge>
              </>
            )}
            {status === 'disconnected' && (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  Déconnecté
                </Badge>
              </>
            )}
            {status === 'testing' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Test...
                </Badge>
              </>
            )}
          </div>
        </div>

        <Button 
          onClick={() => {
            try {
              saveSettings();
            } catch (error) {
              console.error('Error saving settings:', error);
            }
          }}
        >
          Sauvegarder les paramètres
        </Button>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Documentation Swagger</h4>
          <a 
            href={`${apiUrl}/swagger/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {apiUrl}/swagger/
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiSettings;
