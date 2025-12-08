import { Clock, Award, Calendar, Settings, LayoutGrid, TrendingUp, LucideIcon } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";

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
    <section id="benefits" className="py-20 lg:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              {benefits.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
              {benefits.title}{" "}
              <span className="text-gradient">{benefits.titleHighlight}</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {benefits.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 p-6 bg-muted/50 rounded-2xl border border-border">
              {benefits.stats.map((stat, index) => (
                <div key={index} className={`text-center ${index > 0 && index < benefits.stats.length ? "border-l border-border" : ""}`}>
                  <div className="text-3xl lg:text-4xl font-extrabold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - Benefits grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.items.map((benefit, index) => {
              const Icon = iconMap[benefit.title] || Clock;
              return (
                <div
                  key={benefit.title}
                  className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
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
