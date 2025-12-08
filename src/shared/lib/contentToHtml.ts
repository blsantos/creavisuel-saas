import { SiteContent } from "@/content/siteContent";

// Generate HTML for specific page sections
export const generatePageHtml = (pageId: string, content: SiteContent): string => {
  switch (pageId) {
    case "home":
      return generateHomePageHtml(content);
    case "hero":
      return generateHeroHtml(content);
    case "benefits":
      return generateBenefitsHtml(content);
    case "how-it-works":
      return generateHowItWorksHtml(content);
    case "industries":
      return generateIndustriesHtml(content);
    case "pricing":
      return generatePricingHtml(content);
    case "testimonials":
      return generateTestimonialsHtml(content);
    case "cta":
      return generateCtaHtml(content);
    case "services":
      return generateServicesPageHtml(content);
    case "about":
      return generateAboutPageHtml(content);
    case "contact":
      return generateContactPageHtml(content);
    default:
      return generateHomePageHtml(content);
  }
};

// Get page name for display
export const getPageName = (pageId: string): string => {
  const names: Record<string, string> = {
    home: "Page d'accueil",
    hero: "Section Hero",
    benefits: "Section Avantages",
    "how-it-works": "Section Comment ça marche",
    industries: "Section Industries",
    pricing: "Section Tarifs",
    testimonials: "Section Témoignages",
    cta: "Section Call to Action",
    services: "Page Services",
    about: "Page À Propos",
    contact: "Page Contact",
  };
  return names[pageId] || pageId;
};

