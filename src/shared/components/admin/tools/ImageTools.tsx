import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ImageIcon, Maximize, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ImageTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [quality, setQuality] = useState([80]);

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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Redimensionnement */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Maximize className="w-5 h-5 text-primary" />
            Redimensionnement
          </CardTitle>
          <CardDescription>Modifier les dimensions d'une image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Image source</Label>
            <Input 
              type="file" 
              accept="image/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Largeur</Label>
              <Input 
                type="number" 
                placeholder="1920"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Hauteur</Label>
              <Input 
                type="number" 
                placeholder="1080"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Mode</Label>
            <Select defaultValue="contain">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Contenir</SelectItem>
                <SelectItem value="cover">Couvrir</SelectItem>
                <SelectItem value="fill">Remplir</SelectItem>
                <SelectItem value="crop">Recadrer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Redimensionnement")}
            disabled={loading === "Redimensionnement"}
          >
            {loading === "Redimensionnement" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Redimensionner
          </Button>
        </CardContent>
      </Card>

      {/* Conversion de formats */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <RefreshCw className="w-5 h-5 text-primary" />
            Conversion
          </CardTitle>
          <CardDescription>Convertir entre formats d'image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Image source</Label>
            <Input 
              type="file" 
              accept="image/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Format cible</Label>
            <Select defaultValue="webp">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
                <SelectItem value="avif">AVIF</SelectItem>
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

      {/* Optimisation */}
      <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ImageIcon className="w-5 h-5 text-primary" />
            Optimisation
          </CardTitle>
          <CardDescription>Compresser et optimiser une image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Image source</Label>
            <Input 
              type="file" 
              accept="image/*"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white file:bg-primary file:text-white file:border-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Qualité: {quality[0]}%</Label>
            <Slider
              value={quality}
              onValueChange={setQuality}
              min={10}
              max={100}
              step={5}
              className="py-2"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Options</Label>
            <Select defaultValue="balanced">
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lossless">Sans perte</SelectItem>
                <SelectItem value="balanced">Équilibré</SelectItem>
                <SelectItem value="aggressive">Agressif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleAction("Optimisation")}
            disabled={loading === "Optimisation"}
          >
            {loading === "Optimisation" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Optimiser
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageTools;
