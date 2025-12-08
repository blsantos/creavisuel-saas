# CréaVisuel SaaS - Référence Rapide

**Date:** 2025-12-07
**Commandes essentielles et raccourcis**

---

## 🚀 Démarrage Rapide

### Accès Principal

| URL | Description | Credentials |
|-----|-------------|-------------|
| https://creavisuel.pro | Site principal / Admin | - |
| https://creavisuel.pro/admin | Admin panel | Password: `creavisuel2024` |
| https://jeffterra.creavisuel.pro | Client: Salon Jeff Terra | - |
| https://pouchardmireille.creavisuel.pro | Client: MSP Design | - |

### Connexion SSH

```bash
ssh root@46.202.175.252
# Password: (demander à B2Santos)
```

---

## 🛠️ Commandes Docker

### Status Containers

```bash
# Voir tous les containers
docker ps

# Filtrer containers CréaVisuel
docker ps --filter "name=ncat"

# Status détaillé
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Restart Services

```bash
cd /opt/ncat

# Restart app SaaS
docker-compose restart creavisuel-saas

# Restart Traefik
docker-compose restart traefik

# Restart tout
docker-compose restart
```

### Rebuild & Deploy

```bash
# 1. Build l'app
cd /root/creavisuel-saas
npm run build

# 2. Recreate container
cd /opt/ncat
docker-compose up -d --force-recreate creavisuel-saas

# 3. Vérifier logs
docker logs ncat-creavisuel-saas-1 --tail 50
```

### Logs

```bash
# Traefik logs
docker logs ncat-traefik-1 --tail 100

# App logs
docker logs ncat-creavisuel-saas-1 --tail 100

# Follow logs en temps réel
docker logs -f ncat-traefik-1
```

---

## 🗄️ Base de Données

### Connexion Supabase

**Dashboard:** https://supabase.lecoach.digital

**Depuis terminal:**
```bash
cd /root/creavisuel-saas

# Lister clients
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://supabase.lecoach.digital', 'SERVICE_ROLE_KEY');
sb.from('tenants').select('slug, name, status').then(r => console.table(r.data));
"
```

### Opérations Courantes

**Ajouter client:**
```bash
cd /root/creavisuel-saas
# Éditer et exécuter
node scripts/add-tenant.js
```

**Lister tous les clients:**
```sql
-- Dans Supabase SQL Editor
SELECT slug, name, status FROM tenants ORDER BY created_at DESC;
```

**Voir config client:**
```sql
SELECT 
  t.slug,
  t.name,
  tc.branding->>'primaryColor' as color,
  tc.branding->>'companyName' as company
FROM tenants t
LEFT JOIN tenant_configs tc ON tc.tenant_id = t.id
WHERE t.slug = 'jeffterra';
```

---

## 🌐 DNS & Domaines

### Vérifier DNS

```bash
# Test wildcard
dig +short test123.creavisuel.pro

# Doit retourner
46.202.175.252

# Test client spécifique
dig +short jeffterra.creavisuel.pro
```

### Test HTTPS

```bash
# Test subdomain
curl -k -I https://pouchardmireille.creavisuel.pro

# Doit retourner
HTTP/2 200
server: nginx/1.29.0
```

### Configuration DNS Hostinger

**Panel:** https://hpanel.hostinger.com

**Enregistrements requis:**
```
Type  Name  Value              TTL
A     @     46.202.175.252     14400
A     www   46.202.175.252     14400
A     *     46.202.175.252     14400  ← WILDCARD
```

---

## 📝 Développement

### Installation Dépendances

```bash
cd /root/creavisuel-saas

# Installer
npm install

# Ajouter package
npm install <package-name>
```

### Build

```bash
# Development build
npm run dev

# Production build
npm run build

# Type check
npm run type-check
```

### Structure Fichiers Importants

```
/root/creavisuel-saas/
├── src/
│   ├── router.tsx                    # Routing principal
│   ├── shared/
│   │   ├── contexts/TenantContext.tsx    # Multi-tenant logic
│   │   └── lib/
│   │       ├── supabase.ts               # Client public
│   │       └── supabase-admin.ts         # Service admin
│   └── apps/
│       ├── admin/                    # Panel admin
│       └── client/                   # App clients
├── nginx.conf                        # Config Nginx
└── dist/                             # Build output
```

---

## 🔧 Troubleshooting

### Subdomain ne fonctionne pas?

```bash
# 1. Check DNS
dig +short <slug>.creavisuel.pro
# → Doit retourner 46.202.175.252

