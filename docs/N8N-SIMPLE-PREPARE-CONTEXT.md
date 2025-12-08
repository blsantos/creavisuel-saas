# 🔧 Code Simple "Préparer Contexte" - Sans Boucle Infinie

## ⚡ Version Ultra-Simple (Fonctionne à Coup Sûr)

Remplacez TOUT le code du nœud "Préparer Contexte" par celui-ci :

```javascript
// ============================================
// VERSION SIMPLE - PAS DE BOUCLE INFINIE
// ============================================

// Récupérer les données d'entrée (du nœud précédent direct)
const items = $input.all();
const firstItem = items[0]?.json || {};

console.log('Input data:', JSON.stringify(firstItem, null, 2));

// Extraire les données de base
const sessionId = firstItem.sessionId || firstItem.session_id || 'default-session';
const chatInput = firstItem.message || firstItem.chatInput || firstItem.input || '';
const tenant = firstItem.tenant || {};
const conversationHistory = firstItem.conversationHistory || [];

// Vérifier si on a de la mémoire (peut être dans firstItem directement)
let memoireLongue = '';
let messageCount = 0;

if (firstItem.long_term_memory) {
  const mem = firstItem.long_term_memory;
  if (typeof mem === 'string') {
    memoireLongue = mem;
  } else if (typeof mem === 'object') {
    memoireLongue = JSON.stringify(mem, null, 2);
  }
  messageCount = firstItem.message_count || 0;
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

if (tenant.name) {
  finalPrompt += `\n\nEntreprise: ${tenant.name}`;
}

if (memoireLongue) {
  finalPrompt += `\n\nMémoire:\n${memoireLongue}`;
}

if (historyText) {
  finalPrompt += historyText;
}

finalPrompt += `\n\nStyle: ${tone}`;

// Retourner les données
return [{
  json: {
    sessionId: sessionId,
    chatInput: chatInput,
    systemPrompt: finalPrompt,
    userMessage: chatInput,
    tone: tone,
    model: model,
    tenantId: tenant.id || 'unknown',
    tenantName: tenant.name || 'Unknown',
    messageCount: messageCount
  }
}];
```

---

## 🎯 Ce Qui a Changé

### ❌ Avant (Problèmes) :
```javascript
const webhookData = $('Chat Trigger').first()?.json;  // Peut causer boucle
const supabaseNode = $('Get a row');  // Peut ne pas exister
```

### ✅ Maintenant (Simple) :
```javascript
const items = $input.all();  // Récupère directement l'entrée
const firstItem = items[0]?.json || {};  // Premier item ou objet vide
```

### Pourquoi ça fonctionne :
- ✅ **Pas de référence à d'autres nœuds** (`$('nom')`)
- ✅ **Lit directement l'entrée** (`$input`)
- ✅ **Fallbacks partout** (|| {}, || '', etc.)
- ✅ **Retourne TOUJOURS un résultat** (`return [{ json: {...} }]`)

---

## 🔧 Si Vous Devez Lire la Mémoire de Supabase

Si le nœud "Get a row" est **AVANT** "Préparer Contexte" dans le workflow, les données de Supabase sont déjà dans `firstItem`.

**Workflow :**
```
Chat Trigger → Extract Input → Get a row (Supabase) → Préparer Contexte
```

Le nœud "Préparer Contexte" reçoit les données combinées de "Get a row", donc :
- `firstItem.sessionId` = vient du webhook
- `firstItem.long_term_memory` = vient de Supabase (si trouvé)
- `firstItem.message_count` = vient de Supabase (si trouvé)

---

## 🚨 Si Ça Tourne Toujours en Boucle

1. **Stoppez le workflow** (bouton Stop dans N8N)
2. **Supprimez complètement le code** du nœud
3. **Collez le nouveau code** ci-dessus
4. **Sauvegardez**
5. **Testez** manuellement dans N8N (bouton "Execute Node")

---

## 🧪 Tester le Nœud

Dans N8N :
1. Cliquez sur le nœud "Préparer Contexte"
2. Cliquez sur **"Execute Node"**
3. Regardez le résultat (doit montrer `sessionId`, `chatInput`, `systemPrompt`, etc.)

Si le nœud ne s'exécute pas (tourne indéfiniment) :
- **C'est un problème de connexion** entre les nœuds
- Vérifiez que le nœud précédent est bien connecté

---

## 📋 Structure Minimale du Workflow

Pour que ça fonctionne, votre workflow DOIT ressembler à ça :

```
1. Chat Trigger (Webhook)
   Path: /chat
   ↓
2. Préparer Contexte (Function)
   Code: (celui ci-dessus)
   ↓
3. OpenAI GPT
   System Prompt: {{ $json.systemPrompt }}
   User Message: {{ $json.userMessage }}
   ↓
4. Respond to Webhook
   Body: {{ $json.choices[0].message.content }}
```

**Connectez les nœuds avec des flèches !** Sans connexion, les données ne passent pas.

---

## ⚡ Version ENCORE Plus Simple (Debug)

Si rien ne fonctionne, testez avec ce code minimal :

```javascript
return [{
  json: {
    sessionId: "test-123",
    chatInput: "Test message",
    systemPrompt: "Tu es un assistant IA",
    userMessage: "Test message",
    model: "gpt-4o-mini"
  }
}];
```

Si **même ça** ne marche pas, le problème n'est pas le code mais la **configuration du nœud** ou les **connexions**.

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Éliminer la boucle infinie dans "Préparer Contexte"
