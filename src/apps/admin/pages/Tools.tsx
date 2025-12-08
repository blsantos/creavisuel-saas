import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundVideo from "../components/BackgroundVideo";
import { Wrench, Code, Image, Video, Music, FileText, Cpu, Database } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const toolCategories = [
  {
    icon: Music,
    title: "Audio Tools",
    description: "Traitement et conversion de fichiers audio",
    tools: [
      "Concaténation audio",
      "Conversion de formats",
      "Extraction audio depuis vidéo"
    ],
    endpoint: "/v1/audio"
  },
  {
    icon: Video,
    title: "Video Tools",
    description: "Édition et traitement vidéo",
    tools: [
      "Combinaison de vidéos",
      "Extraction de frames clés",
      "Ajout de sous-titres",
      "Image vers vidéo"
    ],
    endpoint: "/v1/video"
  },
  {
    icon: Image,
    title: "Image Tools",
    description: "Traitement et manipulation d'images",
    tools: [
      "Redimensionnement",
      "Conversion de formats",
      "Optimisation"
    ],
    endpoint: "/v1/image"
  },
  {
    icon: Code,
    title: "Code Execution",
    description: "Exécution de code à distance",
    tools: [
      "Exécution Python",
      "Scripts automatisés"
    ],
    endpoint: "/v1/code"
  },
  {
    icon: FileText,
    title: "Media Processing",
    description: "Traitement média avancé",
    tools: [
      "Transcription audio/vidéo",
      "Traduction de contenu",
      "Génération de captions"
    ],
    endpoint: "/v1/media"
  },
  {
    icon: Database,
    title: "Cloud Storage",
    description: "Intégration services cloud",
    tools: [
      "Google Drive",
      "Amazon S3",
      "Google Cloud Storage",
      "Dropbox"
    ],
    endpoint: "/v1/s3"
  },
  {
    icon: Cpu,
    title: "FFmpeg",
    description: "Outils FFmpeg avancés",
    tools: [
      "Conversion de formats",
      "Compression",
      "Traitement personnalisé"
    ],
    endpoint: "/v1/ffmpeg"
  }
];

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
          <BackgroundVideo
            src="/videos/robot-present.mp4"
            position="bottom-right"
            opacity={0.35}
            size="lg"
            className="hidden lg:block"
          />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
              <Wrench className="w-4 h-4 inline-block mr-2" />
              Nos Outils
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Boîte à outils{" "}
              <span className="text-primary">No-Code</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              API gratuite et open-source pour le traitement média avancé.
              Une alternative libre aux services coûteux comme Cloud Convert, Createomate, et plus encore.
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toolCategories.map((category, index) => (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {category.tools.map((tool, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                          {tool}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 pt-4 border-t border-border">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {category.endpoint}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* API Info Section */}
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-6">
                API 100% Gratuite et Open-Source
              </h2>
              <p className="text-secondary-foreground/80 text-lg mb-8 leading-relaxed">
                Développée avec Python et Flask, notre API offre des fonctionnalités avancées de traitement média
                sans les coûts des services propriétaires. Déployable via Docker sur n'importe quelle infrastructure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  onClick={() => window.open('https://github.com/stephengpope/no-code-architects-toolkit', '_blank')}
                >
                  Documentation GitHub
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() => window.location.href = '/contact'}
                >
                  Demander l'accès
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Code className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Open Source</h3>
                <p className="text-muted-foreground">
                  Code source ouvert sous licence GPL. Utilisez, modifiez et déployez librement.
                </p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Polyvalent</h3>
                <p className="text-muted-foreground">
                  Audio, vidéo, images, transcription, traduction et bien plus encore.
                </p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Performant</h3>
                <p className="text-muted-foreground">
                  Architecture optimisée avec système de queue pour traiter efficacement vos tâches.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Tools;
