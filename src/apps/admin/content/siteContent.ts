// Centralized content configuration for the entire site
export interface HeroContent {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: { value: string; label: string }[];
}

export interface Step {
  step: string;
  title: string;
  description: string;
}

export interface Industry {
  name: string;
  features: string[];
}

export interface Benefit {
  title: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  business: string;
  rating: number;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export interface CTAContent {
  title: string;
  titleHighlight: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface FooterContent {
  description: string;
  email: string;
  phone: string;
}

export interface SiteContent {
  hero: HeroContent;
  howItWorks: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    steps: Step[];
  };
  industries: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    items: Industry[];
  };
  benefits: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    stats: { value: string; label: string }[];
    items: Benefit[];
  };
  testimonials: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    items: Testimonial[];
  };
  pricing: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    plans: PricingPlan[];
  };
  cta: CTAContent;
  footer: FooterContent;
}

export const defaultContent: SiteContent = {
  hero: {
    badge: "Agent IA pour Réseaux Sociaux",
    title: "Automatisez vos",
    titleHighlight: "contenus visuels",
    description: "CréaVisuel est votre agent IA tout-en-un pour automatiser et personnaliser la création de contenus visuels pour les réseaux sociaux. De la conception à la publication, nous gérons tout.",
    ctaPrimary: "Demander une démo",
    ctaSecondary: "Découvrir nos services",
    stats: [
      { value: "250+", label: "Visuels/mois" },
      { value: "50+", label: "Clients actifs" },
      { value: "98%", label: "Satisfaction" },
    ],
  },
  howItWorks: {
    badge: "Comment ça marche",
    title: "Votre contenu visuel en",
    titleHighlight: "4 étapes simples",
    description: "CréaVisuelAgent automatise tout le processus de création et publication de vos visuels.",
    steps: [
      {
        step: "01",
        title: "Analyse & Stratégie",
        description: "Nous analysons vos besoins et objectifs pour établir une stratégie de contenu adaptée à votre marque.",
      },
      {
        step: "02",
        title: "Création automatisée",
        description: "Génération de visuels automatisés et visuels créatifs personnalisés selon vos besoins spécifiques.",
      },
      {
        step: "03",
        title: "Approbation client",
        description: "Validation des visuels via notre plateforme intégrée pour garantir l'alignement avec vos attentes.",
      },
      {
        step: "04",
        title: "Publication & Suivi",
        description: "Publication planifiée sur vos réseaux et analyse des performances pour optimiser l'engagement.",
      },
    ],
  },
  industries: {
    badge: "Pour votre secteur",
    title: "Une solution adaptée à",
    titleHighlight: "votre activité",
    description: "CréaVisuel s'adapte aux spécificités de votre secteur pour générer du contenu pertinent et engageant.",
    items: [
      { name: "Salons de coiffure", features: ["Promotions coupe/coloration", "Tendances capillaires", "Avant/après transformations"] },
      { name: "Restaurants", features: ["Plats du jour", "Menus spéciaux", "Événements & soirées"] },
      { name: "Instituts de beauté", features: ["Soins & promotions", "Nouveaux traitements", "Conseils beauté"] },
      { name: "Boutiques", features: ["Nouveautés produits", "Soldes & promos", "Collections saisonnières"] },
      { name: "Artisans", features: ["Réalisations", "Savoir-faire", "Témoignages clients"] },
      { name: "Coachs & formateurs", features: ["Conseils & astuces", "Programmes", "Résultats clients"] },
    ],
  },
  benefits: {
    badge: "Pourquoi CréaVisuel",
    title: "Gagnez du temps,",
    titleHighlight: "gagnez en impact",
    description: "Découvrez comment CréaVisuel transforme votre communication digitale avec l'automatisation intelligente.",
    stats: [
      { value: "12", label: "visuels auto/mois" },
      { value: "8", label: "visuels créatifs" },
      { value: "24/7", label: "disponible" },
    ],
    items: [
      { title: "Automatisation complète", description: "Génération automatique de visuels basés sur vos données grâce à nos outils d'automatisation IA." },
      { title: "Visuels créatifs sur mesure", description: "Production de visuels personnalisés pour des sujets choisis, avec une approche design élaborée." },
      { title: "Gestion simplifiée", description: "Coordination complète de l'approbation à la publication sur toutes vos plateformes sociales." },
      { title: "Stratégie de contenu", description: "Développement d'une ligne éditoriale adaptée à vos objectifs et votre identité de marque." },
    ],
  },
  testimonials: {
    badge: "Témoignages",
    title: "Ils nous font",
    titleHighlight: "confiance",
    description: "Découvrez ce que nos clients pensent de CréaVisuel.",
    items: [
      { quote: "CréaVisuel a révolutionné ma communication. Je gagne un temps fou et mes posts sont bien plus engageants qu'avant !", author: "Marie L.", business: "Salon de coiffure", rating: 5 },
      { quote: "Enfin une solution simple et efficace pour gérer mes réseaux sociaux. Je recommande à 100% !", author: "Thomas B.", business: "Restaurant", rating: 5 },
      { quote: "Les visuels générés sont bluffants. Mes clients me demandent souvent qui fait mes créations !", author: "Sophie M.", business: "Institut de beauté", rating: 5 },
    ],
  },
  pricing: {
    badge: "Forfaits",
    title: "Des offres adaptées à",
    titleHighlight: "vos besoins",
    description: "Choisissez la formule qui correspond le mieux à votre activité.",
    plans: [
      {
        name: "Essentiel",
        description: "Pour démarrer",
        price: "250€/mois",
        features: ["12 visuels automatisés", "4 visuels créatifs", "1 réseau social", "Hub de gestion dédié", "Support email"],
        highlighted: false,
        cta: "Choisir ce forfait",
      },
      {
        name: "Business",
        description: "Le plus populaire",
        price: "390€/mois",
        features: ["12 visuels automatisés", "8 visuels créatifs", "Tous les réseaux", "Ligne éditoriale", "Support prioritaire", "Rapports mensuels"],
        highlighted: true,
        cta: "Choisir ce forfait",
      },
      {
        name: "Premium",
        description: "Solution complète",
        price: "550€/mois",
        features: ["Visuels illimités", "Design sur mesure", "Multi-établissements", "Account manager dédié", "Stratégie personnalisée", "Mise en place incluse"],
        highlighted: false,
        cta: "Nous contacter",
      },
    ],
  },
  cta: {
    title: "Prêt à transformer votre",
    titleHighlight: "présence digitale ?",
    description: "Rejoignez les entreprises qui font confiance à B2Santos Communication pour automatiser leur création de contenu visuel.",
    ctaPrimary: "Demander un devis",
    ctaSecondary: "Découvrir nos services",
  },
  footer: {
    description: "Agent IA tout-en-un pour automatiser et personnaliser la création de contenus visuels pour vos réseaux sociaux.",
    email: "contact@b2santos.com",
    phone: "+33 6 00 00 00 00",
  },
};

// LocalStorage key
const STORAGE_KEY = "creavisuel_content";

export const getContent = (): SiteContent => {
  if (typeof window === "undefined") return defaultContent;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return { ...defaultContent, ...JSON.parse(stored) };
    } catch {
      return defaultContent;
    }
  }
  return defaultContent;
};

export const saveContent = (content: SiteContent): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
};

export const resetContent = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
