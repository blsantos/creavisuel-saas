# 🔧 Code Corrigé - Nœud "Préparer Contexte"

## 📝 Code JavaScript Corrigé

Remplacez le code du nœud "Préparer Contexte" par celui-ci :

```javascript
// Récupérer les données d'entrée depuis le webhook
const webhookData = $('Chat Trigger').first()?.json || $input.first()?.json || {};

// Récupérer la mémoire depuis le nœud précédent (Charger Session Supabase)
const sessionData = $input.all();

// Extraire les données
const sessionId = webhookData.sessionId || webhookData.session_id || 'unknown-session';
const chatInput = webhookData.message || webhookData.chatInput || webhookData.input || '';
const tenant = webhookData.tenant || {};
const conversationHistory = webhookData.conversationHistory || [];

// Extraire la mémoire longue de Supabase
let memoireLongue = '';
if (sessionData && sessionData.length > 0) {
  const dbData = sessionData[0].json;

  if (Array.isArray(dbData) && dbData.length > 0) {
    // Si c'est un tableau (résultat de SELECT)
    const record = dbData[0];
    memoireLongue = record.memory_data || record.long_term_memory || '';

    // Si long_term_memory est un objet JSON
    if (typeof memoireLongue === 'object') {
      memoireLongue = JSON.stringify(memoireLongue, null, 2);
    }
  } else if (dbData.memory_data || dbData.long_term_memory) {
    // Si c'est un objet direct
    memoireLongue = dbData.memory_data || dbData.long_term_memory || '';
    if (typeof memoireLongue === 'object') {
      memoireLongue = JSON.stringify(memoireLongue, null, 2);
    }
  }
}

// Construire l'historique textuel
let historyText = '';
if (conversationHistory && conversationHistory.length > 0) {
  historyText = '\n📝 HISTORIQUE RÉCENT:\n';
  conversationHistory.forEach(msg => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    historyText += `${role}: ${msg.content}\n`;
  });
}

// Extraire la configuration IA du tenant
const aiConfig = tenant.aiConfig || {};
const systemPrompt = aiConfig.systemPrompt ||
  'Tu es un assistant IA serviable, créatif et professionnel spécialisé en création de contenu.';
const tone = aiConfig.tone || 'professionnel et créatif';
const model = aiConfig.model || 'gpt-4o-mini';

// Construire le contexte enrichi
let enrichedPrompt = systemPrompt;

if (memoireLongue) {
  enrichedPrompt += `\n\n💾 MÉMOIRE UTILISATEUR:\n${memoireLongue}`;
}

if (historyText) {
  enrichedPrompt += historyText;
}

enrichedPrompt += `\n\n🎯 STYLE DE RÉPONSE: ${tone}`;
enrichedPrompt += `\n\n👤 MESSAGE UTILISATEUR:\n${chatInput}`;

// Retourner les données formatées
return {
  json: {
    sessionId: sessionId,
    chatInput: chatInput,
    systemPrompt: enrichedPrompt,
    tone: tone,
    model: model,
    tenantId: tenant.id || 'unknown',
    tenantName: tenant.name || 'Unknown Tenant',
    tenantSlug: tenant.slug || 'unknown',
    memoireLongue: memoireLongue,
    historyText: historyText,
    // Données brutes pour debug
    _debug: {
      hasWebhookData: !!webhookData,
      hasSessionData: sessionData.length > 0,
      hasTenant: !!tenant,
      hasHistory: conversationHistory.length > 0
    }
  }
};
```

---

## 🔍 Explications des Corrections

### 1. **Récupération des données d'entrée**
**Avant :**
```javascript
const inputs = $('Chat-inputs1').first().json;
```

**Après :**
```javascript
const webhookData = $('Chat Trigger').first()?.json || $input.first()?.json || {};
```

**Pourquoi :**
- Utilise l'optional chaining (`?.`) pour éviter les erreurs si le nœud n'existe pas
- Fallback sur `$input.first()` si le nœud "Chat Trigger" n'est pas trouvé
- Fallback sur `{}` si aucune donnée n'est disponible

### 2. **Accès aux propriétés du tenant**
**Avant :**
```javascript
systemPrompt: inputs['tenant.aiConfig.systemPrompt']
```

**Après :**
```javascript
const aiConfig = tenant.aiConfig || {};
const systemPrompt = aiConfig.systemPrompt || 'Default prompt...';
```

**Pourquoi :**
- On ne peut pas accéder à des propriétés imbriquées avec `['tenant.aiConfig.systemPrompt']`
- Il faut d'abord extraire `tenant`, puis `aiConfig`, puis `systemPrompt`

### 3. **Gestion de la mémoire JSON**
**Avant :**
```javascript
memoireLongue = dbData[0].memory_data || '';
```

**Après :**
```javascript
memoireLongue = record.memory_data || record.long_term_memory || '';
if (typeof memoireLongue === 'object') {
  memoireLongue = JSON.stringify(memoireLongue, null, 2);
}
```

**Pourquoi :**
- La mémoire peut être stockée dans `memory_data` ou `long_term_memory`
- Si c'est un objet JSON, il faut le convertir en string pour l'afficher

### 4. **Construction du prompt enrichi**
**Nouveau :**
```javascript
let enrichedPrompt = systemPrompt;

if (memoireLongue) {
  enrichedPrompt += `\n\n💾 MÉMOIRE UTILISATEUR:\n${memoireLongue}`;
}

if (historyText) {
  enrichedPrompt += historyText;
}

enrichedPrompt += `\n\n🎯 STYLE DE RÉPONSE: ${tone}`;
enrichedPrompt += `\n\n👤 MESSAGE UTILISATEUR:\n${chatInput}`;
```

**Pourquoi :**
- Combine le system prompt, la mémoire, l'historique et le message utilisateur
- Format clair pour que l'IA comprenne le contexte

---

## 🧪 Tester le Nœud

Après avoir mis à jour le code :

1. **Testez le workflow manuellement** dans N8N
2. **Envoyez une requête test** :
   ```bash
   curl -X POST "https://auto.lecoach.digital/webhook/chat" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Test du contexte enrichi",
       "sessionId": "test-context-001",
       "conversationHistory": [
         {"role": "user", "content": "Bonjour"},
         {"role": "assistant", "content": "Bonjour ! Comment puis-je vous aider ?"}
       ],
       "tenant": {
         "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
         "name": "JeffTerra",
         "slug": "jeffterra",
         "aiConfig": {
           "systemPrompt": "Tu es un expert en design graphique",
           "tone": "professionnel et créatif",
           "model": "gpt-4o-mini"
         }
       }
     }'
   ```

3. **Vérifiez les données** dans l'exécution N8N :
   - Le nœud doit retourner un objet avec `systemPrompt`, `chatInput`, etc.
   - `_debug` doit montrer `true` pour les données présentes

---

## 📋 Si le Nœud s'appelle différemment

Si votre nœud d'entrée ne s'appelle pas "Chat Trigger", ajustez la ligne :

```javascript
// Remplacez "Chat Trigger" par le nom exact de votre nœud webhook
const webhookData = $('VOTRE_NOM_DE_NOEUD').first()?.json || $input.first()?.json || {};
```

Ou utilisez simplement :
```javascript
// Cette version fonctionne avec n'importe quel nœud précédent
const webhookData = $input.first()?.json || {};
```

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Corriger les erreurs de récupération de données dans le workflow N8N
