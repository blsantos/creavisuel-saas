import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Film, ImageIcon, Code, Mic, Cloud, Clapperboard, ExternalLink, Zap } from "lucide-react";
import AudioTools from "./AudioTools";
import VideoTools from "./VideoTools";
import ImageTools from "./ImageTools";
import CodeTools from "./CodeTools";
import MediaTools from "./MediaTools";
import StorageTools from "./StorageTools";
import FFmpegTools from "./FFmpegTools";
import SciFiCore from "@/shared/components/admin/tools/SciFiCore";

const ToolsPanel = () => {
  const [activeTab, setActiveTab] = useState("audio");
  const [showIntro, setShowIntro] = useState(true);
  const [uiRevealed, setUiRevealed] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    setUiRevealed(true);
    setTimeout(() => setShowIntro(false), 800);
  }, []);

  const tools = [
    { id: "audio", label: "Audio", icon: Music, endpoint: "/v1/audio", color: "from-cyan-500 to-blue-600" },
    { id: "video", label: "Vidéo", icon: Film, endpoint: "/v1/video", color: "from-purple-500 to-pink-600" },
    { id: "image", label: "Images", icon: ImageIcon, endpoint: "/v1/image", color: "from-green-500 to-emerald-600" },
    { id: "code", label: "Code", icon: Code, endpoint: "/v1/code", color: "from-orange-500 to-red-600" },
    { id: "media", label: "Media", icon: Mic, endpoint: "/v1/media", color: "from-yellow-500 to-amber-600" },
    { id: "storage", label: "Cloud", icon: Cloud, endpoint: "/v1/s3", color: "from-teal-500 to-cyan-600" },
    { id: "ffmpeg", label: "FFmpeg", icon: Clapperboard, endpoint: "/v1/ffmpeg", color: "from-indigo-500 to-violet-600" },
  ];

  return (
    <div className="h-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex flex-col relative overflow-hidden">
      {/* Sci-Fi Intro Animation */}
      <SciFiCore isActive={showIntro} onAnimationComplete={handleAnimationComplete} />

      {/* Background ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/3 to-transparent rounded-full" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Main content with reveal animation */}
      <div className={`relative z-10 flex flex-col h-full transition-all duration-700 ease-out ${uiRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Animated logo */}
              <div className="relative perspective-container">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-primary to-cyan-600 flex items-center justify-center animate-pulse-core">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-cyan-500/20 rounded-xl blur-md -z-10" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  No-Code Architects <span className="text-cyan-400">Toolkit</span>
                </h1>
                <p className="text-slate-400 mt-0.5 text-sm">
                  API 100% Gratuite et Open-Source pour le traitement média
                </p>
              </div>
            </div>

            <a
              href="https://github.com/blsantos/no-code-architects-toolkit"
              target="_blank"
              rel="noopener noreferrer"
              className="scifi-button flex items-center gap-2 text-cyan-400 hover:text-white"
            >
              <span className="text-sm font-medium">GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-white/10 px-6">
            <TabsList className="bg-transparent h-14 p-0 gap-2">
              {tools.map((tool, index) => (
                <TabsTrigger
                  key={tool.id}
                  value={tool.id}
                  className="group relative data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 px-4 py-2.5 rounded-lg border border-transparent data-[state=active]:border-cyan-500/30 transition-all duration-300 hover:text-white hover:bg-white/5"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${tool.color} opacity-0 group-data-[state=active]:opacity-10 transition-opacity`} />
                  <tool.icon className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10 font-medium">{tool.label}</span>
                  <span className="ml-2 text-xs text-slate-500 font-mono relative z-10">{tool.endpoint}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Tool status bar */}
              <div className="mb-6 flex items-center gap-4 p-4 scifi-glass rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-slate-300">API Status: <span className="text-green-400">Online</span></span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-sm text-slate-400 font-mono">Endpoint: api.nocode-toolkit.dev</span>
              </div>

              <TabsContent value="audio" className="mt-0 animate-reveal-ui">
                <AudioTools />
              </TabsContent>
              <TabsContent value="video" className="mt-0 animate-reveal-ui">
                <VideoTools />
              </TabsContent>
              <TabsContent value="image" className="mt-0 animate-reveal-ui">
                <ImageTools />
              </TabsContent>
              <TabsContent value="code" className="mt-0 animate-reveal-ui">
                <CodeTools />
              </TabsContent>
              <TabsContent value="media" className="mt-0 animate-reveal-ui">
                <MediaTools />
              </TabsContent>
              <TabsContent value="storage" className="mt-0 animate-reveal-ui">
                <StorageTools />
              </TabsContent>
              <TabsContent value="ffmpeg" className="mt-0 animate-reveal-ui">
                <FFmpegTools />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default ToolsPanel;
