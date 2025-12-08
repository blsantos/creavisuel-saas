import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";
import { Link } from "react-router-dom";
import BackgroundVideo from "./BackgroundVideo";

const CTA = () => {
  const { content } = useContent();
  const { cta } = content;

  return (
    <section className="py-20 lg:py-32 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Robot mascot video */}
      <BackgroundVideo 
        src="/videos/robot-float.mp4" 
        position="bottom-right" 
        opacity={0.35} 
        size="lg"
        className="hidden lg:block"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Prêt à révolutionner votre communication ?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-foreground mb-6">
            {cta.title}{" "}
            <span className="text-gradient">{cta.titleHighlight}</span>
          </h2>
          
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {cta.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                {cta.ctaPrimary}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline" size="lg" className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-semibold px-8">
                {cta.ctaSecondary}
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Démonstration personnalisée • Sans engagement • Support inclus
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
