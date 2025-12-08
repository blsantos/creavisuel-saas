import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cloud, HardDrive, FolderOpen, Upload, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StorageTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState("s3");

  const handleAction = async (action: string) => {
    setLoading(action);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(null);
    toast({
      title: "Action terminée",
      description: `${action} a été exécuté avec succès.`
    });
  };

  const providers = [
    { id: "s3", name: "Amazon S3", icon: Cloud },
    { id: "gcs", name: "Google Cloud Storage", icon: Cloud },
    { id: "gdrive", name: "Google Drive", icon: FolderOpen },
    { id: "dropbox", name: "Dropbox", icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="grid gap-4 md:grid-cols-4">
        {providers.map((provider) => (
          <Card 
            key={provider.id}
            className={`bg-[#2a2a2a] border-[#3a3a3a] cursor-pointer transition-all ${
              selectedProvider === provider.id ? 'ring-2 ring-primary' : 'hover:border-[#4a4a4a]'
            }`}
            onClick={() => setSelectedProvider(provider.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <provider.icon className={`w-8 h-8 ${selectedProvider === provider.id ? 'text-primary' : 'text-gray-400'}`} />
              <span className={`font-medium ${selectedProvider === provider.id ? 'text-white' : 'text-gray-400'}`}>
                {provider.name}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Upload className="w-5 h-5 text-primary" />
              Upload vers {providers.find(p => p.id === selectedProvider)?.name}
            </CardTitle>
            <CardDescription>Téléverser des fichiers vers le cloud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Fichiers à uploader</Label>
              <Input 
                type="file" 
                multiple
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Bucket / Dossier</Label>
              <Input 
                placeholder="mon-bucket/dossier"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Accès</Label>
              <Select defaultValue="private">
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privé</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="authenticated">Authentifié</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleAction("Upload")}
              disabled={loading === "Upload"}
            >
              {loading === "Upload" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Uploader
            </Button>
          </CardContent>
        </Card>

        {/* Download */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Download className="w-5 h-5 text-primary" />
              Télécharger depuis {providers.find(p => p.id === selectedProvider)?.name}
            </CardTitle>
            <CardDescription>Récupérer des fichiers du cloud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">URL ou chemin du fichier</Label>
              <Input 
                placeholder="s3://bucket/fichier.mp4"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Destination locale</Label>
              <Input 
                placeholder="/downloads/"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleAction("Download")}
              disabled={loading === "Download"}
            >
              {loading === "Download" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Télécharger
            </Button>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a] md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Cloud className="w-5 h-5 text-primary" />
              Configuration {providers.find(p => p.id === selectedProvider)?.name}
            </CardTitle>
            <CardDescription>Configurer les credentials et paramètres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {selectedProvider === "s3" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Access Key ID</Label>
                    <Input 
                      type="password"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Secret Access Key</Label>
                    <Input 
                      type="password"
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Région</Label>
                    <Select defaultValue="eu-west-1">
                      <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                        <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                        <SelectItem value="eu-west-3">EU (Paris)</SelectItem>
                        <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Bucket par défaut</Label>
                    <Input 
                      placeholder="mon-bucket"
                      className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                    />
                  </div>
                </>
              )}
              {(selectedProvider === "gdrive" || selectedProvider === "gcs") && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-300">Fichier de credentials JSON</Label>
                  <Input 
                    type="file"
                    accept=".json"
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
                  />
                </div>
              )}
              {selectedProvider === "dropbox" && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-gray-300">Access Token</Label>
                  <Input 
                    type="password"
                    placeholder="sl.xxxxx"
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                  />
                </div>
              )}
            </div>
            <Button 
              onClick={() => handleAction("Configuration")}
              disabled={loading === "Configuration"}
            >
              {loading === "Configuration" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sauvegarder la configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StorageTools;
