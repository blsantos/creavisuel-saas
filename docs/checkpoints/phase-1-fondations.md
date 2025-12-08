# Phase 1: Fondations & Base de Données

**Durée estimée:** 2 semaines
**Date début:** 6 décembre 2025
**Date fin prévue:** 20 décembre 2025

---

## 🎯 Objectifs Phase 1

- [ ] Monorepo créé avec structure organisée
- [ ] Migrations Supabase exécutées (8 tables principales)
- [ ] RLS policies configurées et testées
- [ ] TenantContext implémenté avec détection subdomain
- [ ] Traefik wildcard routing configuré
- [ ] Router principal avec lazy loading
- [ ] Styles partagés (glassmorphism + animations CSS)
- [ ] Premier tenant de test fonctionnel

---

## ✅ Tests de Validation

### 1. Structure Projet
- [ ] Dossiers apps/admin, apps/client, shared créés
- [ ] package.json avec toutes dépendances installées
- [ ] Build Vite fonctionne sans erreurs
- [ ] TypeScript compile sans erreurs

### 2. Base de Données
- [ ] Table `tenants` créée avec contraintes
- [ ] Table `tenant_configs` créée avec JSONB valides
- [ ] Table `content_library` créée
- [ ] Table `templates` créée
- [ ] Table `automation_schedules` créée
- [ ] Table `tools_catalog` créée et seed data ajouté
- [ ] Table `tenant_tool_access` créée
- [ ] Table `token_usage` créée
- [ ] RLS activé sur toutes les tables
- [ ] Policies testées avec requêtes SQL

### 3. Routing & Tenant Detection
- [ ] TenantContext créé et fonctionnel
- [ ] Détection hostname fonctionne
- [ ] Extraction slug subdomain correcte
- [ ] Fetch tenant depuis Supabase OK
- [ ] Application branding CSS dynamique
- [ ] Router principal charge admin vs client selon hostname

### 4. Traefik Wildcard
- [ ] Configuration traefik.yml avec wildcard
- [ ] Docker-compose modifié pour nouveau service
- [ ] Certificats SSL générés automatiquement
- [ ] test.creavisuel.pro accessible

### 5. Tests Bout-en-Bout
- [ ] `https://creavisuel.pro` charge (marketing/admin)
- [ ] `https://test.creavisuel.pro` charge avec branding tenant test
- [ ] CSS variables correctement appliquées
- [ ] Aucune erreur console navigateur
- [ ] Performance Lighthouse >85

---

## 📦 Livrables

### Code
- **Repo:** `/root/creavisuel-saas/`
- **Structure:**
  ```
  /root/creavisuel-saas/
  ├── src/
  │   ├── apps/admin/     (modern-clarity migré)
  │   ├── apps/client/    (chatn8n-media-hub migré)
  │   └── shared/         (composants communs)
  ├── supabase/
  │   └── migrations/     (8 fichiers .sql)
  ├── docker/
  │   └── traefik/        (wildcard config)
  ├── package.json
  ├── vite.config.ts
  ├── tailwind.config.ts
  └── tsconfig.json
  ```

### Base de Données
- **Migrations:** `supabase/migrations/001-008_*.sql`
- **Seed Data:** `tools_catalog` avec 8 outils
- **RLS Policies:** Policies admin/owner/user pour chaque table

### Configuration
- **Traefik:** `docker/traefik/traefik.yml` + `dynamic.yml`
- **Docker:** Nouveau service `creavisuel-app` dans docker-compose
- **Env:** `.env.example` avec toutes variables

---

## 🔧 Commandes Vérification

```bash
# Vérifier structure
tree -L 3 /root/creavisuel-saas/

# Vérifier dépendances
cd /root/creavisuel-saas && npm list

# Tester build
npm run build

# Vérifier migrations Supabase
ls -lh /root/creavisuel-saas/supabase/migrations/

# Tester routing
curl -I https://creavisuel.pro
curl -I https://test.creavisuel.pro

# Vérifier containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test base de données
psql $DATABASE_URL -c "SELECT slug, name, status FROM tenants;"
```

---

## 📊 Métriques Succès

| Métrique | Cible | Résultat |
|----------|-------|----------|
| Tables Supabase | 8 | ___ |
| RLS Policies | 16+ | ___ |
| Composants shared | 50+ | ___ |
| Build time | <60s | ___ |
| Bundle size admin | <600KB | ___ |
| Bundle size client | <400KB | ___ |
| Lighthouse score | >85 | ___ |

---

## 📝 Notes d'Implémentation

### Décisions Importantes:

**2025-12-06:**
- Monorepo choisi vs multi-repo (moins de duplication)
- Vite utilisé pour build (déjà en place dans les 2 apps)
- shadcn/ui components partagés dans /shared
- Supabase client unique dans shared/lib/supabase.ts

### Difficultés Rencontrées:

_(À remplir pendant implémentation)_

### Améliorations Futures:

_(À remplir en fin de phase)_

---

## ✍️ Sign-off Phase 1

**Date complétée:** __________________
**Validé par:** __________________
**Commentaires:**

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

---

**Prochaine Phase:** [Phase 2 - Admin Panel](./phase-2-admin.md)
