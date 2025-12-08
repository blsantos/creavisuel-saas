-- ===================================================
-- Migration 011: Insert Example Image Templates
-- Description: Pre-configured templates for different niches
-- ===================================================

-- Global templates (tenant_id = NULL) - Available to all clients

-- 1. Real Estate / Immobilier
INSERT INTO image_templates (name, category, tenant_id, config) VALUES
(
  'Annonce Immobilière Instagram',
  'social_media',
  NULL,
  '{
    "width": 1080,
    "height": 1080,
    "layers": [
      {
        "id": "bg",
        "type": "image",
        "src": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1080&h=1080&fit=crop",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 0,
        "animation": "none"
      },
      {
        "id": "overlay",
        "type": "shape",
        "color": "rgba(0,0,0,0.5)",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 1,
        "animation": "none"
      },
      {
        "id": "price",
        "type": "text",
        "content": "€450,000",
        "x": 60,
        "y": 80,
        "color": "#FFD700",
        "fontSize": 90,
        "fontWeight": "800",
        "fontFamily": "Montserrat",
        "textAlign": "left",
        "zIndex": 2,
        "animation": "fade-in"
      },
      {
        "id": "title",
        "type": "text",
        "content": "VILLA MODERNE\n4 CHAMBRES",
        "x": 60,
        "y": 200,
        "color": "#FFFFFF",
        "fontSize": 64,
        "fontWeight": "700",
        "fontFamily": "Montserrat",
        "textAlign": "left",
        "zIndex": 2,
        "animation": "slide-up"
      },
      {
        "id": "details",
        "type": "text",
        "content": "📍 Centre-Ville • 🏠 200m² • 🚗 Garage",
        "x": 60,
        "y": 920,
        "color": "#FFFFFF",
        "fontSize": 32,
        "fontWeight": "500",
        "fontFamily": "Inter",
        "textAlign": "left",
        "zIndex": 2,
        "animation": "fade-in"
      }
    ]
  }'
);

-- 2. E-commerce / Fashion
INSERT INTO image_templates (name, category, tenant_id, config) VALUES
(
  'Promo Fashion Instagram',
  'social_media',
  NULL,
  '{
    "width": 1080,
    "height": 1080,
    "layers": [
      {
        "id": "bg",
        "type": "shape",
        "color": "#FFE5E5",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 0,
        "animation": "none"
      },
      {
        "id": "circle1",
        "type": "shape",
        "color": "#FF6B9D",
        "x": -100,
        "y": -100,
        "width": 400,
        "height": 400,
        "zIndex": 1,
        "animation": "fade-in"
      },
      {
        "id": "circle2",
        "type": "shape",
        "color": "#FFA8D5",
        "x": 780,
        "y": 780,
        "width": 400,
        "height": 400,
        "zIndex": 1,
        "animation": "fade-in"
      },
      {
        "id": "discount",
        "type": "text",
        "content": "-50%",
        "x": 540,
        "y": 200,
        "color": "#FF1744",
        "fontSize": 180,
        "fontWeight": "900",
        "fontFamily": "Bebas Neue",
        "textAlign": "center",
        "zIndex": 3,
        "animation": "zoom-in"
      },
      {
        "id": "title",
        "type": "text",
        "content": "COLLECTION ÉTÉ",
        "x": 540,
        "y": 450,
        "color": "#2C3E50",
        "fontSize": 68,
        "fontWeight": "700",
        "fontFamily": "Montserrat",
        "textAlign": "center",
        "zIndex": 3,
        "animation": "slide-up"
      },
      {
        "id": "cta",
        "type": "text",
        "content": "SHOP NOW",
        "x": 540,
        "y": 750,
        "color": "#FFFFFF",
        "fontSize": 48,
        "fontWeight": "700",
        "fontFamily": "Montserrat",
        "textAlign": "center",
        "zIndex": 3,
        "animation": "fade-in"
      }
    ]
  }'
);

-- 3. Food / Restaurant
INSERT INTO image_templates (name, category, tenant_id, config) VALUES
(
  'Menu Restaurant Instagram',
  'social_media',
  NULL,
  '{
    "width": 1080,
    "height": 1080,
    "layers": [
      {
        "id": "bg",
        "type": "image",
        "src": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&h=1080&fit=crop",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 0,
        "animation": "none"
      },
      {
        "id": "overlay",
        "type": "shape",
        "color": "rgba(0,0,0,0.6)",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 1,
        "animation": "none"
      },
      {
        "id": "badge",
        "type": "text",
        "content": "🌟 CHEF SPÉCIAL 🌟",
        "x": 540,
        "y": 150,
        "color": "#FFD700",
        "fontSize": 42,
        "fontWeight": "600",
        "fontFamily": "Playfair Display",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "fade-in"
      },
      {
        "id": "dish",
        "type": "text",
        "content": "Risotto aux Truffes",
        "x": 540,
        "y": 450,
        "color": "#FFFFFF",
        "fontSize": 86,
        "fontWeight": "700",
        "fontFamily": "Playfair Display",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "slide-up"
      },
      {
        "id": "price",
        "type": "text",
        "content": "24€",
        "x": 540,
        "y": 600,
        "color": "#FFD700",
        "fontSize": 64,
        "fontWeight": "700",
        "fontFamily": "Montserrat",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "zoom-in"
      },
      {
        "id": "reserve",
        "type": "text",
        "content": "Réservez dès maintenant",
        "x": 540,
        "y": 900,
        "color": "#FFFFFF",
        "fontSize": 36,
        "fontWeight": "500",
        "fontFamily": "Inter",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "fade-in"
      }
    ]
  }'
);

