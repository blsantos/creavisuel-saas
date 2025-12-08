# 🧠 Nœud N8N - Gestion Mémoire Conversationnelle

## 📋 Vue d'ensemble

Ce nœud HTTP permet à votre workflow N8N de charger et sauvegarder la mémoire conversationnelle depuis Supabase (`n8n_conversations`).

---

## 🎯 Objectif

**Maintenir une mémoire efficace pour :**
- ✅ Suivre les consignes spécifiques de chaque client
- ✅ Mémoriser les préférences et contexte utilisateur
- ✅ Assurer une conversation fluide et cohérente
- ✅ Différencier les besoins spécifiques de chaque tenant

---

## 🔧 Configuration du Nœud HTTP

### Nœud 1 : Charger la Mémoire (GET)

**Type :** HTTP Request
**Nom :** `Charger Mémoire Conversation`
**Méthode :** GET

#### URL :
```
https://supabase.lecoach.digital/rest/v1/n8n_conversations?session_id=eq.{{$json.sessionId}}&order=created_at.desc&limit=1
```

#### Headers :
```json
{
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc",
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}
```

#### Options :
- **Response Format :** JSON
- **Ignore SSL Issues :** No
- **Timeout :** 10000

#### Ce que ça retourne :
```json
[
  {
    "id": "uuid-123...",
    "session_id": "conversation-abc123",
    "tenant_id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
    "short_term_memory": {
      "last_topic": "génération d'images",
      "user_name": "Bruno",
      "preferences": {
        "style": "moderne",
        "tone": "professionnel"
      }
    },
    "long_term_memory": {
      "user_context": "Designer freelance, utilise MSP, préfère les visuels épurés",
      "key_facts": [
        "Travaille principalement sur des projets pour PME",
        "Utilise souvent des templates minimalistes"
      ],
      "important_instructions": [
        "Toujours suggérer des visuels haute résolution",
        "Préférer des palettes de couleurs sobres"
      ]
    },
    "message_count": 15,
    "created_at": "2025-12-08T10:30:00Z",
    "updated_at": "2025-12-08T11:45:00Z"
  }
]
```

---

### Nœud 2 : Sauvegarder la Mémoire (POST/PATCH)

**Type :** HTTP Request
**Nom :** `Sauvegarder Mémoire Conversation`
**Méthode :** POST (pour créer) ou PATCH (pour mettre à jour)

#### URL (POST - Créer nouvelle entrée) :
```
https://supabase.lecoach.digital/rest/v1/n8n_conversations
```

#### URL (PATCH - Mettre à jour existante) :
```
https://supabase.lecoach.digital/rest/v1/n8n_conversations?session_id=eq.{{$json.sessionId}}
```

#### Headers :
```json
{
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc",
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}
```

#### Body (JSON) :
```json
{
  "session_id": "{{$json.sessionId}}",
  "tenant_id": "{{$json.tenant.id}}",
  "short_term_memory": {
    "last_topic": "{{$json.currentTopic}}",
    "last_user_message": "{{$json.message}}",
    "last_ai_response": "{{$json.aiResponse}}",
    "context_window": [
      {
        "role": "user",
        "content": "{{$json.message}}",
        "timestamp": "{{$now}}"
      },
      {
        "role": "assistant",
        "content": "{{$json.aiResponse}}",
        "timestamp": "{{$now}}"
      }
    ]
  },
  "long_term_memory": {
    "user_context": "{{$json.longTermContext}}",
    "key_facts": "{{$json.keyFacts}}",
    "important_instructions": "{{$json.instructions}}"
  },
  "message_count": "={{$json.messageCount + 1}}"
}
```

---

## 🔄 Workflow Complet avec Mémoire

Voici comment intégrer la mémoire dans votre workflow existant :

### Ordre des Nœuds :

1. **Chat Trigger** → Reçoit le webhook
2. **Extract Input** → Extrait sessionId, message, tenant
3. **🧠 Charger Mémoire** → GET depuis `n8n_conversations`
4. **Préparer Contexte Enrichi** → Combine :
   - Historique récent (10 derniers messages du payload)
   - Short-term memory (dernière session)
   - Long-term memory (faits importants)
   - Configuration tenant (system prompt, tone)
5. **OpenAI GPT** → Génère la réponse avec contexte complet
6. **🧠 Sauvegarder Mémoire** → POST/PATCH vers `n8n_conversations`
7. **Respond to Webhook** → Retourne la réponse

---

## 📝 Code Function Node - Préparer Contexte Enrichi

```javascript
// Récupérer les données
const sessionId = $input.first().json.sessionId;
const userMessage = $input.first().json.message;
const conversationHistory = $input.first().json.conversationHistory || [];
const tenant = $input.first().json.tenant;

// Charger la mémoire (depuis le nœud HTTP précédent)
const memoryNode = $('Charger Mémoire Conversation').first().json;
const memory = memoryNode.length > 0 ? memoryNode[0] : null;

// Short-term memory (contexte immédiat)
const shortTermMemory = memory?.short_term_memory || {};
const lastTopic = shortTermMemory.last_topic || 'Nouveau sujet';
const userPreferences = shortTermMemory.preferences || {};

// Long-term memory (connaissances persistantes)
const longTermMemory = memory?.long_term_memory || {};
const userContext = longTermMemory.user_context || '';
const keyFacts = longTermMemory.key_facts || [];
const importantInstructions = longTermMemory.important_instructions || [];

// Construire le contexte enrichi
let enrichedContext = `# Contexte Utilisateur

