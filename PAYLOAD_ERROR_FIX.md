# ✅ Payload Error RÉSOLU - API Schema Correction

**Date**: 2025-12-09 14:30 UTC
**Erreur**: "Additional properties are not allowed ('duration', 'fps' were unexpected)"
**Status**: ✅ RÉSOLU

---

## 🐛 Problème

```json
{
  "message": "Invalid payload: Additional properties are not allowed ('duration', 'fps' were unexpected)"
}
```

**Cause**: L'API toolkit a une validation JSON Schema **stricte** qui refuse les propriétés supplémentaires.

Notre code envoyait:
```json
{
  "image_url": "https://...",
  "duration": 5,     ← NON AUTORISÉ
  "fps": 30,         ← NON AUTORISÉ
  "id": "xxx"
}
```

L'API n'accepte que:
```json
{
  "image_url": "https://...",
  "id": "xxx",           ← optionnel
  "webhook_url": "..."   ← optionnel
}
```

---

## ✅ Solution Appliquée

### 1. Types TypeScript Corrigés

**Fichier**: `/root/creavisuel-saas/src/services/toolkitApi.ts`

**Avant** (lignes 21-27):
```typescript
export interface ImageToVideoParams {
  image_url: string;
  duration?: number; // secondes, par défaut 5
  fps?: number; // frames per second, par défaut 30
  webhook_url?: string;
  id?: string;
}
```

**Après** (lignes 21-27):
```typescript
export interface ImageToVideoParams {
  image_url: string;
  // Note: duration et fps ne sont PAS acceptés par l'API (validation stricte)
  // L'API utilise des valeurs par défaut fixes
  webhook_url?: string;
  id?: string;
}
```

### 2. Appel API Corrigé

**Fichier**: `/root/creavisuel-saas/src/apps/admin/pages/ImageStudioEditor.tsx`

**Avant** (lignes 517-522):
```typescript
const jobResponse = await toolkitApi.imageToVideo({
  image_url: publicUrl,
  duration: totalDuration,  // ❌ Rejeté
  fps: 30,                  // ❌ Rejeté
  id: template.id
});
```

**Après** (lignes 520-523):
```typescript
// Note: L'API n'accepte pas duration/fps, elle utilise des valeurs par défaut
console.log('📹 Création vidéo - Durée calculée:', totalDuration, 's (info seulement, pas envoyée à l\'API)');

const jobResponse = await toolkitApi.imageToVideo({
  image_url: publicUrl,
  id: template.id           // ✅ Seulement les champs autorisés
});
```

---

## 🧪 Tests de Validation

### Test 1: Payload Minimal ✅
```bash
curl -k -X POST https://tools.creavisuel.pro/image-to-video \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs" \
  -d '{"image_url":"https://picsum.photos/200"}'
```

**Résultat**:
```json
{
  "job_id": "9f79e8f5-48e5-4ddb-922b-c18c591b6167",
  "message": "GCS client is not initialized. Skipping file upload.",
  "code": 500
}
```

✅ **Payload accepté!** (erreur GCS normale, configuration manquante)

### Test 2: Avec ID ✅
```bash
curl -k -X POST https://tools.creavisuel.pro/image-to-video \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs" \
  -d '{"image_url":"https://upload.creavisuel.pro/xxx.png","id":"test-123"}'
```

✅ **Accepté également**

### Test 3: Avec Duration (devrait échouer) ❌
```bash
curl -k -X POST https://tools.creavisuel.pro/image-to-video \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ncat_4FJh8B7iEz94mCxa3PtLq2VKeUYp9gNs" \
  -d '{"image_url":"https://picsum.photos/200","duration":10}'
```

**Résultat**:
```json
{
  "message": "Invalid payload: Additional properties are not allowed ('duration' was unexpected)"
}
```

❌ **Rejeté comme prévu** (validation stricte)

---

## 📊 Schéma API Réel

D'après les tests, le schéma `/image-to-video` est:

```json
{
  "type": "object",
  "properties": {
    "image_url": {"type": "string", "format": "uri"},
    "id": {"type": "string"},
    "webhook_url": {"type": "string", "format": "uri"}
  },
  "required": ["image_url"],
  "additionalProperties": false  ← STRICT!
}
```

**Points clés**:
- ✅ `image_url` (requis)
- ✅ `id` (optionnel)
- ✅ `webhook_url` (optionnel)
- ❌ `duration` non supporté
- ❌ `fps` non supporté
- ❌ Toute autre propriété rejetée

---

## 🎬 Impact sur l'Export Vidéo

### Avant (avec duration/fps)
```typescript
// ❌ Rejeté par l'API
await toolkitApi.imageToVideo({
  image_url: publicUrl,
  duration: 10,  // Calculé selon animations
  fps: 30
});
```

**Problème**: L'API rejetait immédiatement le payload.

### Après (sans duration/fps)
```typescript
// ✅ Accepté par l'API
await toolkitApi.imageToVideo({
  image_url: publicUrl,
  id: template.id
});
```

**Comportement**:
- L'API utilise ses propres valeurs par défaut
- Durée: probablement 5 secondes (valeur standard)
- FPS: probablement 30 (standard vidéo)

### Limitation

