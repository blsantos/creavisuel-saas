# ⚡ Quick Start - Plateforme SaaS CréaVisuel
## Guide de Démarrage Rapide

---

## 🎯 Résumé en 30 secondes

Votre plateforme SaaS multi-tenant est maintenant équipée de :

1. **📚 Bibliothèque de Contenu** - Tout ce qui est créé via chat est sauvegardé automatiquement
2. **🔐 Authentification Clients** - Chaque client a son propre login avec email + mot de passe
3. **📊 Dashboard Admin** - Vue complète sur tous vos clients avec stats en temps réel
4. **💰 Tracking Coûts** - Calcul précis des coûts en euros par client basé sur l'usage des tokens
5. **💳 Facturation** - Génération automatique de factures avec intégration Dolibarr
6. **🤖 Gestion Assistants** - Configuration avancée de vos assistants IA

---

## 🚀 Installation en 5 Étapes

### Étape 1: Exécuter les Migrations SQL (5 min)

```bash
# Se connecter à Supabase SQL Editor
# https://supabase.lecoach.digital

# Copier-coller et exécuter dans l'ordre :
```

1. `/root/creavisuel-saas/supabase/migrations/013_content_library_conversations.sql`
2. `/root/creavisuel-saas/supabase/migrations/014_tenant_authentication.sql`
3. `/root/creavisuel-saas/docs/ADMIN-DASHBOARD-IMPLEMENTATION.md` (Section PARTIE 1)
4. `/root/creavisuel-saas/docs/BILLING-DOLIBARR-INTEGRATION.md` (Section PARTIE 1)
5. `/root/creavisuel-saas/docs/ADVANCED-ASSISTANT-MANAGEMENT.md` (Section PARTIE 1)

### Étape 2: Configuration Variables d'Environnement (2 min)

```bash
# Éditer /root/creavisuel-saas/.env
nano /root/creavisuel-saas/.env
```

Ajouter :

```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password

# Dolibarr (optionnel)
DOLIBARR_URL=https://your-dolibarr.com/api/index.php
DOLIBARR_API_KEY=your-api-key
```

### Étape 3: Installer Dépendances (1 min)

```bash
cd /root/creavisuel-saas
npm install nodemailer @types/nodemailer recharts
```

### Étape 4: Mettre à Jour N8N (5 min)

1. Ouvrir N8N : https://auto.lecoach.digital
2. Ouvrir workflow `/webhook/chat`
3. Éditer le nœud "Préparer Contexte"
4. Remplacer par le code dans `/root/creavisuel-saas/docs/N8N-PREPARE-CONTEXT-WITH-MEDIA.md`
5. Sauvegarder et activer

### Étape 5: Build et Déployer (2 min)

```bash
cd /root/creavisuel-saas
npm run build
pm2 restart creavisuel-saas
pm2 logs creavisuel-saas
```

---

## 📁 Fichiers Créés

### Documentation Complète

| Fichier | Description |
|---------|-------------|
| `COMPLETE-SAAS-IMPLEMENTATION-PLAN.md` | Plan complet partie 1 (Bibliothèque + Auth) |
| `ADMIN-DASHBOARD-IMPLEMENTATION.md` | Dashboard admin avec stats et graphiques |
| `BILLING-DOLIBARR-INTEGRATION.md` | Système facturation + Dolibarr |
| `ADVANCED-ASSISTANT-MANAGEMENT.md` | Gestion avancée assistants IA |
| `IMPLEMENTATION-GUIDE.md` | Guide détaillé étape par étape |
| `QUICK-START.md` | Ce fichier - démarrage rapide |

### Migrations SQL

| Fichier | Contenu |
|---------|---------|
| `013_content_library_conversations.sql` | Lien bibliothèque ↔ conversations |
| `014_tenant_authentication.sql` | Système login clients |
| Dans docs (à extraire) | Migrations 015, 016, 017 |

---

## 🎨 Nouvelles Fonctionnalités

### 1. Bibliothèque de Contenu Automatique

**Ce qui se passe maintenant :**
- Un utilisateur envoie un message au chat IA
- L'IA génère une réponse (texte, image, etc.)
- ✨ Le contenu est **automatiquement sauvegardé** dans `content_library`
- Le client peut retrouver tout son historique dans `/library`

**Visible dans :**
- Page `/library` du client (déjà existante)
- Dashboard admin (nouveaux contenus)

### 2. Création Clients avec Credentials

**Avant :** Admin créait un client → Le client devait créer son compte

**Maintenant :**
1. Admin clique "Nouveau Client"
2. Remplit nom, slug, **email**
3. ✅ Mot de passe généré automatiquement
4. ✉️ Email envoyé avec credentials
5. Client reçoit ses identifiants et peut se connecter immédiatement

**URL de connexion :** `https://slug-client.creavisuel.pro/login`

### 3. Dashboard Admin Complet

**Nouvelles données visibles :**

📈 **Stats Globales**
- Total clients actifs / en trial / suspendus
- Total contenus créés
- Total conversations
- Coût total en euros

💰 **Par Client**
- Tokens utilisés
- Coût en euros (calcul précis basé sur modèle IA)
- Dernière activité
- Nombre de contenus

📊 **Graphiques**
- Timeline usage tokens (30 jours)
- Coûts par jour
- Top 10 clients

🚨 **Alertes**
- Clients proches limite tokens
- Clients inactifs
- Trials qui expirent

### 4. Système de Facturation

