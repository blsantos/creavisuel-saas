# 🎬 Guide : Prévisualisation et Export des Animations

## ✅ Nouvelles fonctionnalités ajoutées

### 1. 🎥 Bouton "Prévisualiser"
**Apparaît automatiquement** si votre template contient :
- Des animations (fade-in, slide-up, zoom-in, etc.)
- Des vidéos

**Comment l'utiliser** :
1. Ajoutez une animation à un ou plusieurs layers (section "Animation" dans les propriétés)
2. Le bouton **"Prévisualiser"** apparaît dans la toolbar
3. Cliquez dessus pour voir les animations en action !
4. En mode prévisualisation :
   - ✨ Les animations jouent automatiquement avec les durées/délais configurés
   - 🎬 Les vidéos démarrent automatiquement
   - 🚫 Vous ne pouvez pas éditer (mode lecture seule)
5. Cliquez sur **"Mode Édition"** pour revenir à l'édition

### 2. 📹 Bouton "MP4" (Export Vidéo)
**Apparaît automatiquement** si votre template contient des animations ou vidéos.

**Comment l'utiliser** :
1. Cliquez sur le bouton **"MP4"**
2. Une boîte de dialogue s'ouvre avec les instructions pour :
   - Copier le payload JSON depuis l'onglet API
   - Configurer un workflow n8n pour générer la vidéo
   - URL endpoint suggéré : `https://n8n.creavisuel.pro/webhook/video-render`

**Important** : L'export vidéo réel nécessite un workflow n8n avec FFmpeg. Le bouton fournit toutes les informations nécessaires pour configurer ce workflow.

### 3. 🖼️ Bouton "PNG" (Export Image)
Renommé et stylisé pour être plus clair.
- Exporte l'image statique (sans animations)
- Fonctionne pour tous les templates

---

## 🎨 Animations disponibles

### Types d'animations :
1. **Fade In** - Apparition progressive en fondu
2. **Slide Up** - Glissement depuis le bas vers le haut
3. **Slide Left** - Glissement depuis la droite vers la gauche
4. **Slide Right** - Glissement depuis la gauche vers la droite
5. **Zoom In** - Agrandissement depuis 50% vers 100%
6. **Bounce** - Effet rebond (infini)
7. **Rotate In** - Rotation + apparition
8. **Pulse** - Pulsation (infini)

### Paramètres configurables :
- **Durée** : Temps d'exécution de l'animation (ex: 1.5s)
- **Délai** : Temps avant le début (ex: 0.5s pour commencer après 500ms)

---

## 🎯 Workflow recommandé

### Pour créer une vidéo animée :

1. **Dans l'éditeur** :
   - Créez votre design
   - Ajoutez des animations aux layers
   - Configurez durées et délais
   - Cliquez sur **"Prévisualiser"** pour vérifier

2. **Pour exporter** :
   - Cliquez sur **"MP4"** pour voir les instructions
   - Allez dans l'onglet **"API"**
   - Copiez le payload JSON complet

3. **Dans n8n** :
   - Créez un workflow avec :
     - `HTTP Webhook Node` (pour recevoir le payload)
     - `Function Node` (pour parser les animations)
     - `FFmpeg Node` ou `Video Compositor` (pour générer la vidéo)
     - `Upload Node` (vers Supabase Storage ou S3)

4. **Le payload contient** :
   ```json
   {
     "instructions": {
       "render_type": "image_with_animations",
       "animation_enabled": true,
       "has_video": false,
       "suggested_workflow": "video_export"
     },
     "layers": [
       {
         "animation": {
           "type": "fade-in",
           "duration": 1.5,
           "delay": 0.5
         },
         "styles": {
           "opacity": 1,
           "rotation": 0,
           "shadow": {...},
           "border": {...}
         }
       }
     ]
   }
   ```

---

## 🚀 Exemple pratique

### Créer une animation de titre :

1. **Ajoutez un layer de texte** avec votre titre
2. **Dans les propriétés** :
   - Section "Animation" : Choisissez **"Slide Up"**
   - Durée : **1.5s**
   - Délai : **0s**
3. **Ajoutez un deuxième texte** (sous-titre)
4. **Dans les propriétés** :
   - Animation : **"Fade In"**
   - Durée : **1s**
   - Délai : **1.5s** (commence après le titre)
5. **Cliquez sur "Prévisualiser"** pour voir le résultat !

---

## 🔧 Limitations actuelles

- ⚠️ L'export MP4 nécessite un workflow n8n externe (pas d'export direct depuis l'interface)
- ⚠️ La prévisualisation utilise des animations CSS (approximation du résultat final)
- ⚠️ Pour un résultat professionnel, utilisez FFmpeg via n8n

---

## 📚 Fichiers créés

- `/root/creavisuel-saas/src/apps/admin/styles/animations.css` : Styles CSS pour les animations
- Fonctions ajoutées dans `ImageStudioEditor.tsx` :
  - `handleExportVideo()` : Gestion de l'export vidéo
  - `isPreviewMode` : État du mode prévisualisation

---

## 🎉 Résumé

✅ **Bouton "Prévisualiser"** : Voir les animations en temps réel
✅ **Bouton "MP4"** : Instructions pour export vidéo via n8n
✅ **Bouton "PNG"** : Export image statique
✅ **8 types d'animations** avec durée et délai configurables
✅ **Mode lecture seule** en prévisualisation

**Testez maintenant** : Rechargez la page et créez un template avec animations ! 🚀
