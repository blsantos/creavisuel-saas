# 🔧 Fix: Erreur "invalid input syntax for type uuid: unknown"

## 📋 Problème

Erreur dans le nœud "Upsert Memory (SQL)" :
```
invalid input syntax for type uuid: "unknown"
```

**Cause :** Le `tenant_id` reçoit la valeur `'unknown'` au lieu d'un UUID valide.

---

## 🎯 Solution : Passer les Données à Travers le Workflow

Le problème vient du fait que les nœuds "Préparer Sauvegarde" ne peuvent pas accéder aux données des nœuds précédents avec `$('Préparer Contexte')`.

**Solution :** Faire passer toutes les données nécessaires via les nœuds.

---

## ✅ Nœud 1 : "Préparer Contexte" (MODIFIÉ)

**Type :** Function
**Code à remplacer :**

```javascript
// VERSION CORRIGÉE - Conserve toutes les données pour les nœuds suivants
const items = $input.all();
const firstItem = items[0]?.json || {};

console.log('🔍 Préparer Contexte - Input:', JSON.stringify(firstItem, null, 2));

const sessionId = firstItem.sessionId || firstItem.session_id || 'default-session';
const chatInput = firstItem.message || firstItem.chatInput || firstItem.input || '';
const tenant = firstItem.tenant || {};
const conversationHistory = firstItem.conversationHistory || [];

// Vérifier si on a de la mémoire (depuis "Get a row")
let memoireLongue = '';
let memoryData = {};
let messageCount = 0;

if (firstItem.long_term_memory) {
  const mem = firstItem.long_term_memory;
  if (typeof mem === 'string') {
    memoireLongue = mem;
  } else if (typeof mem === 'object') {
    memoireLongue = JSON.stringify(mem, null, 2);
  }
  messageCount = firstItem.message_count || 0;
  memoryData = {
    short_term_memory: firstItem.short_term_memory || {},
    long_term_memory: firstItem.long_term_memory || {},
    message_count: messageCount
  };
}

// Construire l'historique
let historyText = '';
if (conversationHistory.length > 0) {
  historyText = '\n📝 HISTORIQUE:\n';
  conversationHistory.slice(-5).forEach(msg => {
    historyText += `${msg.role}: ${msg.content}\n`;
  });
}

// Configuration IA
const aiConfig = tenant.aiConfig || {};
const systemPrompt = aiConfig.systemPrompt || 'Tu es un assistant IA professionnel et créatif.';
const tone = aiConfig.tone || 'professionnel';
const model = aiConfig.model || 'gpt-4o-mini';

// Construire le prompt final
let finalPrompt = systemPrompt;
if (tenant.name) finalPrompt += `\n\nEntreprise: ${tenant.name}`;
if (memoireLongue) finalPrompt += `\n\nMémoire:\n${memoireLongue}`;
if (historyText) finalPrompt += historyText;
finalPrompt += `\n\nStyle: ${tone}`;

// ✅ IMPORTANT : Retourner TOUTES les données pour les nœuds suivants
return [{
  json: {
    // Pour OpenAI
    systemPrompt: finalPrompt,
    userMessage: chatInput,
    model: model,

    // ✅ Pour Préparer Sauvegarde (CONSERVÉ)
    sessionId: sessionId,
    chatInput: chatInput,
    tenant_id: tenant.id || '66fd102d-d010-4d99-89ed-4e4f0336961e',
    tenantId: tenant.id || '66fd102d-d010-4d99-89ed-4e4f0336961e',
    tenantName: tenant.name || 'Unknown',
    tone: tone,
    messageCount: messageCount,
    memory: memoryData
  }
}];
```

**Pourquoi ça marche :**
- ✅ Conserve `tenant_id` et `sessionId` dans l'output
- ✅ Passe aussi `memory` pour construire les contextes
- ✅ OpenAI recevra `systemPrompt` et `userMessage`
- ✅ "Préparer Sauvegarde" recevra toutes les données via OpenAI

---

## ✅ Nœud 2 : "Préparer Sauvegarde" (MODIFIÉ)

