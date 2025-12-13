#!/usr/bin/env node

/**
 * Script pour insérer les templates de base dans Supabase
 * Usage: node scripts/seed-templates.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env manually
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erreur: Variables SUPABASE non trouvées dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Templates data
const templates = [
  // 1. SALON DE COIFFURE
  {
    name: 'Coiffure - Conseils Beauté',
    category: 'custom',
    tenant_id: null,
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#f8e5f0',
      layers: [
        { id: 'bg_shape', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#f8e5f0', zIndex: 0 },
        { id: 'title', type: 'text', content: 'CONSEILS BEAUTÉ', x: 90, y: 150, color: '#d946ef', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'left', zIndex: 2 },
        { id: 'subtitle', type: 'text', content: 'Le saviez-vous ?', x: 90, y: 250, color: '#a855f7', fontSize: 38, fontWeight: '400', fontFamily: 'Poppins', textAlign: 'left', zIndex: 2 },
        { id: 'content', type: 'text', content: 'Votre conseil beauté ici\nMax 3 lignes de texte\npour un impact optimal', x: 90, y: 450, color: '#1f2937', fontSize: 42, fontWeight: '400', fontFamily: 'Inter', textAlign: 'left', zIndex: 2 },
        { id: 'footer', type: 'text', content: 'Votre Salon', x: 90, y: 920, color: '#d946ef', fontSize: 32, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'left', zIndex: 2 }
      ]
    }
  },
  {
    name: 'Coiffure - Horaires Disponibles',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#0f172a',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#0f172a', zIndex: 0 },
        { id: 'accent_bar', type: 'shape', x: 0, y: 0, width: 20, height: 1080, color: '#d946ef', zIndex: 1 },
        { id: 'title', type: 'text', content: 'DISPONIBILITÉS', x: 90, y: 150, color: '#ffffff', fontSize: 68, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'left', zIndex: 2 },
        { id: 'hours', type: 'text', content: '📅 Lundi - Vendredi\n⏰ 9h00 - 19h00\n\n📅 Samedi\n⏰ 9h00 - 17h00', x: 90, y: 350, color: '#f8e5f0', fontSize: 46, fontWeight: '400', fontFamily: 'Inter', textAlign: 'left', zIndex: 2 },
        { id: 'cta', type: 'text', content: '☎️ Réservez votre créneau', x: 90, y: 850, color: '#d946ef', fontSize: 36, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'left', zIndex: 2 }
      ]
    }
  },

  // 2. RESTAURANT
  {
    name: 'Restaurant - Menu du Jour',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#fef3c7',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#fef3c7', zIndex: 0 },
        { id: 'title', type: 'text', content: 'MENU DU JOUR', x: 540, y: 120, color: '#b45309', fontSize: 76, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'date', type: 'text', content: 'Mardi 10 Décembre', x: 540, y: 220, color: '#92400e', fontSize: 34, fontWeight: '400', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'entree', type: 'text', content: '🥗 ENTRÉE\nSalade César Maison', x: 540, y: 350, color: '#1f2937', fontSize: 38, fontWeight: '600', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'plat', type: 'text', content: '🍽️ PLAT\nPoulet Rôti & Légumes', x: 540, y: 540, color: '#1f2937', fontSize: 38, fontWeight: '600', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'dessert', type: 'text', content: '🍰 DESSERT\nTarte Tatin', x: 540, y: 730, color: '#1f2937', fontSize: 38, fontWeight: '600', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'price', type: 'text', content: '16,50€', x: 540, y: 900, color: '#b45309', fontSize: 56, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 }
      ]
    }
  },
  {
    name: 'Restaurant - Suggestion du Chef',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#1e293b',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#1e293b', zIndex: 0 },
        { id: 'badge', type: 'text', content: '👨‍🍳', x: 540, y: 100, color: '#ffffff', fontSize: 80, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'title', type: 'text', content: 'SUGGESTION\nDU CHEF', x: 540, y: 220, color: '#fbbf24', fontSize: 68, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'dish_name', type: 'text', content: 'Nom du plat signature', x: 540, y: 450, color: '#ffffff', fontSize: 48, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'description', type: 'text', content: 'Description appétissante\ndu plat en quelques mots\nsavoureux', x: 540, y: 600, color: '#e2e8f0', fontSize: 36, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'cta', type: 'text', content: 'Réservez votre table', x: 540, y: 880, color: '#fbbf24', fontSize: 38, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 3. INSTITUT DE BEAUTÉ / SPA
  {
    name: 'Spa - Soin du Mois',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#dbeafe',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#dbeafe', zIndex: 0 },
        { id: 'title', type: 'text', content: 'SOIN DU MOIS', x: 540, y: 150, color: '#1e40af', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '💆‍♀️', x: 540, y: 280, color: '#1e40af', fontSize: 100, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'soin_name', type: 'text', content: 'Soin Visage Relaxant', x: 540, y: 450, color: '#1e293b', fontSize: 52, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'description', type: 'text', content: '60 min de détente absolue\nProduits bio & naturels', x: 540, y: 580, color: '#475569', fontSize: 38, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'price', type: 'text', content: '65€', x: 540, y: 750, color: '#1e40af', fontSize: 68, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'cta', type: 'text', content: 'Réservez en ligne', x: 540, y: 900, color: '#3b82f6', fontSize: 34, fontWeight: '600', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 4. SALLE DE SPORT
  {
    name: 'Fitness - Programme Hebdo',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#0a0a0a',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#0a0a0a', zIndex: 0 },
        { id: 'accent_top', type: 'shape', x: 0, y: 0, width: 1080, height: 15, color: '#ef4444', zIndex: 1 },
        { id: 'title', type: 'text', content: 'PROGRAMME\nDE LA SEMAINE', x: 540, y: 120, color: '#ffffff', fontSize: 68, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '💪', x: 540, y: 280, color: '#ef4444', fontSize: 80, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'program_type', type: 'text', content: 'HIIT • FORCE • CARDIO', x: 540, y: 450, color: '#ef4444', fontSize: 42, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'details', type: 'text', content: 'Lun-Mer-Ven : 18h00\nDurée : 45 minutes\nNiveau : Tous niveaux', x: 540, y: 600, color: '#e5e5e5', fontSize: 38, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'cta', type: 'text', content: 'Réservez votre place', x: 540, y: 880, color: '#ef4444', fontSize: 36, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 5. BOULANGERIE
  {
    name: 'Boulangerie - Spécialité du Jour',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#fffbeb',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#fffbeb', zIndex: 0 },
        { id: 'title', type: 'text', content: '🥐 SPÉCIALITÉ DU JOUR 🥐', x: 540, y: 150, color: '#b45309', fontSize: 52, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'product_name', type: 'text', content: 'Croissant aux Amandes', x: 540, y: 450, color: '#1f2937', fontSize: 62, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'description', type: 'text', content: 'Fraîchement sorti du four\nRecette artisanale', x: 540, y: 600, color: '#78350f', fontSize: 36, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'price', type: 'text', content: '3,20€', x: 540, y: 800, color: '#b45309', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 6. BAR À COCKTAILS
  {
    name: 'Bar - Cocktail de la Semaine',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#18181b',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#18181b', zIndex: 0 },
        { id: 'title', type: 'text', content: 'COCKTAIL\nDE LA SEMAINE', x: 540, y: 120, color: '#a855f7', fontSize: 68, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '🍸', x: 540, y: 320, color: '#ffffff', fontSize: 120, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'cocktail_name', type: 'text', content: 'Purple Haze', x: 540, y: 520, color: '#ffffff', fontSize: 64, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'ingredients', type: 'text', content: 'Vodka • Liqueur Violette\nJus de Citron • Sirop', x: 540, y: 650, color: '#d4d4d8', fontSize: 32, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'price', type: 'text', content: '9€', x: 540, y: 850, color: '#a855f7', fontSize: 68, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 }
      ]
    }
  },
  {
    name: 'Bar - Happy Hours',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#fbbf24',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#fbbf24', zIndex: 0 },
        { id: 'title', type: 'text', content: 'HAPPY\nHOURS', x: 540, y: 200, color: '#1f2937', fontSize: 110, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '🎉', x: 540, y: 450, color: '#1f2937', fontSize: 100, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'hours', type: 'text', content: '17h00 - 20h00', x: 540, y: 620, color: '#1f2937', fontSize: 62, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'promo', type: 'text', content: '-50% sur tous les cocktails', x: 540, y: 780, color: '#92400e', fontSize: 38, fontWeight: '600', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 7. AGENCE IMMOBILIÈRE
  {
    name: 'Immobilier - Bien du Jour',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#1e3a8a',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#1e3a8a', zIndex: 0 },
        { id: 'title', type: 'text', content: 'BIEN DU JOUR', x: 90, y: 100, color: '#ffffff', fontSize: 68, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'left', zIndex: 2 },
        { id: 'property_type', type: 'text', content: '🏠 Appartement T3', x: 90, y: 350, color: '#ffffff', fontSize: 52, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'left', zIndex: 2 },
        { id: 'details', type: 'text', content: '📍 Centre ville\n📐 75 m²\n🛏️ 2 chambres\n🚿 1 salle de bain', x: 90, y: 480, color: '#e0e7ff', fontSize: 38, fontWeight: '400', fontFamily: 'Inter', textAlign: 'left', zIndex: 2 },
        { id: 'price', type: 'text', content: '245 000 €', x: 90, y: 850, color: '#fbbf24', fontSize: 76, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'left', zIndex: 2 }
      ]
    }
  },

  // 8. VÉTÉRINAIRE
  {
    name: 'Vétérinaire - Conseils Santé',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#dcfce7',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#dcfce7', zIndex: 0 },
        { id: 'title', type: 'text', content: 'CONSEIL SANTÉ', x: 540, y: 150, color: '#15803d', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '🐾', x: 540, y: 280, color: '#15803d', fontSize: 100, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'conseil_title', type: 'text', content: 'Le saviez-vous ?', x: 540, y: 450, color: '#166534', fontSize: 48, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'conseil_text', type: 'text', content: 'Votre conseil santé animale\nen quelques lignes claires\npour nos amis à 4 pattes', x: 540, y: 600, color: '#1f2937', fontSize: 38, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'footer', type: 'text', content: 'Votre Clinique Vétérinaire', x: 540, y: 900, color: '#15803d', fontSize: 32, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 9. ÉCOLE DE DANSE/MUSIQUE
  {
    name: 'École - Présentation Cours',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#fff1f2',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#fff1f2', zIndex: 0 },
        { id: 'title', type: 'text', content: 'NOUVEAU COURS', x: 540, y: 150, color: '#e11d48', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '💃', x: 540, y: 280, color: '#e11d48', fontSize: 100, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'cours_name', type: 'text', content: 'Salsa Débutant', x: 540, y: 450, color: '#1f2937', fontSize: 62, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'details', type: 'text', content: '📅 Tous les jeudis\n⏰ 19h00 - 20h30\n👥 Max 12 personnes', x: 540, y: 620, color: '#475569', fontSize: 38, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'cta', type: 'text', content: 'Essai gratuit ce mois-ci', x: 540, y: 880, color: '#e11d48', fontSize: 38, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 10. BOUTIQUE DE MODE
  {
    name: 'Mode - Nouvelle Collection',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#000000',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#000000', zIndex: 0 },
        { id: 'title', type: 'text', content: 'NOUVELLE\nCOLLECTION', x: 540, y: 200, color: '#ffffff', fontSize: 82, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'collection_name', type: 'text', content: 'Printemps 2025', x: 540, y: 450, color: '#fbbf24', fontSize: 58, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'description', type: 'text', content: 'Découvrez nos nouvelles pièces\nélégantes et intemporelles', x: 540, y: 600, color: '#d4d4d8', fontSize: 36, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'cta', type: 'text', content: 'En boutique dès maintenant', x: 540, y: 880, color: '#ffffff', fontSize: 34, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 11. FLEURISTE
  {
    name: 'Fleuriste - Composition Saisonnière',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#fef3c7',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#fef3c7', zIndex: 0 },
        { id: 'title', type: 'text', content: '🌸 COMPOSITION 🌸', x: 540, y: 150, color: '#db2777', fontSize: 62, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'subtitle', type: 'text', content: 'DE SAISON', x: 540, y: 240, color: '#be185d', fontSize: 48, fontWeight: '400', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'bouquet_name', type: 'text', content: 'Bouquet Champêtre', x: 540, y: 450, color: '#1f2937', fontSize: 58, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'description', type: 'text', content: 'Roses • Pivoines • Eucalyptus\nFleurs fraîches du jour', x: 540, y: 600, color: '#78350f', fontSize: 34, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'price', type: 'text', content: '35€', x: 540, y: 800, color: '#db2777', fontSize: 76, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 12. LIBRAIRIE
  {
    name: 'Librairie - Coup de Cœur',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#f3f4f6',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#f3f4f6', zIndex: 0 },
        { id: 'title', type: 'text', content: 'COUP DE ❤️', x: 540, y: 120, color: '#991b1b', fontSize: 82, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'subtitle', type: 'text', content: 'du libraire', x: 540, y: 230, color: '#7f1d1d', fontSize: 42, fontWeight: '400', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'book_title', type: 'text', content: 'Titre du Livre', x: 540, y: 450, color: '#1f2937', fontSize: 58, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'author', type: 'text', content: 'par Nom de l\'Auteur', x: 540, y: 560, color: '#6b7280', fontSize: 36, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'description', type: 'text', content: '📚 Une histoire captivante\nqui vous tiendra en haleine\njusqu\'à la dernière page', x: 540, y: 680, color: '#475569', fontSize: 34, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'cta', type: 'text', content: 'En rayon maintenant', x: 540, y: 900, color: '#991b1b', fontSize: 36, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 13. AUTO-ÉCOLE
  {
    name: 'Auto-École - Offre Promo',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#eff6ff',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#eff6ff', zIndex: 0 },
        { id: 'title', type: 'text', content: 'OFFRE SPÉCIALE', x: 540, y: 150, color: '#1e40af', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '🚗', x: 540, y: 280, color: '#1e40af', fontSize: 100, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'offer_name', type: 'text', content: 'Forfait Code + 20h', x: 540, y: 450, color: '#1f2937', fontSize: 52, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'details', type: 'text', content: '✓ Formation code complète\n✓ 20 heures de conduite\n✓ Présentation examen incluse', x: 540, y: 600, color: '#475569', fontSize: 34, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'price', type: 'text', content: '999€', x: 540, y: 850, color: '#1e40af', fontSize: 82, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 14. PHARMACIE
  {
    name: 'Pharmacie - Conseil Santé',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#f0fdf4',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#f0fdf4', zIndex: 0 },
        { id: 'title', type: 'text', content: 'CONSEIL SANTÉ', x: 540, y: 150, color: '#047857', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '💊', x: 540, y: 280, color: '#047857', fontSize: 100, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'conseil_title', type: 'text', content: 'Le saviez-vous ?', x: 540, y: 450, color: '#065f46', fontSize: 48, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'conseil_text', type: 'text', content: 'Votre conseil santé\nsaisonnier en quelques\nlignes simples et claires', x: 540, y: 600, color: '#1f2937', fontSize: 38, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'footer', type: 'text', content: 'Votre Pharmacie', x: 540, y: 900, color: '#047857', fontSize: 32, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 }
      ]
    }
  },

  // 15. GARAGE AUTOMOBILE
  {
    name: 'Garage - Conseil Entretien',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#1e293b',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#1e293b', zIndex: 0 },
        { id: 'accent_bar', type: 'shape', x: 0, y: 0, width: 1080, height: 15, color: '#f97316', zIndex: 1 },
        { id: 'title', type: 'text', content: 'CONSEIL\nENTRETIEN', x: 90, y: 150, color: '#f97316', fontSize: 72, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'left', zIndex: 2 },
        { id: 'emoji', type: 'text', content: '🔧', x: 90, y: 320, color: '#f97316', fontSize: 80, fontWeight: '400', fontFamily: 'Inter', textAlign: 'left', zIndex: 2 },
        { id: 'conseil_title', type: 'text', content: 'Le saviez-vous ?', x: 90, y: 450, color: '#ffffff', fontSize: 48, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'left', zIndex: 2 },
        { id: 'conseil_text', type: 'text', content: 'Votre conseil entretien\nautomobile pour prolonger\nla durée de vie de votre véhicule', x: 90, y: 580, color: '#e2e8f0', fontSize: 36, fontWeight: '400', fontFamily: 'Inter', textAlign: 'left', zIndex: 2 },
        { id: 'cta', type: 'text', content: 'Prenez RDV en ligne', x: 90, y: 900, color: '#f97316', fontSize: 36, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'left', zIndex: 2 }
      ]
    }
  },
  {
    name: 'Garage - Offre Saisonnière',
    category: 'custom',
    tenant_id: null,
    
    config: {
      width: 1080,
      height: 1080,
      backgroundColor: '#f97316',
      layers: [
        { id: 'bg', type: 'shape', x: 0, y: 0, width: 1080, height: 1080, color: '#f97316', zIndex: 0 },
        { id: 'title', type: 'text', content: 'OFFRE\nSAISONNIÈRE', x: 540, y: 180, color: '#ffffff', fontSize: 82, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 },
        { id: 'offer_name', type: 'text', content: 'Révision Complète', x: 540, y: 450, color: '#1f2937', fontSize: 58, fontWeight: '700', fontFamily: 'Poppins', textAlign: 'center', zIndex: 2 },
        { id: 'details', type: 'text', content: '✓ Vidange\n✓ Filtres\n✓ Points de contrôle\n✓ Diagnostic offert', x: 540, y: 600, color: '#ffffff', fontSize: 36, fontWeight: '400', fontFamily: 'Inter', textAlign: 'center', zIndex: 2 },
        { id: 'price', type: 'text', content: '89€', x: 540, y: 880, color: '#ffffff', fontSize: 86, fontWeight: '700', fontFamily: 'Bebas Neue', textAlign: 'center', zIndex: 2 }
      ]
    }
  }
];

async function seedTemplates() {
  console.log('🌱 Début du seeding des templates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      const { data, error } = await supabase
        .from('image_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur pour "${template.name}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Template créé: ${template.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception pour "${template.name}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Succès: ${successCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`   📁 Total: ${templates.length} templates\n`);

  if (successCount === templates.length) {
    console.log('🎉 Tous les templates ont été créés avec succès!');
  }
}

// Execute
seedTemplates()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Erreur fatale:', err);
    process.exit(1);
  });
