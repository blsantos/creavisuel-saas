import { 
  Scissors, 
  UtensilsCrossed, 
  Sparkles, 
  Dumbbell, 
  Croissant, 
  Wine,
  Home,
  Stethoscope,
  LucideIcon
} from "lucide-react";
import { useContent } from "../contexts/ContentContext";

const iconMap: Record<string, LucideIcon> = {
  "Salons de coiffure": Scissors,
  "Restaurants": UtensilsCrossed,
  "Instituts de beauté": Sparkles,
  "Salles de sport": Dumbbell,
  "Boulangeries": Croissant,
  "Bars à cocktails": Wine,
  "Agences immobilières": Home,
  "Vétérinaires": Stethoscope,
};

const Industries = () => {
  const { content } = useContent();
  const { industries } = content;

  return (
    <section id="industries" className="py-20 lg:py-32 bg-slate-900/50 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium text-sm mb-4 backdrop-blur-sm">
            {industries.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 mb-6">
            {industries.title}{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{industries.titleHighlight}</span>
          </h2>
          <p className="text-lg text-slate-400">
            {industries.description}
          </p>
        </div>

        {/* Industries grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.items.map((industry, index) => {
            const Icon = iconMap[industry.name] || Sparkles;
            return (
              <div
                key={industry.name}
                className="scifi-card p-6 group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-cyan-500/30 group-hover:border-cyan-400/50 transition-all duration-300">
                  <Icon className="w-7 h-7 text-cyan-400" />
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-3">
                  {industry.name}
                </h3>

                <ul className="space-y-2">
                  {industry.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-500 mt-10">
          Et bien d'autres : fleuristes, librairies, auto-écoles, pharmacies, écoles de danse...
        </p>
      </div>
    </section>
  );
};

export default Industries;
