import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Languages, Captions, Loader2, Download, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import toolkitApi from '@/services/toolkitApi';

const MediaTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [transcribeUrl, setTranscribeUrl] = useState("");
  const [transcribeLanguage, setTranscribeLanguage] = useState("fr");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [jobResult, setJobResult] = useState<any>(null);

  const handleTranscribe = async () => {
    if (!transcribeUrl.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer l'URL du média",
        variant: "destructive"
      });
      return;
    }

    setLoading("Transcription");
    setJobResult(null);

    try {
      const jobResponse = await toolkitApi.transcribeMedia({
        media_url: transcribeUrl,
        language: transcribeLanguage
      });

      toast({
        title: "Job créé",
        description: `Job ID: ${jobResponse.job_id} - Transcription en cours...`
      });

      const result = await toolkitApi.waitForJob(jobResponse.job_id);

      setJobResult(result);
      if (result.response && result.response.text) {
        setTranscription(result.response.text);
      }

      toast({
        title: "✅ Transcription terminée",
        description: "Le texte a été extrait du média !"
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

  const handleDownload = async () => {
    if (!downloadUrl.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer l'URL à télécharger",
        variant: "destructive"
      });
      return;
    }

    setLoading("Download");
    setJobResult(null);

    try {
      const jobResponse = await toolkitApi.downloadFile({
        url: downloadUrl
      });

      toast({
        title: "Job créé",
        description: `Job ID: ${jobResponse.job_id} - Téléchargement...`
      });

      const result = await toolkitApi.waitForJob(jobResponse.job_id);

      setJobResult(result);
      toast({
        title: "✅ Téléchargement terminé",
        description: "Le fichier a été téléchargé !"
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

  const handleScreenshot = async () => {
    if (!screenshotUrl.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer l'URL de la page web",
        variant: "destructive"
      });
      return;
    }

    setLoading("Screenshot");
    setJobResult(null);

    try {
      const jobResponse = await toolkitApi.screenshotWebpage({
        url: screenshotUrl,
        width: 1920,
        height: 1080
      });

      toast({
        title: "Job créé",
        description: `Job ID: ${jobResponse.job_id} - Capture...`
      });

      const result = await toolkitApi.waitForJob(jobResponse.job_id);

      setJobResult(result);
      toast({
        title: "✅ Screenshot créé",
        description: "La capture d'écran a été générée !"
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
            {jobResult.response && (
              <div className="space-y-2">
                <Label className="text-gray-300">Résultat:</Label>
                <pre className="bg-black/20 p-3 rounded-lg text-xs text-slate-300 overflow-x-auto max-h-60 overflow-y-auto">
                  {JSON.stringify(jobResult.response, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                  <Label className="text-gray-300">URL du média</Label>
                  <Input
                    value={transcribeUrl}
                    onChange={(e) => setTranscribeUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Langue</Label>
                  <Select value={transcribeLanguage} onValueChange={setTranscribeLanguage}>
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
                <Button
                  className="w-full"
                  onClick={handleTranscribe}
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

        {/* Télécharger un fichier */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Download className="w-5 h-5 text-primary" />
              Télécharger fichier
            </CardTitle>
            <CardDescription>Télécharger un fichier depuis une URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">URL du fichier</Label>
              <Input
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://example.com/file.zip"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleDownload}
              disabled={loading === "Download"}
            >
              {loading === "Download" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Télécharger
            </Button>
          </CardContent>
        </Card>

        {/* Screenshot de page web */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Captions className="w-5 h-5 text-primary" />
              Screenshot de page web
            </CardTitle>
            <CardDescription>Capturer une page web en image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">URL de la page</Label>
              <Input
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
              />
            </div>
            <Button
              onClick={handleScreenshot}
              disabled={loading === "Screenshot"}
            >
              {loading === "Screenshot" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Capturer la page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaTools;
