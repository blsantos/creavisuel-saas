# 🎨 Image Studio Editor - Nouvelles Fonctionnalités

## Améliorations apportées à l'éditeur

### ✅ 1. Outils d'Alignement
**Emplacement**: Panneau des propriétés > Section "Alignement"

- **Alignement horizontal**:
  - Gauche (aligne le layer au bord gauche du canvas)
  - Centre (centre horizontalement)
  - Droite (aligne au bord droit)

- **Alignement vertical**:
  - Haut (aligne en haut du canvas)
  - Milieu (centre verticalement)
  - Bas (aligne en bas)

**Utilisation**: Sélectionnez un layer et cliquez sur l'icône d'alignement souhaitée.

---

### ✅ 2. Effets Visuels
**Emplacement**: Panneau des propriétés > Section "Effets visuels" (fond violet)

#### a) Opacité
- Contrôle par slider (0-100%)
- Appliqué en temps réel sur le canvas
- Exporté dans le payload n8n

#### b) Rotation
- Range: -180° à +180°
- Rotation visuelle immédiate
- Parfait pour textes inclinés ou éléments décalés

#### c) Ombre portée
- **Activation**: Checkbox pour activer/désactiver
- **Paramètres**:
  - Offset X (décalage horizontal)
  - Offset Y (décalage vertical)
  - Blur (flou de l'ombre)
  - Color (couleur de l'ombre)

#### d) Bordure
- **Activation**: Checkbox pour activer/désactiver
- **Paramètres**:
  - Largeur (width en pixels)
  - Rayon (border-radius pour coins arrondis)
  - Couleur

**Tous les effets sont appliqués en temps réel et inclus dans le payload API.**

---

### ✅ 3. Bibliothèque d'Animations
**Emplacement**: Panneau des propriétés > Section "Animation" (fond indigo)

#### Types d'animations disponibles:
1. **Fade In** - Apparition progressive
2. **Slide Up** - Glissement depuis le bas
3. **Slide Left** - Glissement depuis la droite
4. **Slide Right** - Glissement depuis la gauche
5. **Zoom In** - Agrandissement progressif
6. **Bounce** - Effet rebond
7. **Rotate In** - Rotation en apparaissant
8. **Pulse** - Pulsation

#### Paramètres d'animation:
- **Durée**: Temps d'exécution de l'animation (en secondes)
- **Délai**: Temps avant le début de l'animation (en secondes)

**Disponible pour**: Textes, Images, Vidéos

---

### ✅ 4. Bouton Dupliquer
**Emplacement**: En haut du panneau des propriétés (icône Copy)

- Clone le layer sélectionné avec toutes ses propriétés
- Le nouveau layer est décalé de 20px en X et Y
- Utile pour créer des variations rapidement

---

### ✅ 5. Payload N8N Amélioré
**Emplacement**: Onglet "API" dans la toolbar

#### Nouvelles données incluses dans le payload:

```json
{
  "template_id": "...",
  "template_name": "Nom du template",
  "width": 1080,
  "height": 1080,
  "layers": [
    {
      "id": "layer_id",
      "type": "text|image|video|shape",
      "styles": {
        "x": 100,
        "y": 100,
        // ... positions basiques

        // 🆕 NOUVEAUX EFFETS
        "opacity": 0.8,
        "rotation": 15,
        "shadow": {
          "offsetX": 4,
          "offsetY": 4,
          "blur": 10,
          "color": "#000000"
        },
        "border": {
          "width": 2,
          "color": "#ffffff",
          "radius": 10
        }
      },

      // 🆕 ANIMATIONS
      "animation": {
        "type": "fade-in",
        "duration": 1.5,
        "delay": 0.5
      },

      // 🆕 PARAMÈTRES VIDÉO
      "video_settings": {
        "is_muted": true,
        "is_loop": true
      }
    }
  ],

  // 🆕 MÉTADONNÉES
  "instructions": {
    "render_type": "image_with_animations",
    "animation_enabled": true,
    "has_video": false,
    "suggested_workflow": "image_export|video_export"
  }
}
```

**Fonctionnalités**:
- Bouton "Copier" en hover sur le payload
- Format JSON lisible (pretty-print)
- Prêt à coller dans n8n

---

## 🎯 Utilisation dans n8n

### Workflow recommandé pour images statiques:
1. **HTTP Request Node** - Reçoit le payload du template
2. **Function Node** - Parse les layers et applique les effets
3. **Image Generation Node** - Génère l'image finale
4. **Upload to Storage** - Stocke sur Supabase Storage ou S3

### Workflow recommandé pour vidéos:
1. **HTTP Request Node** - Reçoit le payload
2. **Function Node** - Parse et prépare les animations
3. **Video Compositor** - Applique les animations temporellement
4. **FFmpeg Node** - Génère la vidéo finale avec les effets
5. **Upload to Storage** - Stocke la vidéo

---

## 🚀 Améliorations futures possibles

- [ ] Prévisualisation des animations dans l'éditeur
- [ ] Keyframes personnalisées pour animations avancées
- [ ] Bibliothèque de presets d'effets
- [ ] Export en GIF animé
- [ ] Timeline pour séquencer les animations
- [ ] Filtres d'images (blur, brightness, contrast, etc.)
- [ ] Masques et clipping paths
- [ ] Groupes de layers

---

## 📚 Documentation technique

### Interface Layer (TypeScript)
```typescript
interface Layer {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape';
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;

  // Effets visuels
  opacity?: number; // 0-1
  rotation?: number; // -180 à 180 degrés

  shadow?: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };

  border?: {
    enabled: boolean;
    width: number;
    color: string;
    radius?: number;
  };

  // Animation
  animation?: 'none' | 'fade-in' | 'slide-up' | 'zoom-in' |
              'slide-left' | 'slide-right' | 'bounce' |
              'rotate-in' | 'pulse';
  animationDuration?: number; // secondes
  animationDelay?: number; // secondes

  // Vidéo
  isMuted?: boolean;
  isLoop?: boolean;
}
```

### Fonctions d'alignement
```typescript
alignLayer(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom')
```

### Fonction de duplication
```typescript
duplicateLayer() // Clone le layer sélectionné
```

---

**Date de mise à jour**: 2025-12-09
**Version**: 2.0.0
**Fichier source**: `/root/creavisuel-saas/src/apps/admin/pages/ImageStudioEditor.tsx`
