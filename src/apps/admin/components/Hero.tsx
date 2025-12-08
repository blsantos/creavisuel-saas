import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useContent } from "../contexts/ContentContext";
import { Link } from "react-router-dom";
import BackgroundVideo from "./BackgroundVideo";

const Hero = () => {
  const { content } = useContent();
  const { hero } = content;

  return (
    <section className="relative min-h-screen pt-20 lg:pt-24 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Sci-Fi Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "-2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl animate-glow-pulse" />
      </div>

      {/* Rotating Rings - Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-20 pointer-events-none hidden lg:block">
        <div className="absolute inset-0 border border-dashed border-purple-500/30 rounded-full animate-globe-spin" style={{ animationDuration: '25s' }} />
        <div className="absolute inset-8 border border-dashed border-cyan-500/30 rounded-full animate-globe-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
        <div className="absolute inset-16 border border-dashed border-purple-500/30 rounded-full animate-globe-spin" style={{ animationDuration: '15s' }} />
      </div>

      {/* Robot mascot video */}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold text-sm mb-6 backdrop-blur-sm animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>{hero.badge}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">CréaVisuel</span>
              <br />
              <span className="text-cyan-400">{hero.title}</span>
              <br />
              <span className="text-slate-200">{hero.titleHighlight}</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/contact">
                <Button size="lg" className="scifi-button font-semibold px-8">
                  {hero.ctaPrimary}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/services">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border border-cyan-500/50 text-cyan-400 bg-transparent hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 font-semibold px-8"
                >
                  {hero.ctaSecondary}
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 pt-8 border-t border-white/10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <p className="text-sm font-medium text-slate-500 mb-4">Déjà adopté par de nombreux professionnels</p>
              <div className="flex items-center justify-center gap-8">
                {hero.stats.map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-500">{stat.value}</div>
                    <div className="text-sm text-slate-500">{stat.label}</div>
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
          <path d="M0 120L48 105C96 90 192 60 288 45C384 30 480 30 576 37.5C672 45 768 60 864 67.5C960 75 1056 75 1152 67.5C1248 60 1344 45 1392 37.5L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(222, 47%, 6%)"/>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
