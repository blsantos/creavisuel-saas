# 🔧 Guide de Débogage pour Admins - Upload & Export Vidéo

**Date**: 2025-12-09
**Pour**: Administrateurs CréaVisuel SaaS

---

## 🎯 Objectif

Ce guide vous aide à diagnostiquer et résoudre les erreurs d'upload et d'export vidéo en utilisant les logs détaillés.

---

## 📊 Logs Améliorés

### 1. Logs Serveur (Backend)

Le serveur d'upload (`upload.creavisuel.pro`) enregistre maintenant toutes les tentatives avec détails:

```bash
# Voir les logs en temps réel
docker logs ncat-upload-server-1 -f

# Voir les 50 dernières lignes
docker logs ncat-upload-server-1 --tail 50
```

**Informations enregistrées**:
- ✅ Nom du fichier original
- ✅ Type MIME (mimetype)
- ✅ Nom du champ (fieldname)
- ✅ Acceptation/rejet du fichier
- ✅ Taille et URL finale
- ❌ Erreurs détaillées avec stack trace

**Exemple de log réussi**:
```
Upload attempt: {
  originalname: 'canvas-export.png',
  mimetype: 'image/png',
  fieldname: 'image'
}
File accepted
Upload successful: {
  filename: '1765289227443-ju4mgy.png',
  size: 245678,
  url: 'https://upload.creavisuel.pro/1765289227443-ju4mgy.png'
}
```

**Exemple de log échoué**:
```
Upload attempt: {
  originalname: 'document.pdf',
  mimetype: 'application/pdf',
  fieldname: 'image'
}
File rejected: application/pdf document.pdf
Server error: {
  message: 'Only images are allowed',
  code: 'LIMIT_UNEXPECTED_FILE',
  field: 'image'
}
```

### 2. Logs Frontend (Console Navigateur)

Ouvrez la **Console Développeur** (F12 → Console) pour voir les logs détaillés:

**Étapes d'upload**:
```javascript
📤 Début upload - Taille blob: 245678 bytes, Type: image/png
📡 Réponse upload - Status: 200 OK
📦 Résultat upload: {success: true, data: {...}}
✅ Image uploadée avec succès: https://upload.creavisuel.pro/xxx.png
```

**En cas d'erreur**:
```javascript
📤 Début upload - Taille blob: 245678 bytes, Type: image/png
📡 Réponse upload - Status: 500 Internal Server Error
📦 Résultat upload: {success: false, error: "Only images are allowed", details: "..."}
❌ Upload échoué (500): Only images are allowed
Détails: Check server logs for more information
```

---

## 🔍 Diagnostic des Erreurs Courantes

### Erreur 1: "Impossible d'uploader l'image sur le serveur"

**Causes possibles**:
1. Serveur d'upload arrêté
2. Problème réseau/DNS
3. Type de fichier non autorisé
4. Taille de fichier trop grande (>10MB)

**Diagnostic**:

```bash
# 1. Vérifier que le serveur tourne
docker ps | grep upload-server
# Doit afficher: ncat-upload-server-1  Up X minutes

# 2. Tester la santé du serveur
curl -k https://upload.creavisuel.pro/health
# Doit retourner: {"status":"ok"}

# 3. Voir les logs d'erreur
docker logs ncat-upload-server-1 --tail 100 | grep -i error
```

**Solutions**:
```bash
# Redémarrer le serveur d'upload
docker restart ncat-upload-server-1

# Vérifier les logs après redémarrage
docker logs ncat-upload-server-1 -f
```

### Erreur 2: "Only images are allowed"

**Causes**:
- Le blob n'a pas de mimetype valide
- Le nom de fichier a une extension non autorisée

**Extensions autorisées**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`

**Diagnostic**:
```bash
# Regarder les logs pour voir le type MIME reçu
docker logs ncat-upload-server-1 --tail 50 | grep "Upload attempt"
```

**Solution**:
Le serveur a été mis à jour pour accepter les blobs sans extension. Si l'erreur persiste:

1. Vérifier que le frontend envoie bien un blob PNG:
   ```javascript
   canvas.toBlob((b) => { ... }, 'image/png')
   ```

2. Vérifier que FormData inclut un nom de fichier:
   ```javascript
   formData.append('image', blob, 'canvas-export.png')
   ```

### Erreur 3: "No file uploaded"

**Causes**:
- Le champ FormData n'est pas nommé "image"
- Le fichier n'a pas été ajouté au FormData

**Diagnostic**:
```javascript
// Dans la console navigateur, vérifier:
console.log('Blob size:', blob.size);
console.log('FormData entries:', [...formData.entries()]);
```

**Solution**:
Le nom du champ DOIT être "image":
```javascript
formData.append('image', blob, 'filename.png'); // ✅ Correct
formData.append('file', blob, 'filename.png');  // ❌ Incorrect
```

### Erreur 4: Timeout ou "Failed to fetch"

**Causes**:
1. Problème réseau
2. Certificat SSL non valide
3. CORS bloqué
4. Serveur non accessible

**Diagnostic**:
```bash
# Tester depuis le serveur
curl -k -F "image=@/tmp/test.png" https://upload.creavisuel.pro/upload

# Vérifier que Traefik route correctement
docker logs ncat-traefik-1 --tail 50 | grep upload
```

**Solution**:
```bash
# Redémarrer Traefik
docker restart ncat-traefik-1

# Attendre 1-2 minutes pour le certificat SSL
sleep 120

