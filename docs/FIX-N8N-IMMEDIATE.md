# 🔧 Fix Immédiat N8N - Fonction Upsert
## Date: 2025-12-08

---

## 🚨 Problème Actuel

Votre webhook N8N `/webhook/chat` a une erreur avec la fonction `upsert_conversation_memory` :

```
Error: column reference "session_id" is ambiguous
```

---

## ✅ Solution Immédiate (2 minutes)

### Étape 1: Exécuter ce SQL dans Supabase

Aller sur https://supabase.lecoach.digital → SQL Editor

Copier-coller et exécuter :

```sql
-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS upsert_conversation_memory(TEXT, UUID, JSONB, JSONB, INTEGER);

-- Créer la fonction corrigée
CREATE OR REPLACE FUNCTION upsert_conversation_memory(
  p_session_id TEXT,
  p_tenant_id UUID,
  p_short_term_memory JSONB DEFAULT '{}'::jsonb,
  p_long_term_memory JSONB DEFAULT '{}'::jsonb,
  p_message_count INTEGER DEFAULT 1
)
RETURNS SETOF n8n_conversations
LANGUAGE sql
AS $
  INSERT INTO n8n_conversations (
    session_id,
    conversation_id,
    tenant_id,
    short_term_memory,
    long_term_memory,
    message_count
  )
  VALUES (
    p_session_id,
    p_session_id,
    p_tenant_id,
    p_short_term_memory,
    p_long_term_memory,
    p_message_count
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    short_term_memory = EXCLUDED.short_term_memory,
    long_term_memory = EXCLUDED.long_term_memory,
    message_count = EXCLUDED.message_count,
    updated_at = NOW()
  RETURNING *;
$;
```

### Étape 2: Tester

```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test après fix",
    "type": "text",
    "sessionId": "test-fix-001",
    "tenant": {
      "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
      "name": "JeffTerra",
      "slug": "jeffterra",
      "aiConfig": {
        "systemPrompt": "Tu es un assistant",
        "tone": "professionnel",
        "model": "gpt-4o-mini"
      }
    }
  }'
```

**Résultat attendu :** Réponse JSON avec succès (pas d'erreur)

### Étape 3: Vérifier dans Supabase

```sql
SELECT * FROM n8n_conversations WHERE session_id = 'test-fix-001';
```

Vous devriez voir 1 ligne avec la conversation.

---

## 🎯 Prochaine Étape

Une fois ce fix appliqué, vous pouvez passer aux nouvelles fonctionnalités :

1. Exécuter les 5 migrations SQL (voir `QUICK-START.md`)
2. Mettre à jour N8N "Préparer Contexte" pour supporter les médias
3. Implémenter les pages frontend

---

## 📝 Explications Techniques

### Pourquoi l'erreur ?

L'ancienne fonction utilisait :

```sql
RETURNS TABLE (
  id UUID,
  session_id TEXT,  -- ❌ Conflit avec paramètre p_session_id
  ...
)
```

PostgreSQL ne savait pas si `session_id` dans le `RETURNING` faisait référence au **paramètre** ou à la **colonne**.

### La Solution

Utiliser `RETURNS SETOF n8n_conversations` qui :
- Retourne directement le type de la table
- Pas de conflit de noms
- Plus simple et standard

---

## ✅ Fichiers de Référence

- Script SQL complet : `/root/creavisuel-saas/scripts/fix-upsert-function-v3.sql`
- Documentation erreur : `/root/creavisuel-saas/docs/N8N-SUPABASE-UPDATE-ONLY.md`

---

**Temps estimé : 2 minutes**
**Priorité : HAUTE - À faire maintenant**
