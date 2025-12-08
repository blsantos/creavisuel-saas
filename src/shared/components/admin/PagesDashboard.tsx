import { useState } from "react";
import { 
  Home, FileText, Users, Phone, Settings, 
  ChevronRight, ChevronDown, Edit3, Eye, 
  Layout, Layers, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import socialNetworkSphere from "@/assets/social-network-sphere.jpg";
import creavisuelLogo from "@/assets/logo-creavisuel2025.png";

interface PageItem {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  status: "published" | "draft";
  lastModified: string;
  children?: PageItem[];
}

interface PagesDashboardProps {
  onEditPage: (pageId: string) => void;
}

const sitePages: PageItem[] = [
  {
    id: "home",
    name: "Accueil",
    path: "/",
    icon: <Home className="w-4 h-4" />,
    status: "published",
    lastModified: "Aujourd'hui",
    children: [
      { id: "hero", name: "Hero Section", path: "/#hero", icon: <Layout className="w-4 h-4" />, status: "published", lastModified: "Aujourd'hui" },
      { id: "benefits", name: "Avantages", path: "/#benefits", icon: <Layers className="w-4 h-4" />, status: "published", lastModified: "Hier" },
      { id: "how-it-works", name: "Comment ça marche", path: "/#how-it-works", icon: <Layers className="w-4 h-4" />, status: "published", lastModified: "Hier" },
      { id: "industries", name: "Industries", path: "/#industries", icon: <Layers className="w-4 h-4" />, status: "published", lastModified: "3 jours" },
      { id: "pricing", name: "Tarifs", path: "/#pricing", icon: <Layers className="w-4 h-4" />, status: "published", lastModified: "1 semaine" },
      { id: "testimonials", name: "Témoignages", path: "/#testimonials", icon: <Layers className="w-4 h-4" />, status: "published", lastModified: "2 semaines" },
      { id: "cta", name: "Call to Action", path: "/#cta", icon: <Layers className="w-4 h-4" />, status: "published", lastModified: "2 semaines" },
    ]
  },
  {
    id: "services",
    name: "Services",
    path: "/services",
    icon: <FileText className="w-4 h-4" />,
    status: "published",
    lastModified: "3 jours"
  },
  {
    id: "about",
    name: "À Propos",
    path: "/about",
    icon: <Users className="w-4 h-4" />,
    status: "published",
    lastModified: "1 semaine"
  },
  {
    id: "contact",
    name: "Contact",
    path: "/contact",
    icon: <Phone className="w-4 h-4" />,
    status: "published",
    lastModified: "1 semaine"
  },
];

const PageTreeItem = ({ 
  page, 
  depth = 0, 
  onEdit, 
  onPreview 
}: { 
  page: PageItem; 
  depth?: number; 
  onEdit: (id: string) => void;
  onPreview: (path: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const hasChildren = page.children && page.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
          hover:bg-[#3a3a3a] group cursor-pointer
          ${depth === 0 ? 'bg-[#2a2a2a]' : 'ml-6 border-l border-[#3a3a3a]'}
        `}
        style={{ marginLeft: depth > 0 ? `${depth * 24}px` : 0 }}
      >
        {hasChildren && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        
        <div className="text-primary/80">{page.icon}</div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{page.name}</span>
            <Badge 
              variant={page.status === "published" ? "default" : "secondary"}
              className={`text-xs ${page.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
            >
              {page.status === "published" ? "Publié" : "Brouillon"}
            </Badge>
          </div>
          <span className="text-gray-500 text-xs">{page.path} • Modifié {page.lastModified}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#4a4a4a]"
            onClick={() => onPreview(page.path)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/20"
            onClick={() => onEdit(page.id)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {page.children!.map((child) => (
            <PageTreeItem 
              key={child.id} 
              page={child} 
              depth={depth + 1} 
              onEdit={onEdit}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PagesDashboard = ({ onEditPage }: PagesDashboardProps) => {
  const handlePreview = (path: string) => {
    window.open(path, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* Background decoration */}
      <div 
        className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 w-[600px] h-[600px] opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(${socialNetworkSphere})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      />

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={creavisuelLogo} alt="CréaVisuel" className="h-10" />
            <div className="h-8 w-px bg-[#3a3a3a]" />
            <div>
              <h1 className="text-white text-xl font-semibold">Gestionnaire de Pages</h1>
              <p className="text-gray-500 text-sm">Sélectionnez une page à modifier</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]">
              <Globe className="w-4 h-4 mr-2" />
              Voir le site
            </Button>
            <Button variant="outline" className="border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">4</p>
                  <p className="text-gray-500 text-sm">Pages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">7</p>
                  <p className="text-gray-500 text-sm">Sections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">4</p>
                  <p className="text-gray-500 text-sm">Publiées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-gray-500 text-sm">Brouillons</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pages Tree */}
        <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" />
                Structure du site
              </h2>
              <Button 
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => onEditPage("home")}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Éditer tout le site
              </Button>
            </div>
            
            <div className="space-y-2">
              {sitePages.map((page) => (
                <PageTreeItem 
                  key={page.id} 
                  page={page} 
                  onEdit={onEditPage}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PagesDashboard;