-- 4. Fitness / Health
INSERT INTO image_templates (name, category, tenant_id, config) VALUES
(
  'Motivation Fitness Instagram',
  'social_media',
  NULL,
  '{
    "width": 1080,
    "height": 1080,
    "layers": [
      {
        "id": "bg",
        "type": "shape",
        "color": "#000000",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 0,
        "animation": "none"
      },
      {
        "id": "accent1",
        "type": "shape",
        "color": "#00FF88",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 8,
        "zIndex": 1,
        "animation": "fade-in"
      },
      {
        "id": "accent2",
        "type": "shape",
        "color": "#00FF88",
        "x": 0,
        "y": 1072,
        "width": 1080,
        "height": 8,
        "zIndex": 1,
        "animation": "fade-in"
      },
      {
        "id": "quote",
        "type": "text",
        "content": "NO PAIN\nNO GAIN",
        "x": 540,
        "y": 400,
        "color": "#FFFFFF",
        "fontSize": 120,
        "fontWeight": "900",
        "fontFamily": "Bebas Neue",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "zoom-in"
      },
      {
        "id": "divider",
        "type": "shape",
        "color": "#00FF88",
        "x": 440,
        "y": 630,
        "width": 200,
        "height": 4,
        "zIndex": 2,
        "animation": "fade-in"
      },
      {
        "id": "cta",
        "type": "text",
        "content": "REJOIGNEZ-NOUS AUJOURD''HUI",
        "x": 540,
        "y": 750,
        "color": "#00FF88",
        "fontSize": 38,
        "fontWeight": "700",
        "fontFamily": "Montserrat",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "slide-up"
      }
    ]
  }'
);

-- 5. Tech / SaaS
INSERT INTO image_templates (name, category, tenant_id, config) VALUES
(
  'Annonce Produit Tech',
  'social_media',
  NULL,
  '{
    "width": 1080,
    "height": 1080,
    "layers": [
      {
        "id": "bg",
        "type": "shape",
        "color": "#0F172A",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 0,
        "animation": "none"
      },
      {
        "id": "grid",
        "type": "shape",
        "color": "#1E293B",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 1,
        "animation": "none"
      },
      {
        "id": "title",
        "type": "text",
        "content": "NOUVEAU",
        "x": 540,
        "y": 150,
        "color": "#00D4FF",
        "fontSize": 52,
        "fontWeight": "700",
        "fontFamily": "JetBrains Mono",
        "textAlign": "center",
        "zIndex": 3,
        "animation": "fade-in"
      },
      {
        "id": "product",
        "type": "text",
        "content": "AI-Powered\nAutomation",
        "x": 540,
        "y": 400,
        "color": "#FFFFFF",
        "fontSize": 96,
        "fontWeight": "800",
        "fontFamily": "Righteous",
        "textAlign": "center",
        "zIndex": 3,
        "animation": "zoom-in"
      },
      {
        "id": "feature",
        "type": "text",
        "content": "✓ 10x Plus Rapide\n✓ 100% Sécurisé\n✓ 24/7 Support",
        "x": 540,
        "y": 750,
        "color": "#94A3B8",
        "fontSize": 36,
        "fontWeight": "500",
        "fontFamily": "Inter",
        "textAlign": "center",
        "zIndex": 3,
        "animation": "slide-up"
      }
    ]
  }'
);

-- 6. Education / Coaching
INSERT INTO image_templates (name, category, tenant_id, config) VALUES
(
  'Formation en Ligne',
  'social_media',
  NULL,
  '{
    "width": 1080,
    "height": 1080,
    "layers": [
      {
        "id": "bg",
        "type": "shape",
        "color": "#FFF8E7",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "zIndex": 0,
        "animation": "none"
      },
      {
        "id": "accent",
        "type": "shape",
        "color": "#FF6B35",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 200,
        "zIndex": 1,
        "animation": "none"
      },
      {
        "id": "badge",
        "type": "text",
        "content": "🎓",
        "x": 540,
        "y": 80,
        "color": "#FFFFFF",
        "fontSize": 80,
        "fontWeight": "400",
        "fontFamily": "Inter",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "zoom-in"
      },
      {
        "id": "title",
        "type": "text",
        "content": "Formation Complète",
        "x": 540,
        "y": 350,
        "color": "#2C3E50",
        "fontSize": 72,
        "fontWeight": "700",
        "fontFamily": "Montserrat",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "slide-up"
      },
      {
        "id": "topic",
        "type": "text",
        "content": "Marketing Digital",
        "x": 540,
        "y": 460,
        "color": "#FF6B35",
        "fontSize": 56,
        "fontWeight": "600",
        "fontFamily": "Montserrat",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "fade-in"
      },
      {
        "id": "details",
        "type": "text",
        "content": "12 Modules • 50+ Vidéos • Certificat",
        "x": 540,
        "y": 800,
        "color": "#7F8C8D",
        "fontSize": 32,
        "fontWeight": "500",
        "fontFamily": "Inter",
        "textAlign": "center",
        "zIndex": 2,
        "animation": "fade-in"
      },
      {
        "id": "cta",
        "type": "text",
        "content": "INSCRIPTION OUVERTE",
        "x": 540,
        "y": 920,
        "color": "#FFFFFF",
        "fontSize": 40,
        "fontWeight": "700",
        "fontFamily": "Montserrat",
        "textAlign": "center",
        "zIndex": 3,
        "animation": "slide-up"
      }
    ]
  }'
);
