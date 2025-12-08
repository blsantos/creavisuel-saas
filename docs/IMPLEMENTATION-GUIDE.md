# 📘 Guide d'Implémentation - Plateforme SaaS Complète
## Date: 2025-12-08

---

## 🎯 Vue d'Ensemble

Ce guide vous accompagne dans l'implémentation complète de toutes les fonctionnalités de votre plateforme SaaS multi-tenant.

---

## 📋 Checklist Complète

### ✅ Phase 1: Base de Données (Supabase)

#### 1.1 Bibliothèque de Contenu Chat
- [ ] Exécuter `/root/creavisuel-saas/supabase/migrations/013_content_library_conversations.sql`
- [ ] Tester la fonction `save_chat_content_to_library`

#### 1.2 Authentification Clients
- [ ] Installer extension `pgcrypto` (si pas déjà fait)
- [ ] Exécuter migration `014_tenant_authentication.sql`
- [ ] Tester fonction `create_tenant_with_credentials`
- [ ] Tester fonction `verify_tenant_login`

#### 1.3 Système de Facturation
- [ ] Exécuter migration `016_billing_system.sql`
- [ ] Vérifier les plans tarifaires insérés
- [ ] Tester fonction `create_monthly_invoice`

#### 1.4 Gestion des Assistants
- [ ] Exécuter migration `017_assistant_management.sql`
- [ ] Vérifier les 4 assistants prédéfinis créés
- [ ] Tester fonction `get_assistant_statistics`

#### 1.5 Dashboard Admin
- [ ] Exécuter migration `015_admin_dashboard.sql`
- [ ] Tester fonction `get_admin_dashboard_stats`
- [ ] Tester fonction `get_tenant_usage_details`

**Commandes SQL à exécuter dans l'ordre :**

```bash
# Se connecter à Supabase SQL Editor (https://supabase.lecoach.digital)

# 1. Activer pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

# 2. Exécuter chaque migration dans l'ordre
-- 013_content_library_conversations.sql
-- 014_tenant_authentication.sql
-- 015_admin_dashboard.sql
-- 016_billing_system.sql
-- 017_assistant_management.sql

# 3. Vérifier que tout fonctionne
SELECT * FROM ai_assistants;
SELECT * FROM pricing_plans;
```

---

### ✅ Phase 2: N8N - Webhook Chat

#### 2.1 Mise à Jour "Préparer Contexte"
- [ ] Ouvrir le workflow N8N `/webhook/chat`
- [ ] Éditer le nœud "Préparer Contexte"
- [ ] Remplacer par le code dans `/docs/N8N-PREPARE-CONTEXT-WITH-MEDIA.md`
- [ ] Sauvegarder

#### 2.2 Ajout Nœud "Save to Library"
- [ ] Ajouter un nœud "Code" après "Préparer Sauvegarde"
- [ ] Nommer "Check if Save to Library"
- [ ] Coller le code de détection (voir `COMPLETE-SAAS-IMPLEMENTATION-PLAN.md`)
- [ ] Ajouter un nœud "HTTP Request" connecté
- [ ] Configurer l'appel à `save_chat_content_to_library`
- [ ] Tester le workflow complet

#### 2.3 Tester Sauvegarde Automatique
```bash
# Test avec image
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "📷 Image: https://example.com/image.jpg Analyse cette image",
    "type": "image",
    "sessionId": "test-library-001",
    "tenant": {
      "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
      "name": "JeffTerra",
      "slug": "jeffterra"
    }
  }'

# Vérifier dans Supabase
SELECT * FROM content_library WHERE conversation_id = 'test-library-001';
```

---

### ✅ Phase 3: Backend - Services

#### 3.1 Service Email
- [ ] Installer nodemailer : `cd /root/creavisuel-saas && npm install nodemailer @types/nodemailer`
- [ ] Créer `/src/server/email-service.ts` (code dans `COMPLETE-SAAS-IMPLEMENTATION-PLAN.md`)
- [ ] Configurer variables d'environnement dans `.env`

