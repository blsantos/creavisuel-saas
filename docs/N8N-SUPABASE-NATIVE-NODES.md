# 🔧 Utiliser les Nœuds Natifs Supabase dans N8N

## 📋 Vue d'ensemble

Au lieu d'utiliser des nœuds HTTP Request pour interroger Supabase, utilisez les **nœuds natifs Supabase** qui sont plus fiables et plus simples.

---

## 🎯 Deux Nœuds à Configurer

### 1. **Charger la Mémoire** (GET)
Vous l'avez déjà bien configuré ! ✅

### 2. **Sauvegarder la Mémoire** (UPSERT)
À remplacer par le nœud natif Supabase

---

## 📥 Nœud 1 : Charger la Mémoire (GET) - Déjà OK ✅

**Type :** Supabase
**Operation :** Get
**Table :** `n8n_conversations`

**Configuration actuelle (correcte) :**
```json
{
  "operation": "get",
  "tableId": "n8n_conversations",
  "filters": {
    "conditions": [
      {
        "keyName": "session_id",
        "keyValue": "={{ $json.sessionId }}"
      }
    ]
  }
}
```

**✅ Parfait ! Ne changez rien ici.**

---

## 💾 Nœud 2 : Sauvegarder la Mémoire (UPSERT) - À Remplacer

### Configuration du Nœud Natif Supabase

**Type :** Supabase
**Nom du nœud :** `Save Memory`
**Operation :** `Update` ou `Upsert`
**Table :** `n8n_conversations`

### Option A : Update (si la session existe déjà)

**Configuration :**
```json
{
  "operation": "update",
  "tableId": "n8n_conversations",
  "filterType": "manual",
  "filters": {
    "conditions": [
      {
        "keyName": "session_id",
        "keyValue": "={{ $json.session_id }}",
        "condition": "eq"
      }
    ]
  },
  "fieldsToSend": "defineFields",
  "fields": {
    "short_term_memory": "={{ $json.short_term_memory }}",
    "long_term_memory": "={{ $json.long_term_memory }}",
    "message_count": "={{ $json.message_count }}",
    "updated_at": "={{ $now }}"
  }
}
```

### Option B : Upsert (Recommandé - Insert ou Update automatique)

**Configuration :**
```json
{
  "operation": "upsert",
  "tableId": "n8n_conversations",
  "fieldsToSend": "defineFields",
  "fields": {
    "session_id": "={{ $json.session_id }}",
    "tenant_id": "={{ $json.tenant_id }}",
    "conversation_id": "={{ $json.session_id }}",
    "short_term_memory": "={{ $json.short_term_memory }}",
    "long_term_memory": "={{ $json.long_term_memory }}",
    "message_count": "={{ $json.message_count }}"
  },
  "options": {
    "onConflict": "session_id"
  }
}
```

**Pourquoi Upsert est meilleur :**
- ✅ Si la session existe → UPDATE
- ✅ Si la session n'existe pas → INSERT
- ✅ Pas besoin de vérifier l'existence avant

---

## 🔄 Workflow Complet avec Nœuds Natifs

```
1. Chat Trigger (Webhook)
   Path: /chat
   ↓
2. Extract Input (Function)
   Extrait sessionId, message, tenant, etc.
   ↓
3. Get a row (Supabase) ← Nœud natif ✅
   Operation: get
   Table: n8n_conversations
   Filter: session_id = {{ $json.sessionId }}
   ↓
4. Préparer Contexte (Function)
   Combine données + mémoire
   ↓
5. Switch (sur type)
   ↓
6. OpenAI GPT
   System Prompt: {{ $json.systemPrompt }}
   User Message: {{ $json.userMessage }}
   ↓
7. Préparer Sauvegarde (Function)
   Formate les données pour Supabase
   ↓
8. Upsert row (Supabase) ← Nœud natif ✅ (À CONFIGURER)
   Operation: upsert
   Table: n8n_conversations
   Data: session_id, short_term_memory, etc.
   ↓
9. Respond to Webhook
   Body: {{ $json.choices[0].message.content }}
```

---

## 📝 Code du Nœud "Préparer Sauvegarde" (Avant Upsert)

**Ce nœud prépare les données au format attendu par Supabase :**

