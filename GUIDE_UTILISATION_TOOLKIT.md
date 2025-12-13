# 🎬 Guide d'utilisation - Outils Médias CréaVisuel

## 🚀 Accès rapide

**Chemin**: Admin → Onglet "Tools" → Vidéo / Media

---

## 📹 Export vidéo depuis l'éditeur

### Créer une vidéo animée en 5 étapes

1. **Ouvrir l'éditeur**
   - Aller dans Admin → Studio
   - Cliquer sur un template ou "Nouveau Template"

2. **Créer votre design**
   - Ajouter du texte, des images, des formes
   - Configurer les couleurs, polices, positions

3. **Ajouter des animations** (optionnel)
   - Sélectionner un layer
   - Dans "Animation", choisir un type (fade-in, slide-up, etc.)
   - Configurer la durée (1-5s) et le délai (0-3s)

4. **Prévisualiser**
   - Cliquer sur le bouton ✨ "Prévisualiser"
   - Vérifier que les animations jouent correctement
   - Revenir en "Mode Édition" pour ajuster

5. **Exporter en vidéo**
   - Cliquer sur le bouton 🎬 "MP4"
   - Patienter pendant la génération (10-30 secondes)
   - La vidéo se télécharge automatiquement !

**Résultat**: Fichier MP4 avec vos animations

---

## 🎨 Outils vidéo avancés

### 1. Combiner plusieurs vidéos

**Usage**: Fusionner plusieurs clips en une seule vidéo

**Étapes**:
1. Aller dans Tools → Vidéo
2. Dans "Combinaison de vidéos"
3. Entrer les URLs des vidéos (une par ligne):
   ```
   https://example.com/video1.mp4
   https://example.com/video2.mp4
   https://example.com/video3.mp4
   ```
4. Cliquer "Combiner les vidéos"
5. Attendre le job (15-60 secondes selon la taille)
6. Copier l'URL de la vidéo générée depuis le panneau résultat

**Cas d'usage**:
- Montage vidéo automatique
- Créer des compilations
- Assembler des séquences

---

### 2. Ajouter du texte sur une vidéo

**Usage**: Incruster du texte (titre, sous-titre, watermark)

**Étapes**:
1. Aller dans Tools → Vidéo
2. Dans "Caption Vidéo"
3. Entrer l'URL de votre vidéo
4. Écrire le texte à afficher (ex: "PROMO -50%")
5. Cliquer "Ajouter le caption"
6. Récupérer la vidéo avec texte

**Configuration par défaut**:
- Police: Arial, 48px, gras
- Couleur: Blanc
- Fond: Noir semi-transparent
- Position: 100px, 100px (en haut à gauche)
- Durée: 0-5 secondes

**Cas d'usage**:
- Ajouter un titre
- Watermark sur vidéos
- Call-to-action
- Sous-titres simples

---

### 3. Image → Vidéo

**Usage**: Transformer une image statique en vidéo

**Étapes**:
1. Aller dans Tools → Vidéo
2. Dans "Image vers Vidéo"
3. Entrer l'URL de l'image (PNG, JPG)
4. Configurer:
   - Durée: 5 secondes (recommandé pour réseaux sociaux)
   - FPS: 30 (standard)
5. Cliquer "Créer la vidéo"
6. Télécharger le MP4

**Cas d'usage**:
- Publier une image sur Instagram Stories (nécessite vidéo)
- Créer des slides vidéo
- Animation simple d'image

---

### 4. Extraire des frames

**Usage**: Découper une vidéo en images clés

**Étapes**:
1. Aller dans Tools → Vidéo
2. Dans "Extraction de frames"
3. Entrer l'URL de la vidéo
4. Intervalle: 1 seconde = 1 image par seconde
5. Cliquer "Extraire les frames"
6. Récupérer la liste d'images

**Cas d'usage**:
- Créer des thumbnails
- Analyse de vidéo
- Storyboard automatique
- Génération de GIFs

---

## 🎙️ Outils média

### 1. Transcription audio/vidéo

**Usage**: Convertir la parole en texte

**Étapes**:
1. Aller dans Tools → Media
2. Dans "Transcription Audio/Vidéo"
3. Entrer l'URL du fichier (MP3, MP4, WAV, etc.)
4. Choisir la langue (FR, EN, ES, DE, Auto)
5. Cliquer "Transcrire"
6. Le texte apparaît automatiquement

**Cas d'usage**:
- Sous-titrer une vidéo
- Extraire le texte d'un podcast
- Créer un article depuis une vidéo
- Accessibilité

**Langues supportées**:
- 🇫🇷 Français
- 🇬🇧 Anglais
- 🇪🇸 Espagnol
- 🇩🇪 Allemand
- 🌍 Auto-détection

---

### 2. Télécharger un fichier

**Usage**: Télécharger et stocker un fichier depuis une URL

**Étapes**:
1. Aller dans Tools → Media
2. Dans "Télécharger fichier"
3. Entrer l'URL du fichier
4. Cliquer "Télécharger"
5. Le fichier est stocké et accessible

