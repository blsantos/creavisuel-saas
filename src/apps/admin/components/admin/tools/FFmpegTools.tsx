import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clapperboard, Settings, Zap, Terminal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FFmpegTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [customCommand, setCustomCommand] = useState("");
  const [commandOutput, setCommandOutput] = useState("");

  const handleAction = async (action: string) => {
    setLoading(action);
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (action === "Commande personnalisée") {
      setCommandOutput(`$ ffmpeg ${customCommand}
      
ffmpeg version 6.0 Copyright (c) 2000-2023 the FFmpeg developers
built with gcc 12.2.0
configuration: --enable-gpl --enable-libx264 --enable-libx265
Input #0, mp4, from 'input.mp4':
  Duration: 00:02:30.00, start: 0.000000, bitrate: 1500 kb/s
    Stream #0:0: Video: h264 (High)
    Stream #0:1: Audio: aac (LC)
Output #0, mp4, to 'output.mp4':
  Metadata:
    encoder: Lavf60.3.100
frame= 3750 fps=120 q=28.0 Lsize=   25000kB time=00:02:30.00 bitrate=1365.0kbits/s
video:22000kB audio:3000kB subtitle:0kB other streams:0kB global headers:0kB

Conversion terminée avec succès!`);
    }
    setLoading(null);
    toast({
      title: "Action terminée",
      description: `${action} a été exécuté avec succès.`
    });
  };

  const presets = [
    { name: "Compression Web", command: "-c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k" },
    { name: "Qualité maximale", command: "-c:v libx265 -crf 18 -preset slow -c:a copy" },
    { name: "Mobile (720p)", command: "-vf scale=1280:720 -c:v libx264 -crf 23 -c:a aac -b:a 128k" },
    { name: "GIF animé", command: "-vf 'fps=10,scale=480:-1:flags=lanczos' -c:v gif" },
    { name: "Audio seulement", command: "-vn -c:a libmp3lame -b:a 320k" },
  ];

  return (
    <div className="space-y-6">
      {/* Presets rapides */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-primary" />
            Presets rapides
          </CardTitle>
          <CardDescription>Conversions pré-configurées pour les cas d'usage courants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a] h-auto py-3 flex-col"
                onClick={() => {
                  setCustomCommand(preset.command);
                  toast({ title: "Preset appliqué", description: preset.name });
                }}
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs text-gray-500 mt-1 truncate w-full">{preset.command.slice(0, 25)}...</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion de format */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clapperboard className="w-5 h-5 text-primary" />
              Conversion de format
            </CardTitle>
            <CardDescription>Convertir entre différents formats vidéo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Fichier source</Label>
              <Input 
                type="file" 
                accept="video/*,audio/*"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Format de sortie</Label>
              <Select defaultValue="mp4">
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                  <SelectItem value="webm">WebM (VP9)</SelectItem>
                  <SelectItem value="mov">MOV (ProRes)</SelectItem>
                  <SelectItem value="mkv">MKV</SelectItem>
                  <SelectItem value="avi">AVI</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Codec vidéo</Label>
              <Select defaultValue="libx264">
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libx264">H.264 (libx264)</SelectItem>
                  <SelectItem value="libx265">H.265/HEVC (libx265)</SelectItem>
                  <SelectItem value="libvpx-vp9">VP9</SelectItem>
                  <SelectItem value="copy">Copier (sans ré-encodage)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleAction("Conversion format")}
              disabled={loading === "Conversion format"}
            >
              {loading === "Conversion format" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Convertir
            </Button>
          </CardContent>
        </Card>

        {/* Compression */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5 text-primary" />
              Compression avancée
            </CardTitle>
            <CardDescription>Réduire la taille des fichiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Fichier source</Label>
              <Input 
                type="file" 
                accept="video/*"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">CRF (Qualité: 0=lossless, 51=pire)</Label>
              <Input 
                type="number" 
                defaultValue="23"
                min="0"
                max="51"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Preset</Label>
              <Select defaultValue="medium">
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultrafast">Ultrafast</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="slow">Slow (meilleure qualité)</SelectItem>
                  <SelectItem value="veryslow">Very slow (qualité max)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Bitrate max (optionnel)</Label>
              <Input 
                placeholder="ex: 2M"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleAction("Compression")}
              disabled={loading === "Compression"}
            >
              {loading === "Compression" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Compresser
            </Button>
          </CardContent>
        </Card>

        {/* Commande personnalisée */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Terminal className="w-5 h-5 text-primary" />
              Commande FFmpeg personnalisée
            </CardTitle>
            <CardDescription>Exécuter une commande FFmpeg personnalisée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Fichier d'entrée</Label>
                  <Input 
                    type="file" 
                    accept="video/*,audio/*,image/*"
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Arguments FFmpeg</Label>
                  <Textarea 
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder="-c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4"
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white font-mono min-h-[120px]"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleAction("Commande personnalisée")}
                  disabled={loading === "Commande personnalisée"}
                >
                  {loading === "Commande personnalisée" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Exécuter
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Sortie</Label>
                <div className="bg-[#0a0a0a] rounded-lg p-4 min-h-[220px] font-mono text-xs text-green-400 whitespace-pre-wrap overflow-auto">
                  {commandOutput || "En attente d'exécution..."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FFmpegTools;