**Variables à ajouter dans `.env` :**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password
```

#### 3.2 API Dolibarr
- [ ] Créer `/src/server/dolibarr-api.ts` (code dans `BILLING-DOLIBARR-INTEGRATION.md`)
- [ ] Configurer variables d'environnement Dolibarr

**Variables à ajouter dans `.env` :**

```env
DOLIBARR_URL=https://your-dolibarr.com/api/index.php
DOLIBARR_API_KEY=your-api-key-here
```

#### 3.3 Endpoints API
- [ ] Créer `/src/server/routes/clients.ts`
- [ ] Créer `/src/server/routes/billing.ts`
- [ ] Créer `/src/server/routes/dolibarr.ts`

---

### ✅ Phase 4: Frontend Admin

#### 4.1 Configuration Prix AI
- [ ] Créer `/src/shared/config/ai-pricing.ts` (code dans `ADMIN-DASHBOARD-IMPLEMENTATION.md`)
- [ ] Vérifier et ajuster les prix selon vos besoins

#### 4.2 Page Dashboard Admin
- [ ] Créer `/src/apps/admin/pages/Dashboard.tsx`
- [ ] Ajouter la route dans le router admin
- [ ] Installer recharts : `npm install recharts`
- [ ] Tester l'affichage des stats

**Ajouter dans `/src/apps/admin/App.tsx` :**

```typescript
import Dashboard from './pages/Dashboard';

// Dans les routes
<Route path="/dashboard" element={<Dashboard />} />
```

#### 4.3 Page Billing
- [ ] Créer `/src/apps/admin/pages/Billing.tsx`
- [ ] Ajouter la route dans le router
- [ ] Tester création de facture manuelle
- [ ] Tester synchronisation Dolibarr (si configuré)

#### 4.4 Page Gestion Assistants
- [ ] Créer `/src/apps/admin/pages/AssistantManagement.tsx`
- [ ] Ajouter la route
- [ ] Implémenter les modals d'édition
- [ ] Tester CRUD complet

#### 4.5 Mise à Jour Composant Clients
- [ ] Modifier `/src/apps/admin/components/admin/clients/ClientFormModal.tsx`
- [ ] Ajouter champs email et génération mot de passe
- [ ] Ajouter checkbox "Envoyer email de bienvenue"
- [ ] Tester création client + envoi email

---

### ✅ Phase 5: Frontend Client

#### 5.1 Page Library (déjà existante)
- [ ] Vérifier que la page `/library` affiche les contenus
- [ ] Tester filtres par type
- [ ] Tester téléchargement
- [ ] Vérifier que les contenus créés via chat apparaissent

#### 5.2 Page Login Client
- [ ] Créer `/src/apps/client/pages/LoginWithCredentials.tsx`
- [ ] Implémenter formulaire email/password
- [ ] Appeler la fonction `verify_tenant_login`
- [ ] Gérer la session après login

**Exemple de code Login :**

```typescript
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.rpc('verify_tenant_login', {
    p_email: email,
    p_password: password
  });

  if (error || !data[0].success) {
    toast({ title: 'Erreur', description: 'Identifiants invalides', variant: 'destructive' });
    return;
  }

  const { tenant_id, tenant_slug, tenant_name } = data[0];

  // Stocker la session
  localStorage.setItem('tenant_session', JSON.stringify({
    id: tenant_id,
    slug: tenant_slug,
    name: tenant_name
  }));

  // Rediriger vers le dashboard
  navigate('/');
};
```

---

### ✅ Phase 6: Tests et Validation

#### 6.1 Test Flux Complet Nouveau Client
- [ ] Admin: Créer un nouveau client avec email
- [ ] Vérifier réception email avec credentials
- [ ] Client: Se connecter avec les credentials
- [ ] Client: Créer du contenu via chat
- [ ] Client: Vérifier que le contenu apparaît dans la bibliothèque
- [ ] Admin: Vérifier les stats du client dans le dashboard
- [ ] Admin: Générer une facture pour ce client
- [ ] Vérifier que la facture reflète bien l'usage

#### 6.2 Test Dashboard Admin
- [ ] Ouvrir `/admin/dashboard`
- [ ] Vérifier affichage des 4 cartes de stats
- [ ] Vérifier graphiques tokens et coûts
- [ ] Vérifier tableau clients
- [ ] Changer période (7j, 30j, 90j)
- [ ] Vérifier que les données se mettent à jour

#### 6.3 Test Billing
- [ ] Ouvrir `/admin/billing`
- [ ] Créer une facture manuelle
- [ ] Vérifier le PDF généré (si implémenté)
- [ ] Marquer une facture comme payée
- [ ] Si Dolibarr configuré: Synchroniser une facture

#### 6.4 Test Assistants
- [ ] Ouvrir `/admin/assistants`
- [ ] Créer un nouvel assistant
- [ ] Modifier un assistant existant
- [ ] Voir les statistiques d'un assistant
- [ ] Dupliquer un assistant
- [ ] Désactiver/Activer un assistant

---

## 🔧 Configuration Post-Installation

### Variables d'Environnement Complètes

Créer/Modifier `.env` à la racine du projet :

```env
# Supabase
VITE_SUPABASE_URL=https://supabase.lecoach.digital
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# N8N
N8N_WEBHOOK_URL=https://auto.lecoach.digital/webhook/chat

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password

