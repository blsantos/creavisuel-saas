import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Film, ImageIcon, Code, Mic, Cloud, Clapperboard, ExternalLink } from "lucide-react";
import AudioTools from "./AudioTools";
import VideoTools from "./VideoTools";
import ImageTools from "./ImageTools";
import CodeTools from "./CodeTools";
import MediaTools from "./MediaTools";
import StorageTools from "./StorageTools";
import FFmpegTools from "./FFmpegTools";

const ToolsPanel = () => {
  const [activeTab, setActiveTab] = useState("audio");

  const tools = [
    { id: "audio", label: "Audio", icon: Music, endpoint: "/v1/audio" },
    { id: "video", label: "Vidéo", icon: Film, endpoint: "/v1/video" },
    { id: "image", label: "Images", icon: ImageIcon, endpoint: "/v1/image" },
    { id: "code", label: "Code", icon: Code, endpoint: "/v1/code" },
    { id: "media", label: "Media", icon: Mic, endpoint: "/v1/media" },
    { id: "storage", label: "Cloud", icon: Cloud, endpoint: "/v1/s3" },
    { id: "ffmpeg", label: "FFmpeg", icon: Clapperboard, endpoint: "/v1/ffmpeg" },
  ];

  return (
    <div className="h-full bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#3a3a3a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">No-Code Architects Toolkit</h1>
            <p className="text-gray-400 mt-1">API 100% Gratuite et Open-Source pour le traitement média</p>
          </div>
          <a 
            href="https://github.com/blsantos/no-code-architects-toolkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm">GitHub</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-[#3a3a3a] px-6">
          <TabsList className="bg-transparent h-12 p-0 gap-1">
            {tools.map((tool) => (
              <TabsTrigger
                key={tool.id}
                value={tool.id}
                className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white text-gray-400 px-4 py-2 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <tool.icon className="w-4 h-4 mr-2" />
                {tool.label}
                <span className="ml-2 text-xs text-gray-500">{tool.endpoint}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <TabsContent value="audio" className="mt-0">
              <AudioTools />
            </TabsContent>
            <TabsContent value="video" className="mt-0">
              <VideoTools />
            </TabsContent>
            <TabsContent value="image" className="mt-0">
              <ImageTools />
            </TabsContent>
            <TabsContent value="code" className="mt-0">
              <CodeTools />
            </TabsContent>
            <TabsContent value="media" className="mt-0">
              <MediaTools />
            </TabsContent>
            <TabsContent value="storage" className="mt-0">
              <StorageTools />
            </TabsContent>
            <TabsContent value="ffmpeg" className="mt-0">
              <FFmpegTools />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ToolsPanel;