# 2. Check HTTPS
curl -k -I https://<slug>.creavisuel.pro
# → Doit retourner HTTP/2 200

# 3. Check container
docker ps | grep creavisuel-saas
# → Doit être Up

# 4. Check Traefik labels
docker inspect ncat-creavisuel-saas-1 | grep "traefik.http.routers.saas.rule"
# → Doit contenir HostRegexp(`^[a-z0-9-]+\\.creavisuel\\.pro$$`)

# 5. Restart Traefik
cd /opt/ncat && docker-compose restart traefik
```

### Build échoue?

```bash
# Clear cache et reinstall
cd /root/creavisuel-saas
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Container ne démarre pas?

```bash
# Check logs
docker logs ncat-creavisuel-saas-1

# Check nginx config syntax
docker exec ncat-creavisuel-saas-1 nginx -t

# Recreate from scratch
cd /opt/ncat
docker-compose down creavisuel-saas
docker-compose up -d creavisuel-saas
```

---

## 📊 Monitoring

### Health Checks

```bash
# App principale
curl -I https://creavisuel.pro
# → HTTP/2 200

# Subdomain
curl -I https://test.creavisuel.pro
# → HTTP/2 200

# API render
curl http://localhost:3001/health
# → OK (si endpoint existe)
```

### Stats Docker

```bash
# Usage ressources
docker stats --no-stream

# Espace disque containers
docker system df

# Cleanup (prudence!)
docker system prune -a
```

---

## 🔐 Credentials

### Supabase

```bash
URL: https://supabase.lecoach.digital
Anon Key: (dans .env)
Service Role: (dans supabase-admin.ts)
```

### Admin Panel

```bash
URL: https://creavisuel.pro/admin
Password: creavisuel2024
```

### Hostinger

```bash
Panel: https://hpanel.hostinger.com
Login: (credentials B2Santos)
```

---

## 📚 Documentation Complète

| Fichier | Description |
|---------|-------------|
| `WORK_LOG.md` | Journal détaillé travail Phase 1 |
| `STATUS.md` | État actuel système |
| `ARCHITECTURE.md` | Architecture technique complète |
| `OBSERVATIONS_TECHNIQUES.md` | Pièges & best practices |
| `QUICK_REFERENCE.md` | **CE FICHIER** - Commandes rapides |

### Plans & Guides

| Fichier | Description |
|---------|-------------|
| `/root/.claude/plans/harmonic-wondering-wind.md` | Plan master 16 semaines |
| `/root/CONFIGURE_WILDCARD_DNS.md` | Guide DNS wildcard |
| `/root/SUBDOMAIN_FIX_SUMMARY.md` | Fix Traefik v3 subdomains |

---

## 🎯 Checklist Quotidienne

### Matin (Vérifications)

- [ ] `docker ps` → Tous containers Up?
- [ ] `curl -I https://creavisuel.pro` → HTTP/2 200?
- [ ] `docker logs ncat-traefik-1 --tail 20` → Pas d'erreurs SSL?

### Après Modifications

- [ ] `npm run build` → Build réussi?
- [ ] `docker-compose up -d --force-recreate creavisuel-saas` → Container recréé?
- [ ] Test manuel dans browser → App charge?
- [ ] Test subdomain → Client app charge?

### Avant Déconnexion

- [ ] Backup code si modifications: `git commit -am "..."` (si git init)
- [ ] Documenter changements dans `WORK_LOG.md`
- [ ] Note TODOs pour prochaine session

---

## ⚡ Raccourcis Utiles

```bash
# Alias utiles (ajouter à ~/.bashrc)
alias dps='docker ps --format "table {{.Names}}\t{{.Status}}"'
alias dlogs='docker logs --tail 50'
alias cdsaas='cd /root/creavisuel-saas'
alias cdncat='cd /opt/ncat'
alias rebuild='npm run build && cd /opt/ncat && docker-compose up -d --force-recreate creavisuel-saas'
```

---

**Dernière mise à jour:** 2025-12-07 02:00 UTC
**Maintenu par:** B2Santos Team + Claude Code
