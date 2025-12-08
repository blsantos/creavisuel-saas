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
import { useContent } from "@/contexts/ContentContext";

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
    <section id="industries" className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
            {industries.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
            {industries.title}{" "}
            <span className="text-gradient">{industries.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
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
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-lg font-bold text-foreground mb-3">
                  {industry.name}
                </h3>

                <ul className="space-y-2">
                  {industry.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground mt-10">
          Et bien d'autres : fleuristes, librairies, auto-écoles, pharmacies, écoles de danse...
        </p>
      </div>
    </section>
  );
};

export default Industries;
