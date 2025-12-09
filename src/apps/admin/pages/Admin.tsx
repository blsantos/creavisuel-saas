import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useContent } from "../contexts/ContentContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Lock, Home, Save, Eye, Monitor, Tablet, Smartphone, RotateCcw, ArrowLeft, LayoutDashboard, Wrench, Users, Palette, Brain, BarChart3, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GrapesEditor from "../components/admin/GrapesEditor";
import PagesDashboard from "../components/admin/PagesDashboard";
import ToolsPanel from "../components/admin/tools/ToolsPanel";
import Clients from "./Clients";
import ImageStudioDashboard from "./ImageStudioDashboard";
import AIAssistants from "./AIAssistants";
import Dashboard from "./Dashboard";
import BillingManagement from "../components/admin/billing/BillingManagement";
import { getPageName } from "@/lib/contentToHtml";
import creavisuelLogo from "@/assets/logo-creavisuel2025.png";
import "../components/admin/GrapesEditorStyles.css";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setError("");
    } else {
      setError("Mot de passe incorrect");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={creavisuelLogo} alt="CréaVisuel" className="h-12" />
          </div>
          <CardTitle className="text-2xl">Admin CréaVisuel</CardTitle>
          <p className="text-muted-foreground">Connectez-vous pour gérer le contenu</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full">Se connecter</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

type AdminView = "dashboard" | "editor";
type AdminTab = "stats" | "pages" | "clients" | "billing" | "ai" | "studio" | "tools";

const AdminDashboard = () => {
  const { logout } = useAuth();
  const { content } = useContent();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editorKey, setEditorKey] = useState(0);
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [editingPageId, setEditingPageId] = useState<string>("home");
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");

  const handleSave = (html: string, css: string) => {
    toast({ 
      title: "Page sauvegardée", 
      description: `${getPageName(editingPageId)} a été enregistrée.` 
    });
  };

  const handleReset = () => {
    localStorage.removeItem(`creavisuel-gjs-${editingPageId}-html`);
    localStorage.removeItem(`creavisuel-gjs-${editingPageId}-css`);
    setEditorKey(prev => prev + 1);
    toast({ 
      title: "Éditeur réinitialisé", 
      description: `Le contenu original de ${getPageName(editingPageId)} a été restauré.` 
    });
  };

  const handlePreview = () => {
    const previewUrls: Record<string, string> = {
      home: "/",
      services: "/services",
      about: "/about",
      contact: "/contact",
      hero: "/",
      benefits: "/",
      "how-it-works": "/",
      industries: "/",
      pricing: "/#pricing",
      testimonials: "/",
      cta: "/",
    };
    window.open(previewUrls[editingPageId] || "/", "_blank");
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
    setEditorKey(prev => prev + 1);
    setCurrentView("editor");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  if (currentView === "dashboard") {
    return (
      <div className="h-screen bg-[#1a1a1a] flex flex-col">
        {/* Header */}
        <header className="h-14 bg-[#2a2a2a] border-b border-[#3a3a3a] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <img src={creavisuelLogo} alt="CréaVisuel" className="h-8" />
            <div className="h-6 w-px bg-[#4a4a4a]" />
            <h1 className="text-white font-semibold">Administration</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white hover:bg-[#3a3a3a]"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)} className="flex-1 flex flex-col">
          <div className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-6">
            <TabsList className="bg-transparent h-12 p-0 gap-4">
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="pages"
                className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Pages du site
              </TabsTrigger>
              <TabsTrigger
                value="clients"
                className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Users className="w-4 h-4 mr-2" />
                Clients
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Facturation
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Brain className="w-4 h-4 mr-2" />
                Assistants IA
              </TabsTrigger>
              <TabsTrigger
                value="studio"
                className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Palette className="w-4 h-4 mr-2" />
                Studio Création
              </TabsTrigger>
              <TabsTrigger
                value="tools"
                className="data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Outils Média
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stats" className="flex-1 mt-0 h-[calc(100vh-112px)]">
            <Dashboard />
          </TabsContent>

          <TabsContent value="pages" className="flex-1 mt-0">
            <PagesDashboard onEditPage={handleEditPage} />
          </TabsContent>

          <TabsContent value="clients" className="flex-1 mt-0 h-[calc(100vh-112px)]">
            <Clients />
          </TabsContent>

          <TabsContent value="billing" className="flex-1 mt-0 h-[calc(100vh-112px)] overflow-auto p-6">
            <BillingManagement />
          </TabsContent>

          <TabsContent value="ai" className="flex-1 mt-0 h-[calc(100vh-112px)]">
            <AIAssistants />
          </TabsContent>

          <TabsContent value="studio" className="flex-1 mt-0 h-[calc(100vh-112px)]">
            <ImageStudioDashboard />
          </TabsContent>

          <TabsContent value="tools" className="flex-1 mt-0 h-[calc(100vh-112px)]">
            <ToolsPanel />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#1a1a1a]">
      {/* Top Toolbar */}
      <header className="h-12 bg-[#2a2a2a] border-b border-[#3a3a3a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div className="h-4 w-px bg-[#4a4a4a]" />
          <h1 className="text-white font-semibold text-sm">
            Édition: {getPageName(editingPageId)}
          </h1>
          <div className="h-4 w-px bg-[#4a4a4a]" />
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3a3a3a]"
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3a3a3a]"
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3a3a3a]"
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Site
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-orange-400 hover:text-orange-300 hover:bg-[#3a3a3a]"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            size="sm" 
            className="h-8 bg-primary hover:bg-primary/90"
            onClick={() => {
              toast({ 
                title: "Sauvegarde", 
                description: "Utilisez Ctrl+S pour sauvegarder vos modifications." 
              });
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Publier
          </Button>
          <div className="h-4 w-px bg-[#4a4a4a] mx-2" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-gray-400 hover:text-white hover:bg-[#3a3a3a]"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <GrapesEditor 
          key={editorKey} 
          pageId={editingPageId}
          onSave={handleSave} 
          initialContent={content} 
        />
      </div>
    </div>
  );
};

const Admin = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin;
