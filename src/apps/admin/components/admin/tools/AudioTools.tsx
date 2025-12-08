import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, FileAudio, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AudioTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(null);
    toast({
      title: "Action terminée",
      description: `${action} a été exécuté avec succès.`
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Concaténation Audio */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Music className="w-5 h-5 text-primary" />
            Concaténation Audio
          </CardTitle>
          <CardDescription>Fusionner plusieurs fichiers audio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Fichiers audio</Label>
            <Input 
              type="file" 
              multiple 
              accept="audio/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Format de sortie</Label>
            <Select defaultValue="mp3">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="ogg">OGG</SelectItem>
                <SelectItem value="flac">FLAC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Concaténation")}
            disabled={loading === "Concaténation"}
          >
            {loading === "Concaténation" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Fusionner
          </Button>
        </CardContent>
      </Card>

      {/* Conversion de formats */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileAudio className="w-5 h-5 text-primary" />
            Conversion de formats
          </CardTitle>
          <CardDescription>Convertir entre différents formats audio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Fichier source</Label>
            <Input 
              type="file" 
              accept="audio/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Format cible</Label>
            <Select defaultValue="mp3">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="ogg">OGG</SelectItem>
                <SelectItem value="flac">FLAC</SelectItem>
                <SelectItem value="aac">AAC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Bitrate</Label>
            <Select defaultValue="192">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128">128 kbps</SelectItem>
                <SelectItem value="192">192 kbps</SelectItem>
                <SelectItem value="256">256 kbps</SelectItem>
                <SelectItem value="320">320 kbps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Conversion")}
            disabled={loading === "Conversion"}
          >
            {loading === "Conversion" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Convertir
          </Button>
        </CardContent>
      </Card>

      {/* Extraction audio depuis vidéo */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Video className="w-5 h-5 text-primary" />
            Extraction Audio
          </CardTitle>
          <CardDescription>Extraire l'audio d'une vidéo</CardDescription>
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
            <Label className="text-gray-300">Format audio</Label>
            <Select defaultValue="mp3">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="aac">AAC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Extraction")}
            disabled={loading === "Extraction"}
          >
            {loading === "Extraction" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Extraire
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioTools;
