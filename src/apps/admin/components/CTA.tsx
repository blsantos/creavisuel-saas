import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useContent } from "../contexts/ContentContext";
import { Link } from "react-router-dom";
import BackgroundVideo from "./BackgroundVideo";

const CTA = () => {
  const { content } = useContent();
  const { cta } = content;

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 via-cyan-500/5 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Rotating rings */}
      <div className="absolute top-1/2 right-20 -translate-y-1/2 w-[300px] h-[300px] opacity-20 pointer-events-none hidden lg:block">
        <div className="absolute inset-0 border border-dashed border-purple-500/50 rounded-full animate-globe-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute inset-8 border border-dashed border-cyan-500/50 rounded-full animate-globe-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold text-sm mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>Prêt à révolutionner votre communication ?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-100 mb-6">
            {cta.title}{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{cta.titleHighlight}</span>
          </h2>
          
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {cta.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="scifi-button font-semibold px-8">
                {cta.ctaPrimary}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/services">
              <Button 
                variant="outline" 
                size="lg" 
                className="border border-cyan-500/50 text-cyan-400 bg-transparent hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold px-8"
              >
                {cta.ctaSecondary}
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Démonstration personnalisée • Sans engagement • Support inclus
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
