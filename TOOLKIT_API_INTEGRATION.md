# 🔧 Intégration No-Code Architects Toolkit

## 📦 APIs disponibles

Le toolkit tourne sur : **https://tools.lecoach.digital**
Container : `ncat-ncat-1` sur port **8085**

### APIs utiles pour CréaVisuel :

1. **`/combine-videos`** - Combiner plusieurs vidéos
2. **`/caption-video`** - Ajouter des sous-titres/texte sur vidéo
3. **`/image-to-video`** - Convertir image en vidéo (pour animations)
4. **`/concatenate`** - Concaténer des médias
5. **`/upload`** - Upload vers cloud storage (GCP)
6. **`/trim`** - Découper vidéo
7. **`/metadata`** - Obtenir métadonnées média

## 🎬 Stratégie pour export vidéo CréaVisuel

### Option 1 : Image-to-Video + Caption (Simple)
Pour templates avec textes animés :
1. Générer PNG du template (html2canvas)
2. Appeler `/image-to-video` pour créer vidéo de base
3. Appeler `/caption-video` pour ajouter textes avec animations temporelles

### Option 2 : Compose FFmpeg (Avancé)
Pour animations complexes :
1. Générer une séquence d'images (frames)
2. Utiliser FFmpeg pour composer avec transitions
3. Ajouter audio si nécessaire

### Option 3 : Layers séparés (Professionnel)
1. Export chaque layer en PNG transparent
2. Convertir chaque layer en vidéo avec `/image-to-video`
3. Combiner avec `/combine-videos` en utilisant des overlays FFmpeg

## 🔐 Authentification

Le toolkit utilise un système d'authentification. Voir `/app/routes/authenticate.py`

Variables d'environnement nécessaires dans `.env` :
```
TOOLKIT_API_URL=https://tools.lecoach.digital
TOOLKIT_API_KEY=<à configurer>
```

## 📝 Exemple d'utilisation

### 1. Image to Video

```typescript
const response = await fetch('https://tools.lecoach.digital/image-to-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOOLKIT_API_KEY}`
  },
  body: JSON.stringify({
    image_url: 'https://...',
    duration: 5, // secondes
    webhook_url: 'https://creavisuel.pro/webhook/video-ready',
    id: 'template_123'
  })
});

const data = await response.json();
// Retourne job_id pour tracking
```

### 2. Caption Video (ajouter texte)

```typescript
const response = await fetch('https://tools.lecoach.digital/caption-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOOLKIT_API_KEY}`
  },
  body: JSON.stringify({
    video_url: 'https://...',
    captions: [
      {
        text: 'CONSEILS BEAUTÉ',
        start_time: 0,
        end_time: 2,
        position: { x: 90, y: 150 },
        style: {
          font_size: 72,
          font_family: 'Bebas Neue',
          color: '#d946ef',
          font_weight: '700'
        }
      }
    ],
    webhook_url: 'https://creavisuel.pro/webhook/video-ready'
  })
});
```

### 3. Job Status (vérifier progression)

```typescript
const response = await fetch(`https://tools.lecoach.digital/job-status/${job_id}`, {
  headers: {
    'Authorization': `Bearer ${TOOLKIT_API_KEY}`
  }
});

const status = await response.json();
// { job_status: 'running' | 'done' | 'failed', response: {...} }
```

## 🚀 Implémentation dans CréaVisuel

### Phase 1 : Export simple (Image → Vidéo)
1. Capturer le canvas en PNG avec html2canvas
2. Upload PNG vers Supabase Storage
3. Appeler `/image-to-video` du toolkit
4. Afficher le job_id et permettre de vérifier le statut
5. Quand terminé, télécharger la vidéo résultante

### Phase 2 : Animations de texte
1. Parser les animations du template
2. Générer les timings (start_time, end_time, delay)
3. Appeler `/caption-video` avec les layers texte
4. Combiner avec la vidéo de base

### Phase 3 : Animations complexes (Future)
1. Générer une séquence de frames avec les animations CSS
2. Utiliser canvas.captureStream() pour créer une vidéo côté client
3. Ou utiliser le toolkit pour composer avec FFmpeg

## 📚 Fichiers du toolkit

- `/app/app.py` - Application principale Flask
- `/app/routes/` - Toutes les routes API
- `/app/services/` - Services (FFmpeg, Cloud Storage, etc.)
- `/app/routes/combine_videos.py` - Combine plusieurs vidéos
- `/app/routes/caption_video.py` - Ajoute texte/sous-titres
- `/app/routes/v1/video/` - APIs vidéo v1

## 🔗 Prochaines étapes

1. ✅ Investiguer les APIs (fait)
2. ⏳ Configurer l'authentification
3. ⏳ Créer service CréaVisuel → Toolkit
4. ⏳ Implémenter export vidéo simple
5. ⏳ Ajouter animations de texte
6. ⏳ Intégrer dans l'UI avec progress bar

## 💡 Notes

- Le toolkit utilise un système de queue pour les jobs
- Les vidéos sont uploadées automatiquement vers GCP Storage
- Webhooks disponibles pour notifications asynchrones
- Support CORS à vérifier pour appels depuis le navigateur