**Cas d'usage**:
- Sauvegarder des ressources externes
- Importer des assets
- Archivage

---

### 3. Screenshot de page web

**Usage**: Capturer une page web complète en image

**Étapes**:
1. Aller dans Tools → Media
2. Dans "Screenshot de page web"
3. Entrer l'URL de la page (ex: https://google.com)
4. Cliquer "Capturer la page"
5. Récupérer l'image (1920x1080)

**Cas d'usage**:
- Documentation
- Portfolio
- Archivage de pages
- Comparaison avant/après

---

## 💡 Astuces et bonnes pratiques

### URLs valides
✅ Utilisez des URLs complètes:
```
https://example.com/video.mp4
https://storage.googleapis.com/bucket/file.png
https://supabase.co/storage/v1/object/public/...
```

❌ Évitez:
```
/local/file.mp4           (pas d'accès local)
C:\Users\file.mp4         (chemin Windows)
example.com/video.mp4     (manque https://)
```

### Formats supportés
- **Vidéos**: MP4, MOV, AVI, WebM, MKV
- **Images**: PNG, JPG, JPEG, WebP, GIF
- **Audio**: MP3, WAV, OGG, AAC, M4A

### Tailles recommandées
- **Vidéos courtes**: < 50 MB (traitement rapide)
- **Images**: < 10 MB
- **Audio**: < 25 MB

### Temps de traitement
- Image → Vidéo: 10-30 secondes
- Combine vidéos: 30-90 secondes (selon nb de vidéos)
- Transcription: 1-3 minutes (selon durée audio)
- Caption vidéo: 15-45 secondes
- Screenshot: 5-15 secondes

---

## 🔄 Workflow complet: Vidéo marketing

**Objectif**: Créer une vidéo promo avec texte et animations

### Étape 1: Créer le design
1. Admin → Studio → Nouveau Template
2. Ajouter logo en haut (layer image)
3. Ajouter titre "NOUVELLE COLLECTION" (layer texte)
   - Police: Bebas Neue, 72px
   - Couleur: #d946ef (magenta)
   - Animation: slide-up, durée 1.5s
4. Ajouter sous-titre "Disponible maintenant"
   - Police: Inter, 36px
   - Animation: fade-in, durée 1s, délai 1.5s
5. Sauvegarder le template

### Étape 2: Exporter en vidéo
1. Cliquer "Prévisualiser" pour vérifier
2. Cliquer "MP4" pour exporter
3. Attendre 20 secondes
4. Vidéo téléchargée automatiquement

### Étape 3: Ajouter un call-to-action
1. Tools → Vidéo → Caption Vidéo
2. URL: [celle de la vidéo exportée]
3. Texte: "Commandez sur www.votresite.com"
4. Générer
5. Nouvelle vidéo avec CTA

### Étape 4: Publier
- Upload sur Instagram, Facebook, YouTube
- Utiliser dans une campagne publicitaire
- Envoyer par email

**Temps total**: 5 minutes
**Résultat**: Vidéo marketing professionnelle

---

## ❓ FAQ

### Q: Puis-je utiliser des fichiers locaux ?
**R**: Pour l'instant, seules les URLs sont supportées. Uploadez d'abord vos fichiers vers Supabase Storage ou un hébergeur pour obtenir une URL.

### Q: Les vidéos ont-elles du son ?
**R**: L'export depuis l'éditeur ne génère pas de son (image → vidéo). Pour ajouter du son, utilisez l'outil "Audio Mixing" (à venir).

### Q: Combien de temps sont conservés les fichiers ?
**R**: Les fichiers générés sont stockés sur le cloud du toolkit. Téléchargez-les immédiatement ou sauvegardez les URLs.

### Q: Puis-je personnaliser le style des captions ?
**R**: Actuellement, le style est prédéfini. Une interface avancée avec personnalisation complète est prévue.

### Q: Quelle est la qualité des vidéos ?
**R**: HD (1920x1080 max), 30 FPS par défaut. Qualité optimisée pour les réseaux sociaux.

### Q: Y a-t-il des limites de taille ?
**R**: Recommandé < 100 MB par fichier pour des performances optimales.

---

## 🎯 Prochaines fonctionnalités

- ⏳ Bibliothèque de médias générés avec historique
- ⏳ Upload de fichiers locaux (drag & drop)
- ⏳ Trim vidéo (découper des segments)
- ⏳ Audio mixing (mélanger pistes audio)
- ⏳ Thumbnails automatiques
- ⏳ Batch processing (traiter plusieurs fichiers)
- ⏳ Templates prédéfinis pour vidéos marketing

---

## 📞 Support

Des questions ? Besoin d'aide ?
- Documentation complète: `/TOOLKIT_INTEGRATION_COMPLETE.md`
- API Toolkit: https://tools.lecoach.digital

---

**Créez, exportez, partagez ! 🚀**
