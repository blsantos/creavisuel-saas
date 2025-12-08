import { Clock, Award, Calendar, Settings, LayoutGrid, TrendingUp, LucideIcon } from "lucide-react";
import { useContent } from "../contexts/ContentContext";

const iconMap: Record<string, LucideIcon> = {
  "Gain de temps considérable": Clock,
  "Contenu professionnel": Award,
  "Régularité assurée": Calendar,
  "Personnalisation poussée": Settings,
  "Flexibilité totale": LayoutGrid,
  "Résultats prouvés": TrendingUp,
};

const Benefits = () => {
  const { content } = useContent();
  const { benefits } = content;

  return (
    <section id="benefits" className="py-20 lg:py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium text-sm mb-4 backdrop-blur-sm">
              {benefits.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 mb-6">
              {benefits.title}{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{benefits.titleHighlight}</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              {benefits.description}
            </p>

            {/* Stats */}
            <div className="scifi-glass p-6 rounded-2xl">
              <div className="grid grid-cols-3 gap-6">
                {benefits.stats.map((stat, index) => (
                  <div key={index} className={`text-center ${index > 0 && index < benefits.stats.length ? "border-l border-white/10" : ""}`}>
                    <div className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right content - Benefits grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.items.map((benefit, index) => {
              const Icon = iconMap[benefit.title] || Clock;
              return (
                <div
                  key={benefit.title}
                  className="scifi-card p-5 group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 group-hover:border-cyan-400/50 transition-all duration-300">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-slate-100 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
