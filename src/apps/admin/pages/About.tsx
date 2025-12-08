import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundVideo from "../components/BackgroundVideo";
import { Heart, Shield, Lightbulb, Users } from "lucide-react";
import brunoProfile from "@/assets/bruno-profile.jpg";

const values = [
  {
    icon: Heart,
    title: "Engagement Client",
    description: "Une collaboration ouverte pour comprendre et répondre à vos besoins, en maintenant une qualité de service élevée."
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Nous utilisons les dernières technologies d'automatisation et d'IA pour optimiser votre communication visuelle."
  },
  {
    icon: Shield,
    title: "Qualité",
    description: "Chaque visuel est conçu avec soin pour refléter votre identité et engager votre audience."
  },
  {
    icon: Users,
    title: "Diversité & Inclusion",
    description: "B2Santos s'engage contre le racisme et la xénophobie, promouvant un environnement inclusif et respectueux."
  }
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-accent/5 to-background overflow-hidden">
          {/* Robot mascot video */}
          <BackgroundVideo 
            src="/videos/robot-animation.mp4" 
            position="right" 
            opacity={0.35} 
            size="md"
            className="hidden lg:block"
          />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-6">
                  À Propos
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                  B2Santos{" "}
                  <span className="text-primary">Communication</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                  B2Santos propose des services numériques divers, avec une approche client centrée 
                  et un engagement envers la qualité, l'innovation et la diversité.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  CréaVisuel est notre solution phare pour automatiser et personnaliser la création 
                  de contenus visuels pour les réseaux sociaux, en fournissant un service complet 
                  de la conception à la publication.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
                  <img 
                    src={brunoProfile} 
                    alt="Bruno - Fondateur B2Santos" 
                    className="relative w-full max-w-md rounded-3xl shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nos Valeurs
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ce qui guide notre travail au quotidien
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="relative py-20 bg-muted/50 overflow-hidden">
          <BackgroundVideo 
            src="/videos/robot-dancing.mp4" 
            position="bottom-left" 
            opacity={0.3} 
            size="lg"
            className="hidden md:block"
          />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                Notre Mission
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                Offrir une solution complète de création de contenus visuels pour les réseaux sociaux, 
                en automatisant les processus tout en maintenant une qualité créative exceptionnelle. 
                Nous croyons que chaque entreprise mérite une présence digitale professionnelle et engageante.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="p-6">
                  <div className="text-4xl font-extrabold text-primary mb-2">250+</div>
                  <div className="text-muted-foreground">Visuels créés par mois</div>
                </div>
                <div className="p-6">
                  <div className="text-4xl font-extrabold text-accent mb-2">50+</div>
                  <div className="text-muted-foreground">Clients satisfaits</div>
                </div>
                <div className="p-6">
                  <div className="text-4xl font-extrabold text-secondary mb-2">98%</div>
                  <div className="text-muted-foreground">Taux de satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
