import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ClientConfig } from '@/types/clientConfig';
import { Copy, Check, ExternalLink, Code, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbedDialogProps {
  client: ClientConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmbedDialog = ({ client, open, onOpenChange }: EmbedDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [embedOptions, setEmbedOptions] = useState({
    width: '400',
    height: '600',
    position: 'bottom-right',
    showButton: true,
  });

  if (!client) return null;

  const baseUrl = window.location.origin;
  const clientUrl = `https://${client.slug}.creavisuel.pro`;
  const testUrl = `${baseUrl}/?client=${client.slug}`;

  const iframeCode = `<iframe
  src="${clientUrl}"
  width="${embedOptions.width}"
  height="${embedOptions.height}"
  frameborder="0"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  allow="microphone"
></iframe>`;

  const widgetCode = `<!-- Chat Widget ${client.name} -->
<script>
(function() {
  var widget = document.createElement('div');
  widget.id = 'chat-widget-${client.slug}';
  widget.innerHTML = \`
    <style>
      #chat-widget-${client.slug} .chat-button {
        position: fixed;
        ${embedOptions.position === 'bottom-right' ? 'right: 20px; bottom: 20px;' : 'left: 20px; bottom: 20px;'}
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: hsl(${client.branding.primaryColor});
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        transition: transform 0.2s;
      }
      #chat-widget-${client.slug} .chat-button:hover {
        transform: scale(1.1);
      }
      #chat-widget-${client.slug} .chat-iframe {
        position: fixed;
        ${embedOptions.position === 'bottom-right' ? 'right: 20px; bottom: 90px;' : 'left: 20px; bottom: 90px;'}
        width: ${embedOptions.width}px;
        height: ${embedOptions.height}px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        display: none;
      }
      #chat-widget-${client.slug} .chat-iframe.open {
        display: block;
      }
    </style>
    ${embedOptions.showButton ? `<button class="chat-button" onclick="this.nextElementSibling.classList.toggle('open')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>` : ''}
    <iframe class="chat-iframe${embedOptions.showButton ? '' : ' open'}" src="${clientUrl}" allow="microphone"></iframe>
  \`;
  document.body.appendChild(widget);
})();
</script>`;

  const copy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({ title: 'Copié !', description: `${type} copié dans le presse-papier` });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Intégration & Partage - {client.name}</DialogTitle>
          <DialogDescription>
            Obtenez le code d'intégration ou les URLs pour partager le chat avec votre client
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="urls" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="urls">
              <Link className="h-4 w-4 mr-2" />
              URLs
            </TabsTrigger>
            <TabsTrigger value="iframe">
              <Code className="h-4 w-4 mr-2" />
              iFrame
            </TabsTrigger>
            <TabsTrigger value="widget">
              <Code className="h-4 w-4 mr-2" />
              Widget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urls" className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <Label className="text-sm font-medium">URL Production</Label>
                <div className="flex gap-2">
                  <Input value={clientUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(clientUrl, 'URL Production')}
                  >
                    {copied === 'URL Production' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={clientUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  URL finale pour le client (nécessite configuration DNS)
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <Label className="text-sm font-medium">URL de Test</Label>
                <div className="flex gap-2">
                  <Input value={testUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(testUrl, 'URL Test')}
                  >
                    {copied === 'URL Test' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={testUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  URL pour tester sans configuration DNS
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="iframe" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Largeur (px)</Label>
                <Input
                  id="width"
                  value={embedOptions.width}
                  onChange={(e) =>
                    setEmbedOptions((prev) => ({ ...prev, width: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Hauteur (px)</Label>
                <Input
                  id="height"
                  value={embedOptions.height}
                  onChange={(e) =>
                    setEmbedOptions((prev) => ({ ...prev, height: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Code iFrame</Label>
              <div className="relative">
                <Textarea
                  value={iframeCode}
                  readOnly
                  className="font-mono text-xs h-32"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copy(iframeCode, 'Code iFrame')}
                >
                  {copied === 'Code iFrame' ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  Copier
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="widget" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="widgetWidth">Largeur (px)</Label>
                <Input
                  id="widgetWidth"
                  value={embedOptions.width}
                  onChange={(e) =>
                    setEmbedOptions((prev) => ({ ...prev, width: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="widgetHeight">Hauteur (px)</Label>
                <Input
                  id="widgetHeight"
                  value={embedOptions.height}
                  onChange={(e) =>
                    setEmbedOptions((prev) => ({ ...prev, height: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Position</Label>
                <p className="text-xs text-muted-foreground">Coin du bouton chat</p>
              </div>
              <select
                value={embedOptions.position}
                onChange={(e) =>
                  setEmbedOptions((prev) => ({ ...prev, position: e.target.value }))
                }
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="bottom-right">Bas droite</option>
                <option value="bottom-left">Bas gauche</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Bouton flottant</Label>
                <p className="text-xs text-muted-foreground">Afficher le bouton pour ouvrir le chat</p>
              </div>
              <Switch
                checked={embedOptions.showButton}
                onCheckedChange={(checked) =>
                  setEmbedOptions((prev) => ({ ...prev, showButton: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Code Widget</Label>
              <div className="relative">
                <Textarea
                  value={widgetCode}
                  readOnly
                  className="font-mono text-xs h-48"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copy(widgetCode, 'Code Widget')}
                >
                  {copied === 'Code Widget' ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  Copier
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Collez ce code avant la balise {'</body>'} de votre site
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
