import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Image, Subtitles, Layers, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VideoTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(null);
    toast({
      title: "Action terminée",
      description: `${action} a été exécuté avec succès.`
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Combinaison de vidéos */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Layers className="w-5 h-5 text-primary" />
            Combinaison de vidéos
          </CardTitle>
          <CardDescription>Fusionner plusieurs vidéos en une seule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Fichiers vidéo</Label>
            <Input 
              type="file" 
              multiple 
              accept="video/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Transition</Label>
            <Select defaultValue="none">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                <SelectItem value="fade">Fondu</SelectItem>
                <SelectItem value="dissolve">Dissolution</SelectItem>
                <SelectItem value="wipe">Balayage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Combinaison")}
            disabled={loading === "Combinaison"}
          >
            {loading === "Combinaison" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Combiner
          </Button>
        </CardContent>
      </Card>

      {/* Extraction de frames clés */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Image className="w-5 h-5 text-primary" />
            Extraction de frames
          </CardTitle>
          <CardDescription>Extraire les images clés d'une vidéo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Fichier vidéo</Label>
            <Input 
              type="file" 
              accept="video/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Intervalle (secondes)</Label>
            <Input 
              type="number" 
              defaultValue="1"
              min="0.1"
              step="0.1"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Format image</Label>
            <Select defaultValue="jpg">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Extraction frames")}
            disabled={loading === "Extraction frames"}
          >
            {loading === "Extraction frames" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Extraire
          </Button>
        </CardContent>
      </Card>

      {/* Ajout de sous-titres */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Subtitles className="w-5 h-5 text-primary" />
            Sous-titres
          </CardTitle>
          <CardDescription>Ajouter des sous-titres à une vidéo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Fichier vidéo</Label>
            <Input 
              type="file" 
              accept="video/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Fichier SRT/VTT</Label>
            <Input 
              type="file" 
              accept=".srt,.vtt"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Style</Label>
            <Select defaultValue="default">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Par défaut</SelectItem>
                <SelectItem value="bold">Gras</SelectItem>
                <SelectItem value="outline">Contour</SelectItem>
                <SelectItem value="shadow">Ombre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Sous-titres")}
            disabled={loading === "Sous-titres"}
          >
            {loading === "Sous-titres" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Ajouter
          </Button>
        </CardContent>
      </Card>

      {/* Image vers vidéo */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Film className="w-5 h-5 text-primary" />
            Image vers Vidéo
          </CardTitle>
          <CardDescription>Créer une vidéo à partir d'images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Images</Label>
            <Input 
              type="file" 
              multiple 
              accept="image/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Durée par image (sec)</Label>
            <Input 
              type="number" 
              defaultValue="2"
              min="0.5"
              step="0.5"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">FPS</Label>
            <Select defaultValue="30">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 fps</SelectItem>
                <SelectItem value="30">30 fps</SelectItem>
                <SelectItem value="60">60 fps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Image vers vidéo")}
            disabled={loading === "Image vers vidéo"}
          >
            {loading === "Image vers vidéo" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Créer vidéo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoTools;
