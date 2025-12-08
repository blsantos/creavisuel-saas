import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientConfig } from '@/types/clientConfig';
import { Copy, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CloneWorkflowDialogProps {
  client: ClientConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloneComplete: (newWebhookUrl: string) => void;
}

const N8N_CLONE_URL = 'https://n8n.lecoach.digital/webhook/clone-workflow';

export const CloneWorkflowDialog = ({
  client,
  open,
  onOpenChange,
  onCloneComplete,
}: CloneWorkflowDialogProps) => {
  const { toast } = useToast();
  const [isCloning, setIsCloning] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [cloneResult, setCloneResult] = useState<{
    success: boolean;
    webhookUrl?: string;
    workflowId?: string;
    error?: string;
  } | null>(null);

  const handleClone = async () => {
    if (!client?.aiConfig.workflowId) {
      toast({
        title: 'ID de workflow manquant',
        description: "Ce client n'a pas de workflow ID configuré",
        variant: 'destructive',
      });
      return;
    }

    setIsCloning(true);
    setCloneResult(null);

    try {
      const response = await fetch(N8N_CLONE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clone_workflow',
          sourceWorkflowId: client.aiConfig.workflowId,
          newName: newWorkflowName || `${client.name} - Clone`,
          clientSlug: client.slug,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCloneResult({
          success: true,
          webhookUrl: result.webhookUrl,
          workflowId: result.workflowId,
        });
        toast({
          title: 'Workflow cloné avec succès !',
          description: `Nouveau workflow: ${result.workflowId}`,
        });
      } else {
        setCloneResult({
          success: false,
          error: result.error || 'Erreur inconnue',
        });
        toast({
          title: 'Échec du clonage',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      setCloneResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de contacter le serveur n8n',
        variant: 'destructive',
      });
    } finally {
      setIsCloning(false);
    }
  };

  const handleUseWebhook = () => {
    if (cloneResult?.webhookUrl) {
      onCloneComplete(cloneResult.webhookUrl);
      onOpenChange(false);
      setCloneResult(null);
      setNewWorkflowName('');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCloneResult(null);
    setNewWorkflowName('');
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Cloner le Workflow
          </DialogTitle>
          <DialogDescription>
            Créez une copie du workflow n8n pour ce client avec ses propres paramètres
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <Label className="text-xs text-muted-foreground">Client source</Label>
            <p className="font-medium">{client.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              Workflow ID: {client.aiConfig.workflowId || 'Non configuré'}
            </p>
          </div>

          {!cloneResult && (
            <div className="space-y-2">
              <Label htmlFor="newName">Nom du nouveau workflow</Label>
              <Input
                id="newName"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder={`${client.name} - Clone`}
              />
            </div>
          )}

          {cloneResult && (
            <div
              className={`p-4 rounded-lg border ${
                cloneResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {cloneResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <p className={`font-medium ${cloneResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {cloneResult.success ? 'Workflow cloné !' : 'Erreur'}
                  </p>
                  {cloneResult.success ? (
                    <>
                      <p className="text-sm text-green-700">
                        ID: {cloneResult.workflowId}
                      </p>
                      <div className="mt-2 p-2 bg-white rounded border text-xs font-mono break-all">
                        {cloneResult.webhookUrl}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-red-700">{cloneResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!client.aiConfig.workflowId && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p className="font-medium">Attention</p>
              <p>Ce client n'a pas de workflow ID configuré. Configurez-le d'abord dans l'onglet Agent IA.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fermer
          </Button>
          {cloneResult?.success ? (
            <Button onClick={handleUseWebhook}>
              Utiliser ce webhook
            </Button>
          ) : (
            <Button
              onClick={handleClone}
              disabled={isCloning || !client.aiConfig.workflowId}
            >
              {isCloning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cloner le workflow
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
