import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Languages, Captions, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MediaTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");

  const handleAction = async (action: string) => {
    setLoading(action);
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (action === "Transcription") {
      setTranscription("Ceci est un exemple de transcription générée automatiquement à partir de votre fichier audio ou vidéo. Le texte sera formaté avec les timestamps correspondants.");
    }
    setLoading(null);
    toast({
      title: "Action terminée",
      description: `${action} a été exécuté avec succès.`
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Transcription */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a] lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mic className="w-5 h-5 text-primary" />
            Transcription Audio/Vidéo
          </CardTitle>
          <CardDescription>Convertir l'audio en texte avec IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Fichier média</Label>
                <Input 
                  type="file" 
                  accept="audio/*,video/*"
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Langue</Label>
                <Select defaultValue="fr">
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                    <SelectItem value="es">Espagnol</SelectItem>
                    <SelectItem value="de">Allemand</SelectItem>
                    <SelectItem value="auto">Auto-détection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Modèle</Label>
                <Select defaultValue="whisper">
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whisper">Whisper (OpenAI)</SelectItem>
                    <SelectItem value="whisper-large">Whisper Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleAction("Transcription")}
                disabled={loading === "Transcription"}
              >
                {loading === "Transcription" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Transcrire
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Résultat</Label>
              <Textarea 
                value={transcription}
                readOnly
                placeholder="La transcription apparaîtra ici..."
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white min-h-[200px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traduction */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Languages className="w-5 h-5 text-primary" />
            Traduction
          </CardTitle>
          <CardDescription>Traduire du contenu média</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Fichier source</Label>
            <Input 
              type="file" 
              accept="audio/*,video/*,.srt,.vtt"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Langue source</Label>
            <Select defaultValue="auto">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-détection</SelectItem>
                <SelectItem value="en">Anglais</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Espagnol</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Langue cible</Label>
            <Select defaultValue="fr">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">Anglais</SelectItem>
                <SelectItem value="es">Espagnol</SelectItem>
                <SelectItem value="de">Allemand</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Traduction")}
            disabled={loading === "Traduction"}
          >
            {loading === "Traduction" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Traduire
          </Button>
        </CardContent>
      </Card>

      {/* Génération de captions */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a] lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Captions className="w-5 h-5 text-primary" />
            Génération de Captions
          </CardTitle>
          <CardDescription>Générer automatiquement des sous-titres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Fichier vidéo</Label>
              <Input 
                type="file" 
                accept="video/*"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Format de sortie</Label>
              <Select defaultValue="srt">
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="srt">SRT</SelectItem>
                  <SelectItem value="vtt">VTT</SelectItem>
                  <SelectItem value="ass">ASS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Options</Label>
              <Select defaultValue="timestamps">
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamps">Avec timestamps</SelectItem>
                  <SelectItem value="speakers">Avec locuteurs</SelectItem>
                  <SelectItem value="both">Timestamps + Locuteurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={() => handleAction("Génération captions")}
            disabled={loading === "Génération captions"}
          >
            {loading === "Génération captions" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Générer les captions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaTools;
