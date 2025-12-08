import { useEffect, useRef, useState } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "grapesjs-preset-webpage";
import { SiteContent } from "@/content/siteContent";
import { generatePageHtml } from "@/lib/contentToHtml";

interface GrapesEditorProps {
  pageId: string;
  onSave?: (html: string, css: string) => void;
  initialContent?: SiteContent;
}

const GrapesEditor = ({ pageId, onSave, initialContent }: GrapesEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Storage key based on page ID
  const getStorageKey = (suffix: string) => `creavisuel-gjs-${pageId}-${suffix}`;

  useEffect(() => {
    if (!editorRef.current) return;

    // Check if there's saved content for THIS PAGE in localStorage
    const savedHtml = localStorage.getItem(getStorageKey("html"));
    const savedCss = localStorage.getItem(getStorageKey("css"));
    
    // Generate initial HTML from content if no saved version exists for this page
    const initialHtml = savedHtml || (initialContent ? generatePageHtml(pageId, initialContent) : "");
    const initialCss = savedCss || "";

    const gjsEditor = grapesjs.init({
      container: editorRef.current,
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
      plugins: ["grapesjs-preset-webpage"],
      pluginsOpts: {
        "grapesjs-preset-webpage": {
          blocksBasicOpts: { flexGrid: true },
          navbarOpts: false,
          countdownOpts: false,
          formsOpts: false,
        },
      },
      canvas: {
        styles: [
          "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
        ],
      },
      blockManager: {
        appendTo: "#blocks",
      },
      layerManager: {
        appendTo: "#layers-container",
      },
      styleManager: {
        appendTo: "#styles-container",
        sectors: [
          {
            name: "Dimensions",
            open: false,
            buildProps: ["width", "height", "min-height", "max-width", "margin", "padding"],
          },
          {
            name: "Typographie",
            open: false,
            buildProps: ["font-family", "font-size", "font-weight", "letter-spacing", "color", "line-height", "text-align", "text-decoration", "text-transform"],
          },
          {
            name: "Décoration",
            open: false,
            buildProps: ["background-color", "background", "border-radius", "border", "box-shadow"],
          },
          {
            name: "Flexbox",
            open: false,
            buildProps: ["display", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "gap"],
          },
          {
            name: "Extra",
            open: false,
            buildProps: ["opacity", "transition", "transform", "cursor", "overflow"],
          },
        ],
      },
      traitManager: {
        appendTo: "#traits-container",
      },
      selectorManager: {
        appendTo: "#selectors-container",
      },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Tablet", width: "768px", widthMedia: "992px" },
          { name: "Mobile", width: "320px", widthMedia: "480px" },
        ],
      },
    });

    // Load the initial content
    if (initialHtml) {
      gjsEditor.setComponents(initialHtml);
      if (initialCss) {
        gjsEditor.setStyle(initialCss);
      }
    }

    // Add custom blocks for CréaVisuel
    gjsEditor.BlockManager.add("hero-section", {
      label: "Hero Section",
      category: "CréaVisuel",
      content: `
        <section class="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center py-20 px-4">
          <div class="text-center max-w-4xl mx-auto">
            <span class="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold mb-6">Agent IA Nouvelle Génération</span>
            <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">Automatisez vos <span class="text-purple-400">réseaux sociaux</span></h1>
            <p class="text-xl text-purple-200 mb-8">Créez du contenu engageant automatiquement avec notre agent IA intelligent.</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#" class="px-8 py-4 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition">Commencer gratuitement</a>
              <a href="#" class="px-8 py-4 border border-purple-400 text-purple-300 font-semibold rounded-lg hover:bg-purple-500/20 transition">En savoir plus</a>
            </div>
          </div>
        </section>
      `,
    });

    gjsEditor.BlockManager.add("features-grid", {
      label: "Grille de fonctionnalités",
      category: "CréaVisuel",
      content: `
        <section class="py-20 px-4 bg-gray-900">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-white mb-12">Nos fonctionnalités</h2>
            <div class="grid md:grid-cols-3 gap-8">
              <div class="bg-gray-800 p-6 rounded-xl">
                <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">🚀</span>
                </div>
                <h3 class="text-xl font-semibold text-white mb-2">Automatisation</h3>
                <p class="text-gray-400">Automatisez vos publications sur tous vos réseaux.</p>
              </div>
              <div class="bg-gray-800 p-6 rounded-xl">
                <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">✨</span>
                </div>
                <h3 class="text-xl font-semibold text-white mb-2">IA Créative</h3>
                <p class="text-gray-400">Générez du contenu unique et engageant.</p>
              </div>
              <div class="bg-gray-800 p-6 rounded-xl">
                <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">📊</span>
                </div>
                <h3 class="text-xl font-semibold text-white mb-2">Analytics</h3>
                <p class="text-gray-400">Suivez vos performances en temps réel.</p>
              </div>
            </div>
          </div>
        </section>
      `,
    });

    gjsEditor.BlockManager.add("pricing-table", {
      label: "Tableau de tarifs",
      category: "CréaVisuel",
      content: `
        <section class="py-20 px-4 bg-gray-950">
          <div class="max-w-5xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-white mb-4">Nos tarifs</h2>
            <p class="text-center text-gray-400 mb-12">Choisissez le plan qui vous convient</p>
            <div class="grid md:grid-cols-3 gap-8">
              <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <h3 class="text-xl font-semibold text-white mb-2">Starter</h3>
                <p class="text-3xl font-bold text-white mb-4">29€<span class="text-lg font-normal text-gray-400">/mois</span></p>
                <ul class="space-y-3 mb-8">
                  <li class="text-gray-400">✓ 10 publications/mois</li>
                  <li class="text-gray-400">✓ 1 compte social</li>
                  <li class="text-gray-400">✓ Support email</li>
                </ul>
                <a href="#" class="block text-center py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">Commencer</a>
              </div>
              <div class="bg-purple-900 border-2 border-purple-500 rounded-2xl p-8 transform scale-105">
                <span class="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full mb-4">Populaire</span>
                <h3 class="text-xl font-semibold text-white mb-2">Pro</h3>
                <p class="text-3xl font-bold text-white mb-4">79€<span class="text-lg font-normal text-purple-300">/mois</span></p>
                <ul class="space-y-3 mb-8">
                  <li class="text-purple-200">✓ Publications illimitées</li>
                  <li class="text-purple-200">✓ 5 comptes sociaux</li>
                  <li class="text-purple-200">✓ Support prioritaire</li>
                </ul>
                <a href="#" class="block text-center py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">Commencer</a>
              </div>
              <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <h3 class="text-xl font-semibold text-white mb-2">Enterprise</h3>
                <p class="text-3xl font-bold text-white mb-4">Sur mesure</p>
                <ul class="space-y-3 mb-8">
                  <li class="text-gray-400">✓ Tout illimité</li>
                  <li class="text-gray-400">✓ Account manager</li>
                  <li class="text-gray-400">✓ SLA garanti</li>
                </ul>
                <a href="#" class="block text-center py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">Nous contacter</a>
              </div>
            </div>
          </div>
        </section>
      `,
    });

    gjsEditor.BlockManager.add("testimonials", {
      label: "Témoignages",
      category: "CréaVisuel",
      content: `
        <section class="py-20 px-4 bg-gray-900">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-white mb-12">Ce que disent nos clients</h2>
            <div class="grid md:grid-cols-2 gap-8">
              <div class="bg-gray-800 p-8 rounded-2xl">
                <div class="flex items-center gap-1 mb-4">
                  <span class="text-yellow-400">★★★★★</span>
                </div>
                <p class="text-gray-300 mb-6">"CréaVisuel a révolutionné ma façon de gérer mes réseaux sociaux. Je gagne 10h par semaine !"</p>
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-purple-500 rounded-full"></div>
                  <div>
                    <p class="font-semibold text-white">Marie Dupont</p>
                    <p class="text-gray-400 text-sm">Fondatrice, StartupXYZ</p>
                  </div>
                </div>
              </div>
              <div class="bg-gray-800 p-8 rounded-2xl">
                <div class="flex items-center gap-1 mb-4">
                  <span class="text-yellow-400">★★★★★</span>
                </div>
                <p class="text-gray-300 mb-6">"L'IA comprend parfaitement mon ton de marque. Les résultats sont incroyables."</p>
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-purple-500 rounded-full"></div>
                  <div>
                    <p class="font-semibold text-white">Jean Martin</p>
                    <p class="text-gray-400 text-sm">CEO, AgenceDigitale</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      `,
    });

    gjsEditor.BlockManager.add("cta-section", {
      label: "Section CTA",
      category: "CréaVisuel",
      content: `
        <section class="py-20 px-4 bg-gradient-to-r from-purple-900 to-indigo-900">
          <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">Prêt à transformer votre présence sociale ?</h2>
            <p class="text-xl text-purple-200 mb-8">Rejoignez des milliers de professionnels qui ont déjà automatisé leur contenu.</p>
            <a href="#" class="inline-block px-8 py-4 bg-white text-purple-900 font-semibold rounded-lg hover:bg-gray-100 transition">Essayer gratuitement</a>
          </div>
        </section>
      `,
    });

    gjsEditor.BlockManager.add("footer", {
      label: "Footer",
      category: "CréaVisuel",
      content: `
        <footer class="py-12 px-4 bg-gray-950 border-t border-gray-800">
          <div class="max-w-6xl mx-auto">
            <div class="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 class="text-lg font-bold text-white mb-4">CréaVisuel</h3>
                <p class="text-gray-400 text-sm">L'agent IA qui automatise votre présence sur les réseaux sociaux.</p>
              </div>
              <div>
                <h4 class="font-semibold text-white mb-4">Produit</h4>
                <ul class="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" class="hover:text-white transition">Fonctionnalités</a></li>
                  <li><a href="#" class="hover:text-white transition">Tarifs</a></li>
                  <li><a href="#" class="hover:text-white transition">API</a></li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-white mb-4">Entreprise</h4>
                <ul class="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" class="hover:text-white transition">À propos</a></li>
                  <li><a href="#" class="hover:text-white transition">Blog</a></li>
                  <li><a href="#" class="hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-white mb-4">Légal</h4>
                <ul class="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" class="hover:text-white transition">Confidentialité</a></li>
                  <li><a href="#" class="hover:text-white transition">CGU</a></li>
                </ul>
              </div>
            </div>
            <div class="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
              <p>© 2024 CréaVisuel. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      `,
    });

    // Auto-save on changes for this specific page
    gjsEditor.on("storage:store", () => {
      const html = gjsEditor.getHtml();
      const css = gjsEditor.getCss();
      localStorage.setItem(getStorageKey("html"), html);
      localStorage.setItem(getStorageKey("css"), css || "");
    });

    // Save shortcut (Ctrl+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const html = gjsEditor.getHtml();
        const css = gjsEditor.getCss();
        localStorage.setItem(getStorageKey("html"), html);
        localStorage.setItem(getStorageKey("css"), css || "");
        if (onSave) {
          onSave(html, css || "");
        }
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);

    setEditor(gjsEditor);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      gjsEditor.destroy();
    };
  }, [pageId, initialContent]);

  return (
    <div className="gjs-editor-container flex h-full bg-[#1a1a1a]">
      {/* Left Panel - Blocks */}
      <div className="w-64 bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#3a3a3a]">
          <h3 className="text-white text-sm font-semibold">Blocs</h3>
        </div>
        <div id="blocks" className="flex-1 overflow-y-auto p-2" />
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={editorRef} className="flex-1" />
      </div>

      {/* Right Panel - Styles & Layers */}
      <div className="w-72 bg-[#2a2a2a] border-l border-[#3a3a3a] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#3a3a3a]">
          <h3 className="text-white text-sm font-semibold">Sélecteur</h3>
        </div>
        <div id="selectors-container" className="p-2 border-b border-[#3a3a3a]" />
        
        <div className="p-3 border-b border-[#3a3a3a]">
          <h3 className="text-white text-sm font-semibold">Styles</h3>
        </div>
        <div id="styles-container" className="flex-1 overflow-y-auto" />
        
        <div className="p-3 border-b border-[#3a3a3a]">
          <h3 className="text-white text-sm font-semibold">Propriétés</h3>
        </div>
        <div id="traits-container" className="p-2 border-b border-[#3a3a3a]" />
        
        <div className="p-3 border-b border-[#3a3a3a]">
          <h3 className="text-white text-sm font-semibold">Calques</h3>
        </div>
        <div id="layers-container" className="flex-1 overflow-y-auto max-h-48" />
      </div>
    </div>
  );
};

export default GrapesEditor;
