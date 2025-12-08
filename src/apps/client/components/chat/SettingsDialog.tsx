import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, Save, ExternalLink, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const urlSchema = z.string().url({ message: "URL invalide" }).max(500, { message: "URL trop longue" });

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookUrl: string;
  onSave: (url: string) => void;
  onReset: () => void;
  defaultUrl: string;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export const SettingsDialog = ({
  open,
  onOpenChange,
  webhookUrl,
  onSave,
  onReset,
  defaultUrl,
}: SettingsDialogProps) => {
  const [url, setUrl] = useState(webhookUrl);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

  const handleSave = () => {
    const result = urlSchema.safeParse(url.trim());
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setError(null);
    onSave(result.data);
    toast.success('Configuration sauvegardée');
    onOpenChange(false);
  };

  const handleReset = () => {
    setUrl(defaultUrl);
    setError(null);
    setConnectionStatus('idle');
    onReset();
    toast.info('URL réinitialisée par défaut');
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setConnectionStatus('idle');
    if (error) {
      const result = urlSchema.safeParse(value.trim());
      if (result.success) {
        setError(null);
      }
    }
  };

  const testConnection = async () => {
    const result = urlSchema.safeParse(url.trim());
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setConnectionStatus('testing');
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(result.data, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'test_connection',
          type: 'connection_test',
          sessionId: 'test-' + Date.now(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConnectionStatus('success');
        toast.success('Connexion réussie ! Le webhook répond correctement.');
      } else {
        setConnectionStatus('error');
        toast.error(`Erreur ${response.status}: Le webhook a répondu avec une erreur.`);
      }
    } catch (err) {
      setConnectionStatus('error');
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('Timeout: Le webhook ne répond pas dans les temps.');
      } else {
        toast.error('Impossible de contacter le webhook. Vérifiez l\'URL et que n8n est actif.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Configuration
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configurez l'URL du webhook n8n pour connecter votre workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="webhook-url" className="text-sm font-medium text-foreground">
              URL du Webhook n8n
            </Label>
            <div className="relative">
              <Input
                id="webhook-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/..."
                className={cn(
                  "bg-secondary/50 border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground pr-12",
                  connectionStatus === 'success' && "border-success/50",
                  connectionStatus === 'error' && "border-destructive/50"
                )}
              />
              {connectionStatus !== 'idle' && connectionStatus !== 'testing' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {connectionStatus === 'success' ? (
                    <Wifi className="w-5 h-5 text-success" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Entrez l'URL complète du webhook de votre workflow n8n.
            </p>
          </div>

          {/* Test Connection Button */}
          <Button
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
            variant="outline"
            className={cn(
              "w-full border-border/50",
              connectionStatus === 'success' && "border-success/50 text-success hover:text-success",
              connectionStatus === 'error' && "border-destructive/50 text-destructive hover:text-destructive"
            )}
          >
            {connectionStatus === 'testing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : connectionStatus === 'success' ? (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Connexion réussie
              </>
            ) : connectionStatus === 'error' ? (
              <>
                <WifiOff className="w-4 h-4 mr-2" />
                Échec - Réessayer
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Tester la connexion
              </>
            )}
          </Button>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary" />
              Comment obtenir l'URL ?
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Ouvrez votre workflow n8n</li>
              <li>Ajoutez un nœud "Webhook" ou "Chat Trigger"</li>
              <li>Copiez l'URL de production ou de test</li>
              <li>Collez-la ci-dessus et testez la connexion</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 border-border/50 hover:bg-secondary"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
