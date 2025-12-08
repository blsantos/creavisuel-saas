import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";
import { Link } from "react-router-dom";
import BackgroundVideo from "./BackgroundVideo";

const Hero = () => {
  const { content } = useContent();
  const { hero } = content;

  return (
    <section className="relative min-h-screen pt-20 lg:pt-24 overflow-hidden gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "-2s" }} />
      </div>

      {/* Robot mascot videos - subtle background */}
      <BackgroundVideo 
        src="/videos/robot-dancing.mp4" 
        position="bottom-right" 
        opacity={0.4} 
        size="lg"
        className="hidden lg:block mr-20"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          {/* Text Content */}
          <div className="text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{hero.badge}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-6">
              <span className="text-primary">CréaVisuel</span>
              <br />
              <span className="text-secondary">{hero.title}</span>
              <br />
              <span className="text-foreground">{hero.titleHighlight}</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              {hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                  {hero.ctaPrimary}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" size="lg" className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-semibold px-8">
                  {hero.ctaSecondary}
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 pt-8 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-4">Déjà adopté par de nombreux professionnels</p>
              <div className="flex items-center justify-center gap-8">
                {hero.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L48 105C96 90 192 60 288 45C384 30 480 30 576 37.5C672 45 768 60 864 67.5C960 75 1056 75 1152 67.5C1248 60 1344 45 1392 37.5L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
