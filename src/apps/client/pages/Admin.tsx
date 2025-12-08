import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminClients } from '@/hooks/useAdminClients';
import { useWebhookConfig } from '@/hooks/useWebhookConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, MessageCircle, RotateCcw } from 'lucide-react';
import { ClientList } from '@/components/admin/ClientList';
import { ClientForm } from '@/components/admin/ClientForm';
import { EmbedDialog } from '@/components/admin/EmbedDialog';
import { CloneWorkflowDialog } from '@/components/admin/CloneWorkflowDialog';
import { ClientConfig, defaultClientConfig } from '@/types/clientConfig';

type AdminView = 'list' | 'form';

const Admin = () => {
  const { clients, isLoading, isSaving, fetchClients, saveClient, deleteClient } = useAdminClients();
  const { webhookUrl, setWebhookUrl, resetToDefault, defaultUrl } = useWebhookConfig();

  const [view, setView] = useState<AdminView>('list');
  const [editingClient, setEditingClient] = useState<ClientConfig | null>(null);
  const [embedClient, setEmbedClient] = useState<ClientConfig | null>(null);
  const [cloneClient, setCloneClient] = useState<ClientConfig | null>(null);

  const handleCreateClient = () => {
    setEditingClient({
      ...defaultClientConfig,
      id: 'new',
      slug: '',
      name: '',
    });
    setView('form');
  };

  const handleEditClient = (client: ClientConfig) => {
    setEditingClient(client);
    setView('form');
  };

  const handleSaveClient = async (clientData: Partial<ClientConfig>) => {
    const success = await saveClient(clientData);
    if (success) {
      setView('list');
      setEditingClient(null);
    }
  };

  const handleCancelEdit = () => {
    setView('list');
    setEditingClient(null);
  };

  const handleCloneClient = (client: ClientConfig) => {
    setCloneClient(client);
  };

  const handleCloneComplete = (newWebhookUrl: string) => {
    if (cloneClient) {
      setEditingClient({
        ...cloneClient,
        id: 'new',
        slug: `${cloneClient.slug}-copy`,
        name: `${cloneClient.name} (Copie)`,
        aiConfig: {
          ...cloneClient.aiConfig,
          webhookUrl: newWebhookUrl,
        },
      });
      setView('form');
    }
    setCloneClient(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Administration Creavisuel</h1>
            <p className="text-muted-foreground">
              Gérez vos clients, agents et configurations
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">
              <MessageCircle className="w-4 h-4 mr-2" />
              Retour au Chat
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            {view === 'list' ? (
              <ClientList
                clients={clients}
                isLoading={isLoading}
                onRefresh={fetchClients}
                onEdit={handleEditClient}
                onDelete={deleteClient}
                onCreate={handleCreateClient}
                onClone={handleCloneClient}
                onEmbed={setEmbedClient}
              />
            ) : (
              <ClientForm
                client={editingClient}
                onSave={handleSaveClient}
                onCancel={handleCancelEdit}
                isSaving={isSaving}
              />
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Généraux</CardTitle>
                <CardDescription>Configuration globale du système</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">URL du Webhook Chat (n8n)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhookUrl"
                        placeholder="https://n8n.example.com/webhook/..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={resetToDefault}
                        title="Réinitialiser"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      URL par défaut : {defaultUrl}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-medium">Informations</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">URLs des clients</h4>
                    <p className="text-sm text-muted-foreground">
                      Chaque client accède à son chat via : <br />
                      <code className="text-primary">https://[slug].creavisuel.pro</code>
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Test en local</h4>
                    <p className="text-sm text-muted-foreground">
                      Pour tester un client en local : <br />
                      <code className="text-primary">http://localhost:8080?client=[slug]</code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <EmbedDialog
        client={embedClient}
        open={!!embedClient}
        onOpenChange={(open) => !open && setEmbedClient(null)}
      />

      <CloneWorkflowDialog
        client={cloneClient}
        open={!!cloneClient}
        onOpenChange={(open) => !open && setCloneClient(null)}
        onCloneComplete={handleCloneComplete}
      />
    </div>
  );
};

export default Admin;
