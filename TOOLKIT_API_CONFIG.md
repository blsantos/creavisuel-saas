# ⚙️ Configuration de l'API Toolkit

## 🔧 Configuration actuelle

### URL de l'API
**Avant** : `https://tools.lecoach.digital` (DNS supprimé)
**Maintenant** : `http://46.202.175.252:8085/v1`

### Authentification
**Header requis** : `X-API-Key`
**Clé API** : `ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs`

### Container Docker
- **Nom** : `ncat-ncat-1`
- **Image** : `stephengpope/no-code-architects-toolkit:latest`
- **Port** : `8085` (mappé sur l'hôte)
- **IP VPS** : `46.202.175.252`

---

## 📍 Routes disponibles

### Routes racine (legacy)
- `/image-to-video` - Convertir image → vidéo
- `/caption-video` - Ajouter caption
- `/combine-videos` - Combiner vidéos
- `/extract-keyframes` - Extraire frames
- `/audio-mixing` - Mixer audio
- `/media-to-mp3` - Convertir en MP3
- `/transcribe-media` - Transcription

### Routes v1 (recommandées)
- `/v1/toolkit/job-status/{job_id}` - Statut d'un job
- `/v1/toolkit/test` - Test de l'API
- `/v1/video/trim` - Découper vidéo
- `/v1/video/caption_video` - Caption
- `/v1/video/thumbnail` - Miniature
- `/v1/video/concatenate` - Concaténer
- `/v1/image/screenshot_webpage` - Screenshot
- `/v1/image/convert/image_to_video` - Image → Vidéo
- `/v1/media/media_transcribe` - Transcription
- `/v1/media/download` - Télécharger fichier
- `/v1/media/metadata` - Métadonnées
- `/v1/media/convert/media_to_mp3` - Convertir MP3
- `/v1/audio/concatenate` - Concaténer audio
- `/v1/ffmpeg/ffmpeg_compose` - Composition FFmpeg

---

## 🔐 Sécurité

### API Key
La clé est stockée dans le service TypeScript :
```typescript
const TOOLKIT_API_KEY = 'ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs';
```

**⚠️ IMPORTANT** : Cette clé est visible côté client (navigateur).

### Recommandations pour la production

1. **Ne PAS exposer la clé directement**
   - Créer un proxy backend dans l'API CréaVisuel
   - Le proxy ajoute la clé côté serveur

2. **Exemple d'architecture sécurisée** :
   ```
   Frontend (React)
      ↓ Appel sans clé
   API CréaVisuel (Node/Express/Supabase Edge Functions)
      ↓ Ajoute X-API-Key
   Toolkit API
   ```

3. **Ou utiliser une variable d'environnement** :
   ```typescript
   const TOOLKIT_API_KEY = import.meta.env.VITE_TOOLKIT_API_KEY;
   ```
   Puis ajouter dans `.env.local` :
   ```
   VITE_TOOLKIT_API_KEY=ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs
   ```

---

## 🌐 Configurer un domaine (recommandé)

### Option 1: Recréer le DNS
1. Aller dans votre gestionnaire DNS (Cloudflare, OVH, etc.)
2. Créer un enregistrement A :
   - **Nom** : `tools.lecoach.digital`
   - **Type** : A
   - **Valeur** : `46.202.175.252`
   - **TTL** : 300 (ou auto)

3. Mettre à jour le service :
   ```typescript
   const TOOLKIT_API_URL = 'https://tools.lecoach.digital/v1';
   ```

### Option 2: Utiliser Traefik pour HTTPS
1. Ajouter des labels Traefik au container :
   ```yaml
   labels:
     - "traefik.enable=true"
     - "traefik.http.routers.toolkit.rule=Host(`tools.lecoach.digital`)"
     - "traefik.http.routers.toolkit.entrypoints=websecure"
     - "traefik.http.routers.toolkit.tls.certresolver=letsencrypt"
     - "traefik.http.services.toolkit.loadbalancer.server.port=8080"
   ```

2. Redémarrer le stack :
   ```bash
   docker-compose up -d
   ```

3. L'API sera accessible via HTTPS avec certificat Let's Encrypt

---

## 🧪 Tester l'API

### Test simple
```bash
curl -H "X-API-Key: ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs" \
  http://46.202.175.252:8085/v1/toolkit/test
```

**Résultat attendu** :
```json
{
  "job_id": "...",
  "job_status": "done",
  "message": "GCS client is not initialized..."
}
```

### Test image-to-video
```bash
curl -X POST \
  -H "X-API-Key: ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.png",
    "duration": 5,
    "fps": 30
  }' \
  http://46.202.175.252:8085/v1/image-to-video
```

### Vérifier statut d'un job
```bash
curl -H "X-API-Key: ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs" \
  http://46.202.175.252:8085/v1/toolkit/job-status/JOB_ID_HERE
```

---

## 🐛 Problèmes courants

### 1. "Could not resolve host"
**Problème** : Le DNS n'existe plus
**Solution** : Utiliser l'IP `http://46.202.175.252:8085/v1`

### 2. "401 Unauthorized"
**Problème** : Clé API manquante ou incorrecte
**Solution** : Ajouter le header `X-API-Key: ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs`

### 3. "Connection refused"
**Problème** : Le container est arrêté
**Solution** :
```bash
docker start ncat-ncat-1
# ou
docker-compose -f /opt/ncat/docker-compose.yml up -d
```

### 4. "GCS client is not initialized"
**Problème** : Le toolkit n'a pas accès à Google Cloud Storage
**Impact** : Les fichiers générés ne seront pas uploadés
**Solution** : Configurer GCS ou utiliser un stockage alternatif

---

## 📝 Configuration dans le code

### Service actuel (toolkitApi.ts)
```typescript
const TOOLKIT_API_URL = 'http://46.202.175.252:8085/v1';
const TOOLKIT_API_KEY = 'ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs';

private async callApi<T>(endpoint: string, params: any): Promise<T> {
  const response = await fetch(`${this.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': TOOLKIT_API_KEY, // ← Clé ajoutée
    },
    body: JSON.stringify(params),
  });
  // ...
}
```

---

## 🔄 Migration vers HTTPS (recommandé)

Pour une production sécurisée, il est recommandé d'utiliser HTTPS :

1. **Créer le DNS** : `tools.lecoach.digital` → `46.202.175.252`

2. **Configurer Traefik** dans le docker-compose :
   ```yaml
   services:
     ncat:
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.toolkit.rule=Host(`tools.lecoach.digital`)"
         - "traefik.http.routers.toolkit.entrypoints=websecure"
         - "traefik.http.routers.toolkit.tls=true"
         - "traefik.http.routers.toolkit.tls.certresolver=letsencrypt"
   ```

3. **Mettre à jour le service** :
   ```typescript
   const TOOLKIT_API_URL = 'https://tools.lecoach.digital/v1';
   ```

4. **Avantages** :
   - Chiffrement des données
   - Certificat SSL gratuit (Let's Encrypt)
   - Pas de warning HTTPS dans le navigateur
   - Meilleure sécurité pour la clé API

---

## 📊 Monitoring

### Vérifier que le container tourne
```bash
docker ps | grep ncat
```

### Voir les logs
```bash
docker logs ncat-ncat-1 -f
```

### Vérifier les routes enregistrées
```bash
docker logs ncat-ncat-1 2>&1 | grep "Registering:"
```

### Redémarrer si nécessaire
```bash
docker restart ncat-ncat-1
```

---

**Date de dernière mise à jour** : 2025-12-09
**Status** : ✅ Fonctionnel avec IP + clé API
**Prochaine étape** : Configurer DNS + HTTPS pour production