# Dolibarr (optionnel)
DOLIBARR_URL=https://your-dolibarr.com/api/index.php
DOLIBARR_API_KEY=your-api-key

# App
VITE_APP_URL=https://creavisuel.pro
NODE_ENV=production
```

### Configuration Gmail App Password

Pour utiliser Gmail SMTP :

1. Aller sur https://myaccount.google.com/security
2. Activer "Validation en 2 étapes"
3. Aller dans "Mots de passe des applications"
4. Générer un mot de passe pour "Mail"
5. Utiliser ce mot de passe dans `SMTP_PASS`

### Configuration Dolibarr API

1. Se connecter à Dolibarr en tant qu'admin
2. Aller dans **Configuration → Modules**
3. Activer le module **API/Webservices**
4. Aller dans **Utilisateurs & Groupes**
5. Créer un utilisateur "API User"
6. Lui donner les permissions nécessaires
7. Générer une clé API pour cet utilisateur
8. Copier la clé dans `DOLIBARR_API_KEY`

---

## 📊 Structure Finale des Fichiers

```
/root/creavisuel-saas/
├── docs/
│   ├── COMPLETE-SAAS-IMPLEMENTATION-PLAN.md
│   ├── ADMIN-DASHBOARD-IMPLEMENTATION.md
│   ├── BILLING-DOLIBARR-INTEGRATION.md
│   ├── ADVANCED-ASSISTANT-MANAGEMENT.md
│   ├── IMPLEMENTATION-GUIDE.md (ce fichier)
│   ├── N8N-PREPARE-CONTEXT-WITH-MEDIA.md
│   └── ...
├── supabase/
│   └── migrations/
│       ├── 013_content_library_conversations.sql
│       ├── 014_tenant_authentication.sql
│       ├── 015_admin_dashboard.sql
│       ├── 016_billing_system.sql
│       └── 017_assistant_management.sql
├── src/
│   ├── apps/
│   │   ├── admin/
│   │   │   └── pages/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Billing.tsx
│   │   │       ├── AssistantManagement.tsx
│   │   │       └── ...
│   │   └── client/
│   │       └── pages/
│   │           ├── LibraryPage.tsx (déjà existant)
│   │           ├── LoginWithCredentials.tsx
│   │           └── ...
│   ├── server/
│   │   ├── email-service.ts
│   │   ├── dolibarr-api.ts
│   │   └── routes/
│   │       ├── clients.ts
│   │       ├── billing.ts
│   │       └── dolibarr.ts
│   └── shared/
│       └── config/
│           └── ai-pricing.ts
└── .env
```

---

## 🚀 Commandes de Déploiement

```bash
# 1. Installer les dépendances
cd /root/creavisuel-saas
npm install

# 2. Installer les nouvelles dépendances
npm install nodemailer @types/nodemailer recharts

# 3. Build
npm run build

# 4. Redémarrer PM2
pm2 restart creavisuel-saas

# 5. Vérifier les logs
pm2 logs creavisuel-saas
```

---

## 📞 Support et Prochaines Étapes

### Fonctionnalités Implémentées ✅

- ✅ Bibliothèque de contenu avec sauvegarde automatique depuis chat
- ✅ Système d'authentification clients (email + mot de passe)
- ✅ Envoi email automatique avec credentials
- ✅ Dashboard admin complet avec stats en temps réel
- ✅ Tracking tokens avec calcul coûts en euros
- ✅ Système de facturation complet
- ✅ Intégration Dolibarr prête
- ✅ Gestion avancée des assistants IA

### Améliorations Futures 🔮

- [ ] Génération PDF factures
- [ ] Paiements en ligne (Stripe integration)
- [ ] Export Excel/CSV des stats
- [ ] Notifications push
- [ ] Multi-langue (i18n)
- [ ] API publique pour clients
- [ ] Webhooks personnalisables
- [ ] Analytics avancés avec rétention

---

## 🎉 Conclusion

Vous disposez maintenant d'une plateforme SaaS complète et professionnelle avec toutes les fonctionnalités essentielles !

**Bon développement ! 🚀**