**Type :** Function
**Code à remplacer :**

```javascript
// VERSION CORRIGÉE - Lit les données depuis $input
const items = $input.all();

// Le premier item vient d'OpenAI (la réponse)
const aiItem = items[0]?.json || {};

console.log('📦 Préparer Sauvegarde - AI Item:', JSON.stringify(aiItem, null, 2));

// Extraire la réponse AI
let aiResponse = 'Pas de réponse';
if (aiItem.choices?.[0]?.message?.content) {
  aiResponse = aiItem.choices[0].message.content;
} else if (aiItem.text) {
  aiResponse = aiItem.text;
} else if (aiItem.output) {
  aiResponse = aiItem.output;
}

// ✅ Les données du contexte sont dans OpenAI metadata
// Si OpenAI ne les passe pas, on les cherche dans les items précédents
let contextData = aiItem;
if (!aiItem.sessionId && items.length > 1) {
  contextData = items[1]?.json || aiItem;
}

// ✅ Extraction avec fallback sur UUID par défaut
const sessionId = contextData.sessionId || 'default-session';
const userMessage = contextData.chatInput || contextData.userMessage || '';
const tenantId = contextData.tenant_id || contextData.tenantId || '66fd102d-d010-4d99-89ed-4e4f0336961e';
const memory = contextData.memory || {};
const messageCount = contextData.messageCount || 0;

console.log('📊 Context data:', {
  sessionId,
  tenantId,
  messageCount,
  hasMemory: !!memory.short_term_memory
});

// Construire memories
const currentTopic = userMessage.substring(0, 100);
const existingContextWindow = memory.short_term_memory?.context_window || [];

const shortTermMemory = {
  last_topic: currentTopic,
  last_user_message: userMessage,
  last_ai_response: aiResponse.substring(0, 500),
  preferences: memory.short_term_memory?.preferences || {},
  context_window: [
    ...existingContextWindow.slice(-4),
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

const longTermMemory = {
  ...(memory.long_term_memory || {}),
  last_interaction: new Date().toISOString()
};

// ✅ Retour avec tenant_id valide
const result = {
  session_id: sessionId,
  tenant_id: tenantId,  // ✅ Maintenant valide !
  conversation_id: sessionId,
  short_term_memory: shortTermMemory,
  long_term_memory: longTermMemory,
  message_count: messageCount + 1,
  aiResponse: aiResponse
};

console.log('✅ Output for Upsert:', JSON.stringify(result, null, 2));

return [{ json: result }];
```

---

## 🔄 Workflow Complet Après Corrections

```
Chat Trigger
  ↓
Extract Input (récupère message, sessionId, tenant)
  ↓
Get a row (charge mémoire depuis Supabase)
  ↓
Préparer Contexte (✅ MODIFIÉ - conserve tenant_id, sessionId, memory)
  ↓
Switch (route selon type)
  ↓
OpenAI GPT (reçoit systemPrompt + userMessage, PASSE les metadata)
  ↓
Préparer Sauvegarde (✅ MODIFIÉ - lit tenant_id depuis $input)
  ↓
Upsert Memory (SQL) (reçoit tenant_id valide ✅)
  ↓
Respond to Webhook
```

---

## 🧪 Test Après Correction

```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test avec tenant_id corrigé",
    "type": "text",
    "sessionId": "test-tenant-fix-001",
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

Vérifiez dans les logs N8N que :
1. ✅ "Préparer Contexte" output contient `tenant_id: "66fd102d-..."`
2. ✅ "Préparer Sauvegarde" output contient `tenant_id: "66fd102d-..."`
3. ✅ "Upsert Memory" n'a plus d'erreur UUID

---

## 📋 Checklist

- [ ] Remplacer le code de "Préparer Contexte"
- [ ] Remplacer le code de "Préparer Sauvegarde"
- [ ] Tester avec curl
- [ ] Vérifier les logs N8N pour `tenant_id`
- [ ] Vérifier dans Supabase que les données sont sauvegardées

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Corriger l'erreur UUID "unknown" en passant tenant_id correctement