**Génération automatique de factures :**

```sql
-- Créer facture pour un client (mois dernier)
SELECT create_monthly_invoice(
  '<tenant_id>',
  '2025-11-01',
  '2025-11-30',
  TRUE -- Envoyer immédiatement
);
```

**Ce que contient une facture :**
- Nombre de tokens utilisés
- Coût calculé en euros
- TVA 20%
- Détails par outil/modèle utilisé

**Intégration Dolibarr :**
- Synchronisation automatique
- Création client dans Dolibarr
- Création facture
- Validation automatique

### 5. Gestion Assistants IA

**Configuration avancée :**
- Modèle IA (GPT-4o, GPT-4o-mini, Claude, etc.)
- System prompt (instructions)
- Température (créativité)
- Max tokens
- Supports images/audio/vidéo
- Assignment aux clients

**Stats par assistant :**
- Nombre d'utilisations
- Tokens consommés
- Coût total
- Taux de succès
- Latence moyenne

---

## 🧪 Tests Rapides

### Test 1: Sauvegarde Chat → Bibliothèque

```bash
# Envoyer un message au chat
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Crée-moi un post LinkedIn sur l''innovation",
    "type": "text",
    "sessionId": "test-quickstart-001",
    "tenant": {
      "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
      "name": "JeffTerra",
      "slug": "jeffterra"
    }
  }'

# Vérifier dans Supabase
SELECT * FROM content_library
WHERE conversation_id = 'test-quickstart-001';
```

### Test 2: Créer Client avec Email

```sql
-- Exécuter dans Supabase SQL Editor
SELECT * FROM create_tenant_with_credentials(
  'test-client',
  'Test Client SAAS',
  'test@example.com',
  NULL -- Génération auto du mot de passe
);

-- Résultat attendu :
-- tenant_id | email | generated_password | login_url
```

### Test 3: Dashboard Stats

1. Aller sur `https://admin.creavisuel.pro/dashboard`
2. Vérifier que les 4 cartes de stats s'affichent
3. Vérifier que les graphiques se chargent
4. Vérifier le tableau des clients

### Test 4: Facturation

```sql
-- Créer une facture de test
SELECT create_monthly_invoice(
  (SELECT id FROM tenants LIMIT 1),
  DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
  DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
  FALSE -- Mode brouillon
);

-- Vérifier
SELECT invoice_number, total, status
FROM invoices
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📊 Comprendre le Calcul des Coûts

### Prix par Modèle IA (en euros)

| Modèle | Coût / 1M tokens input | Coût / 1M tokens output |
|--------|------------------------|-------------------------|
| GPT-4o | 2.50€ | 10.00€ |
| GPT-4o-mini | 0.15€ | 0.60€ |
| Claude 3 Opus | 15.00€ | 75.00€ |
| Claude 3 Sonnet | 3.00€ | 15.00€ |
| Claude 3 Haiku | 0.25€ | 1.25€ |

### Exemple de Calcul

**Scénario :** Un client utilise GPT-4o-mini pour 100 messages

- Tokens input moyens : 500 tokens/message → 50,000 tokens
- Tokens output moyens : 300 tokens/message → 30,000 tokens

**Calcul :**
```
Input:  50,000 tokens × 0.15€ / 1M = 0.0075€
Output: 30,000 tokens × 0.60€ / 1M = 0.0180€
TOTAL: 0.0255€ pour 100 messages
```

**Par mois (3000 messages) :** ~0.77€

---

## 🎯 Prochaines Étapes

### Immédiat (à faire maintenant)
1. ✅ Exécuter les 5 migrations SQL
2. ✅ Configurer variables d'environnement
3. ✅ Mettre à jour N8N
4. ✅ Tester création client + email

### Court terme (cette semaine)
- [ ] Créer les pages frontend (Dashboard, Billing, Assistants)
- [ ] Tester flux complet nouveau client
- [ ] Générer premières factures

### Moyen terme (ce mois)
- [ ] Configurer Dolibarr (si souhaité)
- [ ] Personnaliser templates d'emails
- [ ] Ajouter PDF génération factures
- [ ] Implémenter paiements en ligne

---

## 📞 Aide Rapide

### Problèmes Fréquents

**Q: Les migrations SQL échouent**
- Vérifier que pgcrypto est installé : `CREATE EXTENSION pgcrypto;`
- Exécuter les migrations dans l'ordre
- Vérifier les erreurs dans le console Supabase

**Q: Email ne s'envoie pas**
- Vérifier variables SMTP dans `.env`
- Pour Gmail, utiliser "App Password" pas le mot de passe normal
- Tester avec un email simple d'abord

**Q: Dashboard ne charge pas**
- Vérifier que les fonctions SQL sont créées
- Ouvrir console navigateur (F12) pour voir les erreurs
- Vérifier que recharts est installé : `npm list recharts`

**Q: Coûts semblent incorrects**
- Vérifier configuration prix dans `ai-pricing.ts`
- S'assurer que les tokens sont bien tracés dans `token_usage`
- Vérifier le modèle utilisé correspond aux prix

---

## 🎉 C'est Fini !

Vous avez maintenant une plateforme SaaS complète et professionnelle !

**Prochaine étape recommandée :**
Créer votre premier client de test et explorer toutes les nouvelles fonctionnalités.

```bash
# Commande finale pour tout vérifier
pm2 status
pm2 logs creavisuel-saas --lines 50
```

**Bon développement ! 🚀**