```javascript
// Récupérer les données
const context = $('Préparer Contexte').first().json;
const aiResponseRaw = $('OpenAI GPT').first().json;

// Extraire la réponse de l'IA
const aiResponse = aiResponseRaw.choices?.[0]?.message?.content ||
                   aiResponseRaw.text ||
                   'Pas de réponse';

const sessionId = context.sessionId;
const userMessage = context.userMessage;
const tenant = context.tenant;
const memory = context.memory;

// Current topic (simplifié)
const currentTopic = userMessage.substring(0, 100);

// Construire short-term memory
const existingContextWindow = memory?.short_term_memory?.context_window || [];
const shortTermMemory = {
  last_topic: currentTopic,
  last_user_message: userMessage,
  last_ai_response: aiResponse.substring(0, 500),
  preferences: memory?.short_term_memory?.preferences || {},
  context_window: [
    ...existingContextWindow.slice(-4), // Garder 4 derniers échanges
    {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    },
    {
      role: 'assistant',
      content: aiResponse.substring(0, 500),
      timestamp: new Date().toISOString()
    }
  ]
};

// Construire long-term memory (conserver existant + ajouter)
const longTermMemory = {
  ...(memory?.long_term_memory || {}),
  last_interaction: new Date().toISOString()
};

// Retourner au format attendu par Supabase
return [{
  json: {
    session_id: sessionId,
    tenant_id: tenant.id,
    conversation_id: sessionId, // Même valeur que session_id
    short_term_memory: shortTermMemory,
    long_term_memory: longTermMemory,
    message_count: (memory?.message_count || 0) + 1,
    aiResponse: aiResponse // Pour le nœud suivant (Respond)
  }
}];
```

---

## 🎯 Configuration Détaillée du Nœud Upsert

### Dans N8N :

1. **Ajoutez un nœud Supabase**
2. **Sélectionnez vos credentials** (Supabase N8Nagent)
3. **Operation** : `Upsert`
4. **Table** : `n8n_conversations`
5. **Fields to Send** : `Define Below`

### Champs à mapper :

| Field Name | Expression | Type |
|------------|-----------|------|
| `session_id` | `={{ $json.session_id }}` | String |
| `tenant_id` | `={{ $json.tenant_id }}` | UUID |
| `conversation_id` | `={{ $json.conversation_id }}` | String |
| `short_term_memory` | `={{ $json.short_term_memory }}` | JSON |
| `long_term_memory` | `={{ $json.long_term_memory }}` | JSON |
| `message_count` | `={{ $json.message_count }}` | Number |

### Options :

- **On Conflict** : `session_id` (colonne unique pour l'upsert)
- **Return Fields** : `All Fields` (optionnel)

---

## ✅ Avantages des Nœuds Natifs

### ❌ Avant (HTTP Request) :
```javascript
// Complexe, fragile
url: "https://supabase.../rest/v1/n8n_conversations"
headers: { apikey, Authorization, Prefer }
body: JSON.stringify({ ... })
// Gestion manuelle des erreurs
```

### ✅ Maintenant (Nœud Natif) :
```
Operation: Upsert
Table: n8n_conversations
Fields: { session_id, short_term_memory, ... }
// Tout est géré automatiquement !
```

**Avantages :**
- ✅ Plus simple à configurer
- ✅ Gestion automatique de l'authentification
- ✅ Validation des données
- ✅ Meilleure gestion des erreurs
- ✅ Upsert automatique (insert ou update)

---

## 🧪 Tester Après Configuration

```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test sauvegarde mémoire",
    "type": "text",
    "sessionId": "test-upsert-001",
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

Puis vérifiez dans Supabase :

```sql
SELECT
  session_id,
  message_count,
  short_term_memory->>'last_topic' as last_topic,
  created_at,
  updated_at
FROM n8n_conversations
WHERE session_id = 'test-upsert-001';
```

Vous devriez voir :
- `message_count = 1`
- `short_term_memory` avec les derniers échanges
- `updated_at` mis à jour

---

## 📋 Checklist de Migration

- [x] Nœud "Charger Mémoire" (Get) → Déjà en natif ✅
- [ ] Nœud "Sauvegarder Mémoire" (HTTP) → Remplacer par Upsert natif
- [ ] Configurer les champs du nœud Upsert
- [ ] Définir `onConflict` sur `session_id`
- [ ] Tester avec un curl
- [ ] Vérifier dans Supabase que les données sont sauvegardées

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Utiliser les nœuds natifs Supabase au lieu de HTTP Request
