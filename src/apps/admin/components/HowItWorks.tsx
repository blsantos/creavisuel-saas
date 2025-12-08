import { FileText, Sparkles, Share2 } from "lucide-react";
import { useContent } from "../contexts/ContentContext";

const icons = [FileText, Sparkles, Share2];

const HowItWorks = () => {
  const { content } = useContent();
  const { howItWorks } = content;

  return (
    <section id="features" className="py-20 lg:py-32 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium text-sm mb-4 backdrop-blur-sm">
            {howItWorks.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 mb-6">
            {howItWorks.title}{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{howItWorks.titleHighlight}</span>
          </h2>
          <p className="text-lg text-slate-400">
            {howItWorks.description}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {howItWorks.steps.map((step, index) => {
            const Icon = icons[index] || FileText;
            return (
              <div
                key={step.step}
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Connector line */}
                {index < howItWorks.steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
                )}

                <div className="scifi-card p-8 hover:-translate-y-2 transition-all duration-500">
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 group-hover:border-purple-400/50 transition-all duration-300">
                    <Icon className="w-8 h-8 text-purple-400" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
