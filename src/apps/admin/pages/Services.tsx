import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundVideo from "../components/BackgroundVideo";
import { Check, Sparkles, Zap, Calendar, BarChart3, Users, Palette } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Sparkles,
    title: "Visuels Automatisés",
    description: "Génération automatique de visuels basés sur vos données grâce à notre technologie IA.",
    features: [
      "12 visuels automatisés par mois",
      "Templates personnalisés",
      "Intégration données client",
      "Formats réseaux sociaux"
    ]
  },
  {
    icon: Palette,
    title: "Visuels Créatifs",
    description: "Création sur mesure pour vos sujets spécifiques avec une approche design élaborée.",
    features: [
      "8 visuels créatifs par mois",
      "Design personnalisé",
      "Identité visuelle respectée",
      "Révisions incluses"
    ]
  },
  {
    icon: Calendar,
    title: "Gestion & Publication",
    description: "Coordination complète de l'approbation à la publication sur vos réseaux.",
    features: [
      "Processus d'approbation fluide",
      "Planification optimisée",
      "Multi-plateformes",
      "Calendrier éditorial"
    ]
  },
  {
    icon: BarChart3,
    title: "Stratégie & Analyse",
    description: "Développement d'une stratégie de contenu alignée sur vos objectifs.",
    features: [
      "Ligne éditoriale définie",
      "Analyse de performance",
      "Rapports mensuels",
      "Ajustements stratégiques"
    ]
  },
  {
    icon: Zap,
    title: "Automatisation",
    description: "Mise en place des outils et plateformes pour une gestion efficace.",
    features: [
      "Configuration initiale",
      "Hub de gestion dédié",
      "Workflows automatisés",
      "Formation incluse"
    ]
  },
  {
    icon: Users,
    title: "Accompagnement",
    description: "Support continu et collaboration ouverte pour répondre à vos besoins.",
    features: [
      "Interlocuteur dédié",
      "Réunions de suivi",
      "Support réactif",
      "Évolution continue"
    ]
  }
];

const Services = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
          {/* Robot mascot video */}
          <BackgroundVideo 
            src="/videos/robot-present.mp4" 
            position="bottom-right" 
            opacity={0.35} 
            size="lg"
            className="hidden lg:block"
          />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
              Nos Services
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Solutions complètes pour vos{" "}
              <span className="text-primary">réseaux sociaux</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              CréaVisuel automatise et personnalise la création de contenus visuels, 
              de la conception à la publication, adapté à vos besoins spécifiques.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <service.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-accent flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 bg-secondary overflow-hidden">
          <BackgroundVideo 
            src="/videos/robot-float.mp4" 
            position="bottom-left" 
            opacity={0.3} 
            size="md"
            className="hidden md:block"
          />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-6">
              Prêt à transformer votre présence digitale ?
            </h2>
            <p className="text-secondary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Contactez-nous pour discuter de vos besoins et découvrir comment CréaVisuel peut vous aider.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                Demander un devis
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