**Tenant:** ${tenant.name} (${tenant.slug})
**Session ID:** ${sessionId}
**Nombre de messages:** ${memory?.message_count || 0}

## Mémoire à Court Terme (Session actuelle)
- **Dernier sujet discuté:** ${lastTopic}
- **Préférences:** ${JSON.stringify(userPreferences)}

## Mémoire à Long Terme (Connaissances persistantes)
${userContext ? `**Contexte utilisateur:** ${userContext}\n` : ''}
${keyFacts.length > 0 ? `**Faits importants:**\n${keyFacts.map(f => `- ${f}`).join('\n')}\n` : ''}
${importantInstructions.length > 0 ? `**Instructions importantes:**\n${importantInstructions.map(i => `- ${i}`).join('\n')}\n` : ''}

## Historique Récent (10 derniers messages)
${conversationHistory.map(m => `**${m.role}:** ${m.content}`).join('\n')}

## Configuration IA Tenant
**System Prompt:** ${tenant.aiConfig.systemPrompt}
**Tone:** ${tenant.aiConfig.tone}
**Model:** ${tenant.aiConfig.model}
`;

// Construire le prompt final pour OpenAI
const systemPrompt = `${tenant.aiConfig.systemPrompt}

${enrichedContext}

**INSTRUCTIONS IMPORTANTES:**
${importantInstructions.length > 0 ? importantInstructions.map(i => `- ${i}`).join('\n') : '- Aucune instruction spécifique'}

Réponds de manière ${tenant.aiConfig.tone} et cohérente avec le contexte ci-dessus.
`;

return {
  json: {
    sessionId,
    userMessage,
    systemPrompt,
    enrichedContext,
    memory: memory || null,
    tenant
  }
};
```

---

## 📝 Code Function Node - Sauvegarder Mémoire

```javascript
// Récupérer les données
const sessionId = $input.first().json.sessionId;
const userMessage = $input.first().json.userMessage;
const aiResponse = $('OpenAI GPT').first().json.choices[0].message.content;
const tenant = $input.first().json.tenant;
const memory = $input.first().json.memory;

// Extraire le sujet actuel du message utilisateur
const currentTopic = userMessage.substring(0, 100); // Simplification

// Mettre à jour short-term memory
const shortTermMemory = {
  last_topic: currentTopic,
  last_user_message: userMessage,
  last_ai_response: aiResponse.substring(0, 500), // Limiter la taille
  context_window: [
    ...(memory?.short_term_memory?.context_window || []).slice(-4), // Garder 4 derniers échanges
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

// Long-term memory (conserver ce qui existe + ajouter si nécessaire)
const longTermMemory = {
  ...(memory?.long_term_memory || {}),
  last_interaction: new Date().toISOString()
};

return {
  json: {
    session_id: sessionId,
    tenant_id: tenant.id,
    short_term_memory: shortTermMemory,
    long_term_memory: longTermMemory,
    message_count: (memory?.message_count || 0) + 1
  }
};
```

---

## 🎯 Avantages de cette Architecture

### 1. **Mémoire à Court Terme (Short-term)**
- Garde le contexte immédiat de la conversation
- Se réinitialise à chaque nouvelle session
- Contient les 5-10 derniers échanges

### 2. **Mémoire à Long Terme (Long-term)**
- Persiste entre les sessions
- Stocke les préférences utilisateur
- Garde les instructions importantes
- Mémorise le contexte global du client

### 3. **Multi-tenant Efficace**
- Chaque tenant a sa propre configuration
- Isolation des données par `tenant_id`
- System prompt personnalisé par client

### 4. **Évolutif**
- Facile d'ajouter de nouveaux champs
- Structure JSON flexible
- Peut être enrichi avec RAG plus tard

---

## 🔒 Sécurité RLS

Assurez-vous que la table `n8n_conversations` a les bonnes policies RLS :

```sql
-- Permettre la lecture/écriture par tenant_id
CREATE POLICY "Tenants can manage their conversations"
ON n8n_conversations
FOR ALL
USING (tenant_id::text = auth.jwt() ->> 'tenant_id')
WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- OU pour service role (depuis N8N)
ALTER TABLE n8n_conversations ENABLE ROW LEVEL SECURITY;

-- Policy pour anon/service role
CREATE POLICY "Allow service role access"
ON n8n_conversations
FOR ALL
TO anon, service_role
USING (true)
WITH CHECK (true);
```

---

## 📊 Structure Table `n8n_conversations`

```sql
CREATE TABLE IF NOT EXISTS n8n_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  short_term_memory JSONB DEFAULT '{}'::jsonb,
  long_term_memory JSONB DEFAULT '{}'::jsonb,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Index pour performance
CREATE INDEX idx_n8n_conversations_session ON n8n_conversations(session_id);
CREATE INDEX idx_n8n_conversations_tenant ON n8n_conversations(tenant_id);
```

---

## 🧪 Test du Nœud

### Test en cURL :

#### Charger mémoire :
```bash
curl -X GET \
  "https://supabase.lecoach.digital/rest/v1/n8n_conversations?session_id=eq.test-session-123" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc"
```

#### Sauvegarder mémoire :
```bash
curl -X POST \
  "https://supabase.lecoach.digital/rest/v1/n8n_conversations" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "session_id": "test-session-123",
    "tenant_id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
    "short_term_memory": {
      "last_topic": "test",
      "last_user_message": "Bonjour"
    },
    "long_term_memory": {
      "user_context": "Test user"
    },
    "message_count": 1
  }'
```

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Mémoire conversationnelle efficace pour agents IA multi-tenant
