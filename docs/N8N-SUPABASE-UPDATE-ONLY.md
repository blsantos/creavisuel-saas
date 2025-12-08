# 🔧 Configuration Supabase Update (Sans Upsert)

## 📋 Problème

Le nœud Supabase natif dans votre version de N8N n'a que **"Update"**, pas "Upsert".

**Solution :** Utiliser une combinaison de nœuds pour gérer INSERT et UPDATE.

---

## ✅ Solution : Workflow en Deux Étapes

### Option 1 : Update + Gestion d'Erreur (Simple) ⚡

```
Préparer Sauvegarde (Function)
  ↓
Update a row (Supabase) → Si succès, continue
  ↓ (En cas d'erreur)
Insert a row (Supabase) → Crée la session
  ↓
Respond to Webhook
```

### Configuration :

#### Nœud 1 : "Update a row"

**Operation :** Update
**Table :** `n8n_conversations`

**Filter Type :** Manual
**Filters :**
- **Key Name :** `session_id`
- **Key Value :** `={{ $json.session_id }}`
- **Condition :** `equals`

**Fields to Send :** Define Below

**Fields :**
| Field Name | Field Value |
|------------|-------------|
| `short_term_memory` | `={{ $json.short_term_memory }}` |
| `long_term_memory` | `={{ $json.long_term_memory }}` |
| `message_count` | `={{ $json.message_count }}` |

**Settings du nœud :**
- ✅ **Continue on Fail** : ON (important !)
- ✅ **Always Output Data** : ON

#### Nœud 2 : "Insert a row" (En cas d'échec du Update)

**Operation :** Insert
**Table :** `n8n_conversations`

**Fields to Send :** Define Below

**Fields :**
| Field Name | Field Value |
|------------|-------------|
| `session_id` | `={{ $json.session_id }}` |
| `conversation_id` | `={{ $json.conversation_id }}` |
| `tenant_id` | `={{ $json.tenant_id }}` |
| `short_term_memory` | `={{ $json.short_term_memory }}` |
| `long_term_memory` | `={{ $json.long_term_memory }}` |
| `message_count` | `={{ $json.message_count }}` |

**Connexion :**
- Update → Insert (via "On Error" output)

---

## 🎯 Option 2 : SQL Direct avec HTTP Request (Plus Fiable)

Si les nœuds natifs posent problème, utilisez Postgres directement avec une requête UPSERT :

### Nœud : HTTP Request

**Method :** POST
**URL :** `https://supabase.lecoach.digital/rest/v1/rpc/upsert_conversation_memory`
**Authentication :** Supabase API

**Headers :**
```json
{
  "apikey": "YOUR_ANON_KEY",
  "Authorization": "Bearer YOUR_ANON_KEY",
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}
```

**Body :**
```json
{
  "p_session_id": "={{ $json.session_id }}",
  "p_tenant_id": "={{ $json.tenant_id }}",
  "p_short_term_memory": {{ JSON.stringify($json.short_term_memory) }},
  "p_long_term_memory": {{ JSON.stringify($json.long_term_memory) }},
  "p_message_count": "={{ $json.message_count }}"
}
```

### Fonction SQL à Créer dans Supabase :

Créez cette fonction dans le SQL Editor :

```sql
CREATE OR REPLACE FUNCTION upsert_conversation_memory(
  p_session_id TEXT,
  p_tenant_id UUID,
  p_short_term_memory JSONB DEFAULT '{}'::jsonb,
  p_long_term_memory JSONB DEFAULT '{}'::jsonb,
  p_message_count INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  conversation_id TEXT,
  tenant_id UUID,
  short_term_memory JSONB,
  long_term_memory JSONB,
  message_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
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
    p_session_id, -- conversation_id = session_id
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
  RETURNING
    n8n_conversations.id,
    n8n_conversations.session_id,
    n8n_conversations.conversation_id,
    n8n_conversations.tenant_id,
    n8n_conversations.short_term_memory,
    n8n_conversations.long_term_memory,
    n8n_conversations.message_count,
    n8n_conversations.created_at,
    n8n_conversations.updated_at;
END;
$$;

-- Tester la fonction
SELECT * FROM upsert_conversation_memory(
  'test-session-123',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "test"}'::jsonb,
  '{}'::jsonb,
  1
);
```

---

## 🚀 Ma Recommandation : Option 2 (SQL Function)

**Pourquoi ?**
- ✅ Un seul nœud HTTP
- ✅ UPSERT natif Postgres (INSERT ou UPDATE automatique)
- ✅ Pas de gestion d'erreur complexe
- ✅ Plus performant

---

## 📝 Configuration Complète Option 2

### 1. Créez la fonction SQL dans Supabase

Copiez-collez le SQL ci-dessus dans le SQL Editor.

### 2. Remplacez le nœud "Update a row" par HTTP Request

**Type :** HTTP Request
**Nom :** `Upsert Memory (SQL)`
**Method :** POST
**URL :** `https://supabase.lecoach.digital/rest/v1/rpc/upsert_conversation_memory`

**Authentication :** Predefined Credential Type → Supabase API

**Send Body :** Yes
**Body Content Type :** JSON

**Body Parameters (Define Below) :**

| Parameter Name | Parameter Value |
|----------------|-----------------|
| `p_session_id` | `={{ $json.session_id }}` |
| `p_tenant_id` | `={{ $json.tenant_id }}` |
| `p_short_term_memory` | `={{ JSON.stringify($json.short_term_memory) }}` |
| `p_long_term_memory` | `={{ JSON.stringify($json.long_term_memory) }}` |
| `p_message_count` | `={{ $json.message_count }}` |

---

## 🧪 Tester la Fonction SQL

Après avoir créé la fonction, testez-la :

```sql
-- Test 1: INSERT (nouvelle session)
SELECT * FROM upsert_conversation_memory(
  'test-new-session',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Premier message"}'::jsonb,
  '{}'::jsonb,
  1
);

-- Vérifier que c'est créé
SELECT * FROM n8n_conversations WHERE session_id = 'test-new-session';

-- Test 2: UPDATE (session existante)
SELECT * FROM upsert_conversation_memory(
  'test-new-session',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Deuxième message", "message_count": 2}'::jsonb,
  '{"user_name": "Bruno"}'::jsonb,
  2
);

-- Vérifier que c'est mis à jour
SELECT * FROM n8n_conversations WHERE session_id = 'test-new-session';
```

---

## 🔄 Workflow Final (Option 2)

```
OpenAI GPT
  ↓
Préparer Sauvegarde (Function)
  ↓
Upsert Memory (HTTP Request avec SQL function)
  ↓
Respond to Webhook
```

**Simple, efficace, fiable ! ✅**

---

## 📋 Comparaison des Options

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **1: Update + Insert** | Pas besoin de SQL | 2 nœuds, gestion d'erreur |
| **2: SQL Function** ⭐ | 1 nœud, UPSERT natif | Besoin de créer fonction SQL |

---

**Quelle option préférez-vous ?**

1 = Update + Insert (2 nœuds natifs)
2 = SQL Function (1 nœud HTTP avec UPSERT) ⭐ Recommandé

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Alternative à UPSERT avec Update-only