# Tester à nouveau
curl -I https://upload.creavisuel.pro/health
```

---

## 🛠️ Commandes Utiles pour Admins

### Surveillance en Temps Réel

```bash
# Logs upload server (dans un terminal)
docker logs ncat-upload-server-1 -f

# Logs Traefik (dans un autre terminal)
docker logs ncat-traefik-1 -f

# Logs toolkit API (dans un 3ème terminal)
docker logs ncat-ncat-1 -f
```

### Vérification Rapide

```bash
# Status de tous les services
docker ps --filter "name=ncat" --format "table {{.Names}}\t{{.Status}}"

# Santé des services
curl -k https://upload.creavisuel.pro/health
curl -k https://tools.creavisuel.pro/health
curl -k https://creavisuel.pro

# Espace disque (uploads)
du -sh /var/www/uploads/
ls -lh /var/www/uploads/ | tail -10
```

### Nettoyage

```bash
# Voir les fichiers récents
ls -lht /var/www/uploads/ | head -20

# Supprimer les fichiers de plus de 7 jours
find /var/www/uploads -type f -mtime +7 -delete

# Supprimer tous les fichiers (attention!)
rm -f /var/www/uploads/*
```

### Redémarrage Complet

```bash
# Redémarrer tous les services concernés
cd /opt/ncat
docker-compose restart upload-server traefik ncat

# Rebuild + redéployer le frontend
cd /root/creavisuel-saas
npm run build
docker restart ncat-creavisuel-saas-1
```

---

## 🔐 Fichiers de Configuration

### Upload Server
**Fichier**: `/opt/ncat/upload-server.js`
**Modifications importantes**:
- Ligne 40: Types MIME autorisés (ajouté `octet-stream`)
- Ligne 45: Acceptation permissive des blobs
- Ligne 34-38: Logs détaillés des tentatives
- Ligne 73-77: Logs de succès
- Ligne 102-116: Gestionnaire d'erreurs amélioré

### Frontend
**Fichier**: `/root/creavisuel-saas/src/apps/admin/pages/ImageStudioEditor.tsx`
**Modifications importantes**:
- Ligne 466: Log taille et type du blob
- Ligne 469: Ajout du nom de fichier au FormData
- Ligne 476: Log status HTTP
- Ligne 478: Log résultat complet
- Ligne 481-489: Gestion d'erreurs détaillée

---

## 📈 Métriques à Surveiller

### Performance
- **Temps d'upload moyen**: 1-3 secondes (blobs de 100-500KB)
- **Temps de conversion vidéo**: 5-30 secondes (selon durée)
- **Taille moyenne des blobs**: 200-500KB (canvas 1920x1080)

### Santé
- **Uptime upload-server**: Doit être "Up" en permanence
- **Espace disque `/var/www/uploads`**: <1GB recommandé
- **Nombre de fichiers**: Nettoyer régulièrement (>100 fichiers)

### Erreurs
- **Taux d'échec acceptable**: <5%
- **Erreurs "Only images allowed"**: Devrait être 0%
- **Timeouts**: <1%

---

## 🆘 En Cas de Problème Persistant

### Collecte d'Informations

Avant de contacter le support, collectez ces informations:

```bash
# 1. Logs des 3 derniers services
docker logs ncat-upload-server-1 --tail 100 > /tmp/upload-logs.txt
docker logs ncat-ncat-1 --tail 100 > /tmp/toolkit-logs.txt
docker logs ncat-traefik-1 --tail 100 > /tmp/traefik-logs.txt

# 2. Status des services
docker ps -a > /tmp/docker-status.txt

# 3. Espace disque
df -h > /tmp/disk-space.txt
du -sh /var/www/uploads/ >> /tmp/disk-space.txt

# 4. Test upload
curl -k -F "image=@/tmp/test.png" https://upload.creavisuel.pro/upload > /tmp/upload-test.txt 2>&1

# Envoyer ces 5 fichiers pour diagnostic
ls -lh /tmp/*.txt
```

### Console Navigateur (Frontend)

1. Ouvrir **F12** → **Console**
2. Reproduire l'erreur
3. Copier tous les logs (clic droit → "Save as...")
4. Ouvrir **F12** → **Network**
5. Reproduire l'erreur
6. Trouver la requête `/upload`
7. Clic droit → "Copy as cURL"

---

## ✅ Checklist Post-Déploiement

Après chaque mise à jour, vérifier:

- [ ] Upload server démarre: `docker ps | grep upload`
- [ ] Health check répond: `curl https://upload.creavisuel.pro/health`
- [ ] Test upload réussit: `curl -F "image=@test.png" https://upload.creavisuel.pro/upload`
- [ ] Frontend rebuild: `npm run build` sans erreurs
- [ ] Container redémarré: `docker restart ncat-creavisuel-saas-1`
- [ ] Interface accessible: `https://creavisuel.pro`
- [ ] Console sans erreurs: F12 → Console (vide)
- [ ] Export vidéo fonctionne: Créer template → Export vidéo

---

## 📞 Support

**Logs à fournir**:
1. Logs upload-server (backend)
2. Console navigateur (frontend)
3. Network tab (requête /upload)
4. Screenshot de l'erreur

**Informations contexte**:
- Navigateur utilisé (Chrome/Firefox/Safari)
- Taille du template (nombre de layers)
- Taille du blob généré
- Type d'animation utilisée

---

**Dernière mise à jour**: 2025-12-09
**Version**: 2.0 - Gestion d'erreurs améliorée