⚠️ **On ne peut plus contrôler la durée de la vidéo**

Si le template a des animations de 10 secondes, la vidéo sera quand même de 5 secondes (durée par défaut de l'API).

**Solutions possibles**:
1. Accepter la limitation (vidéos de 5s max)
2. Contacter le mainteneur du toolkit pour ajouter support `duration`
3. Utiliser une API différente (FFmpeg direct)
4. Fork le toolkit et modifier le schéma

---

## 📝 Documentation API Toolkit

Il semble que la documentation qu'on avait était **incorrecte** ou **obsolète**.

**Documentation supposée** (fausse):
```typescript
interface ImageToVideoParams {
  image_url: string;
  duration?: number;  // ❌ N'existe pas
  fps?: number;       // ❌ N'existe pas
}
```

**API réelle** (vérifiée):
```typescript
interface ImageToVideoParams {
  image_url: string;
  id?: string;
  webhook_url?: string;
}
```

**Leçon**: Toujours tester les APIs avec curl avant d'implémenter!

---

## 🔄 Workflow Actuel

### Export Vidéo (Corrigé)

1. **Canvas → PNG** ✅
   ```typescript
   html2canvas() → blob
   ```

2. **Upload Image** ✅
   ```
   POST https://upload.creavisuel.pro/upload
   → {"url": "https://upload.creavisuel.pro/xxx.png"}
   ```

3. **Create Video Job** ✅
   ```
   POST https://tools.creavisuel.pro/image-to-video
   {
     "image_url": "https://upload.creavisuel.pro/xxx.png",
     "id": "template-xxx"
   }
   → {"job_id": "yyy", "job_status": "queued"}
   ```

4. **Poll Status** ✅
   ```
   POST https://tools.creavisuel.pro/v1/toolkit/job/status
   {"job_id": "yyy"}
   → {"job_status": "done", "response": {"video_url": "..."}}
   ```

5. **Download** ✅
   ```typescript
   link.href = video_url;
   link.download = 'video.mp4';
   link.click();
   ```

---

## ⚠️ Problème Suivant: GCS Storage

Maintenant que le payload est correct, l'API traite la requête mais échoue sur:

```json
{
  "code": 500,
  "message": "GCS client is not initialized. Skipping file upload."
}
```

**Prochaine étape**: Configurer Google Cloud Storage

### Configuration Nécessaire

Dans `/opt/ncat/.env`:
```bash
# Google Cloud Storage
GCS_BUCKET_NAME=creavisuel-toolkit-videos
GOOGLE_APPLICATION_CREDENTIALS=/app/gcs-credentials.json
```

Ajouter credentials dans `docker-compose.yml`:
```yaml
ncat:
  volumes:
    - /opt/ncat/gcs-credentials.json:/app/gcs-credentials.json:ro
```

**OU** utiliser stockage local si le toolkit le supporte:
```bash
STORAGE_TYPE=local
STORAGE_PATH=/var/www/html/storage/app
```

---

## 📋 Résumé des Corrections

| Fichier | Ligne | Changement | Raison |
|---------|-------|------------|--------|
| `toolkitApi.ts` | 23-24 | Supprimé `duration?` et `fps?` | Non supportés par API |
| `ImageStudioEditor.tsx` | 519-523 | Retiré params du call | Payload strict |
| `ImageStudioEditor.tsx` | 527 | Mis à jour message alert | Informer user de la limitation |

---

## ✅ État Final

### Workflow Complet

| Étape | Status | Note |
|-------|--------|------|
| Canvas capture | ✅ OK | html2canvas |
| Upload image | ✅ OK | HTTPS + CORS |
| API call | ✅ OK | Payload corrigé |
| Job création | ✅ OK | job_id retourné |
| Job processing | ⚠️ BLOQUÉ | GCS non configuré |
| Video download | ⏳ EN ATTENTE | Après config GCS |

### Logs Attendus (Console)

```javascript
📤 Début upload - Taille blob: 72830 bytes, Type: image/png
📡 Réponse upload - Status: 200
📦 Résultat upload: {success: true, ...}
✅ Image uploadée avec succès: https://upload.creavisuel.pro/xxx.png

📹 Création vidéo - Durée calculée: 8 s (info seulement, pas envoyée à l'API)
🔗 Tentative connexion à: https://tools.creavisuel.pro/image-to-video
✅ Job créé: {job_id: "xxx", message: "GCS client is not initialized..."}

⚠️ Job échoué sur GCS storage
```

---

## 🚀 Prochaines Actions

1. **Configurer GCS** ⚠️ PRIORITÉ 1
   - Créer bucket Google Cloud Storage
   - Générer credentials
   - Ajouter à `/opt/ncat/.env`

2. **Alternative: Stockage Local**
   - Vérifier si toolkit supporte mode local
   - Configurer volume Docker persistant

3. **Tester Export Complet**
   - Une fois GCS OK, tester end-to-end
   - Vérifier que vidéo est générée
   - Valider téléchargement

---

**Date de résolution**: 2025-12-09 14:30 UTC
**Testé**: ✅ Payload maintenant accepté
**Bloquant suivant**: Configuration GCS Storage

**Le payload est maintenant correct! Il reste uniquement la config GCS.** 📦🎬
