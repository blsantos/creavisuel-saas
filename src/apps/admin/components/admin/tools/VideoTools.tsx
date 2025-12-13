import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Image, Subtitles, Layers, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import toolkitApi from '@/services/toolkitApi';
import { supabase } from '@/lib/supabase';

const VideoTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [combineVideoUrls, setCombineVideoUrls] = useState<string>('');
  const [captionVideoUrl, setCaptionVideoUrl] = useState<string>('');
  const [captionText, setCaptionText] = useState<string>('');
  const [imageToVideoUrl, setImageToVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [videoFps, setVideoFps] = useState<number>(30);
  const [extractKeyframesUrl, setExtractKeyframesUrl] = useState<string>('');
  const [keyframeInterval, setKeyframeInterval] = useState<number>(1);
  const [jobResult, setJobResult] = useState<any>(null);

  const handleCombineVideos = async () => {
    if (!combineVideoUrls.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer les URLs des vidéos (une par ligne)",
        variant: "destructive"
      });
      return;
    }

    setLoading("Combinaison");
    setJobResult(null);

    try {
      const urls = combineVideoUrls.split('\n').filter(u => u.trim());
      const video_urls = urls.map(url => ({ video_url: url.trim() }));

      const jobResponse = await toolkitApi.combineVideos({ video_urls });

      toast({
        title: "Job créé",
        description: `Job ID: ${jobResponse.job_id} - En attente...`
      });

      const result = await toolkitApi.waitForJob(jobResponse.job_id);

      setJobResult(result);
      toast({
        title: "✅ Vidéo combinée",
        description: "La vidéo a été générée avec succès !"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCaptionVideo = async () => {
    if (!captionVideoUrl.trim() || !captionText.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir l'URL de la vidéo et le texte",
        variant: "destructive"
      });
      return;
    }

    setLoading("Caption");
    setJobResult(null);

    try {
      const captions = [{
        text: captionText,
        start_time: 0,
        end_time: 5,
        position: { x: 100, y: 100 },
        style: {
          font_size: 48,
          font_family: 'Arial',
          color: '#FFFFFF',
          font_weight: 'bold',
          background_color: 'rgba(0,0,0,0.7)'
        }
      }];

      const jobResponse = await toolkitApi.captionVideo({
        video_url: captionVideoUrl,
        captions
      });

      toast({
        title: "Job créé",
        description: `Job ID: ${jobResponse.job_id} - En attente...`
      });

      const result = await toolkitApi.waitForJob(jobResponse.job_id);

      setJobResult(result);
      toast({
        title: "✅ Caption ajouté",
        description: "La vidéo avec caption a été générée !"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleImageToVideo = async () => {
    if (!imageToVideoUrl.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer l'URL de l'image",
        variant: "destructive"
      });
      return;
    }

    setLoading("ImageToVideo");
    setJobResult(null);

    try {
      const jobResponse = await toolkitApi.imageToVideo({
        image_url: imageToVideoUrl,
        duration: videoDuration,
        fps: videoFps
      });

      toast({
        title: "Job créé",
        description: `Job ID: ${jobResponse.job_id} - En attente...`
      });

      const result = await toolkitApi.waitForJob(jobResponse.job_id);

      setJobResult(result);
      toast({
        title: "✅ Vidéo créée",
        description: "La vidéo a été générée depuis l'image !"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleExtractKeyframes = async () => {
    if (!extractKeyframesUrl.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer l'URL de la vidéo",
        variant: "destructive"
      });
      return;
    }

    setLoading("ExtractKeyframes");
    setJobResult(null);

    try {
      const jobResponse = await toolkitApi.extractKeyframes({
        video_url: extractKeyframesUrl,
        interval: keyframeInterval
      });

      toast({
        title: "Job créé",
        description: `Job ID: ${jobResponse.job_id} - En attente...`
      });

      const result = await toolkitApi.waitForJob(jobResponse.job_id);

      setJobResult(result);
      toast({
        title: "✅ Frames extraites",
        description: "Les images ont été extraites de la vidéo !"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Result Panel */}
      {jobResult && (
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Résultat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
              <span className="text-sm text-slate-300">Statut:</span>
              <span className="text-sm font-semibold text-green-400">{jobResult.job_status}</span>
            </div>
            {jobResult.response && jobResult.response.video_url && (
              <div className="space-y-2">
                <Label className="text-gray-300">URL de la vidéo:</Label>
                <div className="flex gap-2">
                  <Input
                    value={jobResult.response.video_url}
                    readOnly
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white font-mono text-sm"
                  />
                  <Button
                    onClick={() => window.open(jobResult.response.video_url, '_blank')}
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {jobResult.response && jobResult.response.image_urls && (
              <div className="space-y-2">
                <Label className="text-gray-300">Images extraites: {jobResult.response.image_urls.length}</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {jobResult.response.image_urls.map((url: string, idx: number) => (
                    <div key={idx} className="flex gap-2 text-xs">
                      <span className="text-slate-400">#{idx + 1}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline truncate">
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <Label className="text-gray-300">URLs des vidéos (une par ligne)</Label>
              <Textarea
                value={combineVideoUrls}
                onChange={(e) => setCombineVideoUrls(e.target.value)}
                placeholder="https://example.com/video1.mp4&#10;https://example.com/video2.mp4"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white font-mono text-sm min-h-[100px]"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCombineVideos}
              disabled={loading === "Combinaison"}
            >
              {loading === "Combinaison" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Combiner les vidéos
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
              <Label className="text-gray-300">URL de la vidéo</Label>
              <Input
                value={extractKeyframesUrl}
                onChange={(e) => setExtractKeyframesUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Intervalle (secondes)</Label>
              <Input
                type="number"
                value={keyframeInterval}
                onChange={(e) => setKeyframeInterval(parseFloat(e.target.value))}
                min="0.1"
                step="0.1"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleExtractKeyframes}
              disabled={loading === "ExtractKeyframes"}
            >
              {loading === "ExtractKeyframes" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Extraire les frames
            </Button>
          </CardContent>
        </Card>

        {/* Ajout de caption/texte */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Subtitles className="w-5 h-5 text-primary" />
              Caption Vidéo
            </CardTitle>
            <CardDescription>Ajouter du texte sur une vidéo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">URL de la vidéo</Label>
              <Input
                value={captionVideoUrl}
                onChange={(e) => setCaptionVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Texte à ajouter</Label>
              <Textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Votre texte ici..."
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCaptionVideo}
              disabled={loading === "Caption"}
            >
              {loading === "Caption" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Ajouter le caption
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
            <CardDescription>Créer une vidéo à partir d'une image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">URL de l'image</Label>
              <Input
                value={imageToVideoUrl}
                onChange={(e) => setImageToVideoUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Durée (secondes)</Label>
              <Input
                type="number"
                value={videoDuration}
                onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                min="1"
                step="1"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">FPS</Label>
              <Select value={videoFps.toString()} onValueChange={(v) => setVideoFps(parseInt(v))}>
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
              onClick={handleImageToVideo}
              disabled={loading === "ImageToVideo"}
            >
              {loading === "ImageToVideo" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Créer la vidéo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoTools;