const generateHeroHtml = (content: SiteContent): string => `
<section class="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/20 via-transparent to-transparent"></div>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="flex items-center justify-center min-h-screen py-20">
      <div class="text-center max-w-4xl">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 font-semibold text-sm mb-6">
          <span>✨</span>
          <span>${content.hero.badge}</span>
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
          ${content.hero.title}
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> ${content.hero.titleHighlight}</span>
        </h1>
        <p class="text-lg sm:text-xl text-purple-200/90 max-w-2xl mx-auto mb-8 leading-relaxed">
          ${content.hero.description}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a href="/contact" class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
            ${content.hero.ctaPrimary}
            <span>→</span>
          </a>
          <a href="/services" class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-purple-400/50 text-purple-200 font-semibold rounded-xl hover:bg-purple-500/10 transition-all">
            ${content.hero.ctaSecondary}
          </a>
        </div>
        <div class="pt-8 border-t border-purple-500/20">
          <p class="text-sm font-medium text-purple-300/70 mb-4">Déjà adopté par de nombreux professionnels</p>
          <div class="flex items-center justify-center gap-8">
            ${content.hero.stats.map(stat => `
              <div class="text-center">
                <div class="text-2xl font-extrabold text-white">${stat.value}</div>
                <div class="text-sm text-purple-300/70">${stat.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const generateHowItWorksHtml = (content: SiteContent): string => `
<section class="py-24 bg-gray-950 relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent"></div>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-sm mb-6">
        ${content.howItWorks.badge}
      </div>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
        ${content.howItWorks.title}
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> ${content.howItWorks.titleHighlight}</span>
      </h2>
      <p class="text-lg text-gray-400">${content.howItWorks.description}</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      ${content.howItWorks.steps.map((step, index) => `
        <div class="relative group">
          <div class="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all h-full">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4">
              ${step.step}
            </div>
            <h3 class="text-xl font-bold text-white mb-3">${step.title}</h3>
            <p class="text-gray-400">${step.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>
`;

const generateIndustriesHtml = (content: SiteContent): string => `
<section class="py-24 bg-gray-900 relative overflow-hidden">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-sm mb-6">
        ${content.industries.badge}
      </div>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
        ${content.industries.title}
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> ${content.industries.titleHighlight}</span>
      </h2>
      <p class="text-lg text-gray-400">${content.industries.description}</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${content.industries.items.map(industry => `
        <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
          <h3 class="text-xl font-bold text-white mb-4">${industry.name}</h3>
          <ul class="space-y-2">
            ${industry.features.map(feature => `
              <li class="flex items-center gap-2 text-gray-300">
                <span class="text-purple-400">✓</span>
                ${feature}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  </div>
</section>
`;

const generateBenefitsHtml = (content: SiteContent): string => `
<section class="py-24 bg-gray-950 relative overflow-hidden">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-sm mb-6">
        ${content.benefits.badge}
      </div>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
        ${content.benefits.title}
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> ${content.benefits.titleHighlight}</span>
      </h2>
      <p class="text-lg text-gray-400">${content.benefits.description}</p>
    </div>
    <div class="flex justify-center gap-8 mb-12">
      ${content.benefits.stats.map(stat => `
        <div class="text-center px-6 py-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div class="text-3xl font-extrabold text-purple-400">${stat.value}</div>
          <div class="text-sm text-gray-400">${stat.label}</div>
        </div>
      `).join('')}
    </div>
    <div class="grid sm:grid-cols-2 gap-6">
      ${content.benefits.items.map(benefit => `
        <div class="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
          <h3 class="text-xl font-bold text-white mb-3">${benefit.title}</h3>
          <p class="text-gray-400">${benefit.description}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>
`;

const generateTestimonialsHtml = (content: SiteContent): string => `
<section class="py-24 bg-gray-900 relative overflow-hidden">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-sm mb-6">
        ${content.testimonials.badge}
      </div>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
        ${content.testimonials.title}
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> ${content.testimonials.titleHighlight}</span>
      </h2>
      <p class="text-lg text-gray-400">${content.testimonials.description}</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      ${content.testimonials.items.map(testimonial => `
        <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
          <div class="flex items-center gap-1 mb-4 text-yellow-400">
            ${'★'.repeat(testimonial.rating)}
          </div>
          <p class="text-gray-300 mb-6 italic">"${testimonial.quote}"</p>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
              ${testimonial.author.charAt(0)}
            </div>
            <div>
              <p class="font-semibold text-white">${testimonial.author}</p>
              <p class="text-gray-400 text-sm">${testimonial.business}</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>
`;

const generatePricingHtml = (content: SiteContent): string => `
<section class="py-24 bg-gray-950 relative overflow-hidden">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-sm mb-6">
        ${content.pricing.badge}
      </div>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
        ${content.pricing.title}
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> ${content.pricing.titleHighlight}</span>
      </h2>
      <p class="text-lg text-gray-400">${content.pricing.description}</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      ${content.pricing.plans.map(plan => `
        <div class="${plan.highlighted 
          ? 'bg-gradient-to-br from-purple-900/80 to-pink-900/80 border-2 border-purple-500 transform scale-105' 
          : 'bg-gray-900/50 border border-gray-800'} backdrop-blur-sm rounded-2xl p-8 relative">
          ${plan.highlighted ? '<span class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">Populaire</span>' : ''}
          <h3 class="text-xl font-bold text-white mb-2">${plan.name}</h3>
          <p class="text-gray-400 text-sm mb-4">${plan.description}</p>
          <p class="text-4xl font-extrabold text-white mb-6">${plan.price}</p>
          <ul class="space-y-3 mb-8">
            ${plan.features.map(feature => `
              <li class="flex items-center gap-2 ${plan.highlighted ? 'text-purple-200' : 'text-gray-300'}">
                <span class="text-purple-400">✓</span>
                ${feature}
              </li>
            `).join('')}
          </ul>
          <a href="/contact" class="${plan.highlighted
            ? 'block text-center py-3 bg-white text-purple-900 font-semibold rounded-xl hover:bg-gray-100'
            : 'block text-center py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700'} transition">
            ${plan.cta}
          </a>
        </div>
      `).join('')}
    </div>
  </div>
</section>
`;

const generateCtaHtml = (content: SiteContent): string => `
<section class="py-24 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
        ${content.cta.title}
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300"> ${content.cta.titleHighlight}</span>
      </h2>
      <p class="text-xl text-purple-200/90 mb-8 max-w-2xl mx-auto">${content.cta.description}</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/contact" class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg">
          ${content.cta.ctaPrimary}
          <span>→</span>
        </a>
        <a href="/services" class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
          ${content.cta.ctaSecondary}
        </a>
      </div>
    </div>
  </div>
</section>
`;

const generateServicesPageHtml = (content: SiteContent): string => `
<div class="min-h-screen bg-gray-950">
  <!-- Hero -->
  <section class="py-24 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto">
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white mb-6">Nos Services</h1>
        <p class="text-xl text-purple-200/90">Découvrez comment CréaVisuel peut transformer votre présence digitale</p>
      </div>
    </div>
  </section>
  
  <!-- Services Grid -->
  <section class="py-24">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
          <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl mb-6">📱</div>
          <h3 class="text-xl font-bold text-white mb-3">Gestion Réseaux Sociaux</h3>
          <p class="text-gray-400">Automatisation complète de vos publications sur toutes les plateformes.</p>
        </div>
        <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
          <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl mb-6">✨</div>
          <h3 class="text-xl font-bold text-white mb-3">Création de Contenu IA</h3>
          <p class="text-gray-400">Génération de textes, images et vidéos optimisés pour l'engagement.</p>
        </div>
        <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
          <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl mb-6">📊</div>
          <h3 class="text-xl font-bold text-white mb-3">Analytics Avancés</h3>
          <p class="text-gray-400">Tableaux de bord complets pour suivre vos performances en temps réel.</p>
        </div>
      </div>
    </div>
  </section>
</div>
`;

const generateAboutPageHtml = (content: SiteContent): string => `
<div class="min-h-screen bg-gray-950">
  <!-- Hero -->
  <section class="py-24 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto">
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white mb-6">À Propos de CréaVisuel</h1>
        <p class="text-xl text-purple-200/90">Une équipe passionnée au service de votre communication digitale</p>
      </div>
    </div>
  </section>
  
  <!-- Story -->
  <section class="py-24">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <h2 class="text-3xl font-bold text-white mb-6">Notre Histoire</h2>
          <p class="text-gray-400 mb-4">CréaVisuel est né de la volonté de démocratiser l'accès à une communication professionnelle sur les réseaux sociaux.</p>
          <p class="text-gray-400">Grâce à l'intelligence artificielle, nous permettons à chaque entreprise de créer du contenu engageant sans effort.</p>
        </div>
      </div>
    </div>
  </section>
</div>
`;

const generateContactPageHtml = (content: SiteContent): string => `
<div class="min-h-screen bg-gray-950">
  <!-- Hero -->
  <section class="py-24 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto">
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white mb-6">Contactez-nous</h1>
        <p class="text-xl text-purple-200/90">Notre équipe est à votre disposition pour répondre à toutes vos questions</p>
      </div>
    </div>
  </section>
  
  <!-- Contact Form -->
  <section class="py-24">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl mx-auto">
        <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <form class="space-y-6">
            <div>
              <label class="block text-white font-medium mb-2">Nom</label>
              <input type="text" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" placeholder="Votre nom">
            </div>
            <div>
              <label class="block text-white font-medium mb-2">Email</label>
              <input type="email" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" placeholder="votre@email.com">
            </div>
            <div>
              <label class="block text-white font-medium mb-2">Message</label>
              <textarea class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white h-32" placeholder="Votre message"></textarea>
            </div>
            <button type="submit" class="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all">
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</div>
`;

// Full home page (all sections combined)
const generateHomePageHtml = (content: SiteContent): string => {
  return `
    ${generateHeroHtml(content)}
    ${generateHowItWorksHtml(content)}
    ${generateIndustriesHtml(content)}
    ${generateBenefitsHtml(content)}
    ${generateTestimonialsHtml(content)}
    ${generatePricingHtml(content)}
    ${generateCtaHtml(content)}
  `;
};

// Legacy export for compatibility
export const generateSiteHtml = generateHomePageHtml;
