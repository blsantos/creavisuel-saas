# 🔧 Gérer les Sessions Vides dans N8N

## 🚨 Problème

Le nœud "Charger Session Supabase" retourne vide car :
- C'est une **nouvelle session** (première interaction)
- Aucune donnée n'existe encore dans `n8n_conversations` pour ce `sessionId`

C'est **NORMAL** ! Le workflow doit gérer ce cas.

---

## ✅ Solution : Modifier le Code "Préparer Contexte"

Le code doit gérer le cas où `sessionData` est vide ou retourne un tableau vide.

### Code JavaScript Corrigé - Version Robuste

```javascript
// ============================================
// RÉCUPÉRATION DES DONNÉES D'ENTRÉE
// ============================================

// Récupérer les données du webhook (entrée principale)
const webhookData = $input.first()?.json || {};

// Récupérer la mémoire depuis le nœud précédent (peut être vide!)
const memoryNode = $input.all();
let sessionFromDB = null;

// Vérifier si des données existent
if (memoryNode && memoryNode.length > 0) {
  const dbResult = memoryNode[0].json;

  // Si c'est un tableau (SELECT avec résultats)
  if (Array.isArray(dbResult) && dbResult.length > 0) {
    sessionFromDB = dbResult[0];
  }
  // Si c'est un objet direct
  else if (dbResult && typeof dbResult === 'object' && !Array.isArray(dbResult)) {
    sessionFromDB = dbResult;
  }
}

// ============================================
// EXTRACTION DES DONNÉES
// ============================================

const sessionId = webhookData.sessionId || webhookData.session_id || `session-${Date.now()}`;
const chatInput = webhookData.message || webhookData.chatInput || webhookData.input || '';
const tenant = webhookData.tenant || {};
const conversationHistory = webhookData.conversationHistory || [];

// ============================================
// MÉMOIRE LONG-TERME (peut être vide)
// ============================================

let memoireLongue = '';
let shortTermMemory = {};
let messageCount = 0;

if (sessionFromDB) {
  // Extraire la mémoire long-terme
  const longTermData = sessionFromDB.long_term_memory || sessionFromDB.memory_data;

  if (longTermData) {
    if (typeof longTermData === 'string') {
      memoireLongue = longTermData;
    } else if (typeof longTermData === 'object') {
      // Formater l'objet JSON en texte lisible
      const userContext = longTermData.user_context || '';
      const keyFacts = longTermData.key_facts || [];
      const instructions = longTermData.important_instructions || [];

      if (userContext) {
        memoireLongue += `📋 Contexte utilisateur: ${userContext}\n`;
      }
      if (keyFacts.length > 0) {
        memoireLongue += `\n✨ Faits importants:\n${keyFacts.map(f => `  • ${f}`).join('\n')}\n`;
      }
      if (instructions.length > 0) {
        memoireLongue += `\n⚠️ Instructions importantes:\n${instructions.map(i => `  • ${i}`).join('\n')}\n`;
      }

      // Si rien n'a été extrait, convertir tout l'objet
      if (!memoireLongue) {
        memoireLongue = JSON.stringify(longTermData, null, 2);
      }
    }
  }

  // Extraire la mémoire court-terme
  shortTermMemory = sessionFromDB.short_term_memory || {};
  messageCount = sessionFromDB.message_count || 0;
}

// ============================================
// HISTORIQUE RÉCENT
// ============================================

let historyText = '';
if (conversationHistory && conversationHistory.length > 0) {
  historyText = '\n📝 HISTORIQUE RÉCENT:\n';
  conversationHistory.slice(-5).forEach(msg => { // Garder les 5 derniers
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    historyText += `${role}: ${msg.content}\n`;
  });
}

// ============================================
// CONFIGURATION IA DU TENANT
// ============================================

const aiConfig = tenant.aiConfig || {};
const systemPrompt = aiConfig.systemPrompt ||
  'Tu es un assistant IA serviable, créatif et professionnel.';
const tone = aiConfig.tone || 'professionnel';
const model = aiConfig.model || 'gpt-4o-mini';

// ============================================
// CONSTRUCTION DU PROMPT ENRICHI
// ============================================

let enrichedPrompt = systemPrompt;

// Ajouter le contexte du tenant
if (tenant.name) {
  enrichedPrompt += `\n\n🏢 ENTREPRISE: ${tenant.name}`;
}

// Ajouter la mémoire long-terme (si existe)
if (memoireLongue) {
  enrichedPrompt += `\n\n💾 MÉMOIRE UTILISATEUR:\n${memoireLongue}`;
}

// Ajouter l'historique (si existe)
if (historyText) {
  enrichedPrompt += historyText;
}

// Ajouter le style attendu
enrichedPrompt += `\n\n🎯 STYLE DE RÉPONSE: ${tone}`;

// Ajouter des instructions si c'est une nouvelle session
if (messageCount === 0) {
  enrichedPrompt += `\n\n✨ NOUVELLE CONVERSATION: C'est la première interaction avec cet utilisateur. Sois accueillant et cherche à comprendre ses besoins.`;
} else {
  enrichedPrompt += `\n\n💬 CONVERSATION EN COURS: ${messageCount} messages échangés. Continue la conversation de manière cohérente.`;
}

// ============================================
// RETOUR DES DONNÉES
// ============================================

return {
  json: {
    // Données principales pour OpenAI
    sessionId: sessionId,
    chatInput: chatInput,
    systemPrompt: enrichedPrompt,
    userMessage: chatInput,

    // Configuration
    tone: tone,
    model: model,

    // Informations tenant
    tenantId: tenant.id || 'unknown',
    tenantName: tenant.name || 'Unknown Tenant',
    tenantSlug: tenant.slug || 'unknown',

    // Mémoire
    memoireLongue: memoireLongue,
    shortTermMemory: shortTermMemory,
    historyText: historyText,
    messageCount: messageCount,
    isNewSession: messageCount === 0,

    // Debug
    _debug: {
      hasWebhookData: Object.keys(webhookData).length > 0,
      hasSessionFromDB: !!sessionFromDB,
      hasTenant: Object.keys(tenant).length > 0,
      hasHistory: conversationHistory.length > 0,
      hasMemoireLongue: !!memoireLongue,
      sessionId: sessionId
    }
  }
};
```

---

## 🎯 Points Clés de Ce Code

### 1. **Gestion des Sessions Vides**
```javascript
if (sessionFromDB) {
  // Charger la mémoire
} else {
  // Pas de mémoire = nouvelle session (OK!)
}
```

### 2. **Extraction Robuste de la Mémoire**
```javascript
// Vérifie si c'est un tableau
if (Array.isArray(dbResult) && dbResult.length > 0) {
  sessionFromDB = dbResult[0];
}
// Ou un objet direct
else if (dbResult && typeof dbResult === 'object') {
  sessionFromDB = dbResult;
}
```

### 3. **Formatage de la Mémoire JSON**
```javascript
const userContext = longTermData.user_context || '';
const keyFacts = longTermData.key_facts || [];
// Formate proprement au lieu de JSON.stringify brut
```

### 4. **Indication de Nouvelle Session**
```javascript
if (messageCount === 0) {
  enrichedPrompt += '\n\n✨ NOUVELLE CONVERSATION: ...';
}
```

### 5. **Debug Complet**
```javascript
_debug: {
  hasSessionFromDB: !!sessionFromDB,
  isNewSession: messageCount === 0,
  // ...
}
```

---

## 🧪 Tester avec une Nouvelle Session

```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, je suis un nouveau client",
    "sessionId": "nouvelle-session-'$(date +%s)'",
    "tenant": {
      "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
      "name": "JeffTerra",
      "slug": "jeffterra",
      "aiConfig": {
        "systemPrompt": "Tu es un assistant IA créatif",
        "tone": "professionnel",
        "model": "gpt-4o-mini"
      }
    }
  }'
```

**Résultat attendu :**
- Le workflow fonctionne même sans mémoire existante
- L'IA reçoit : `✨ NOUVELLE CONVERSATION: C'est la première interaction...`
- La mémoire sera créée automatiquement après cette première interaction

---

## 📊 Vérifier la Mémoire Après Interaction

Après avoir testé, vérifiez que la mémoire a été sauvegardée :

```sql
SELECT
  session_id,
  tenant_id,
  message_count,
  short_term_memory,
  long_term_memory,
  created_at
FROM public.n8n_conversations
ORDER BY created_at DESC
LIMIT 5;
```

Vous devriez voir :
- Une nouvelle ligne avec votre `sessionId`
- `message_count = 1`
- `short_term_memory` contenant le dernier échange

---

## ✅ Checklist Finale

- [ ] Code "Préparer Contexte" mis à jour avec la version robuste
- [ ] Workflow testé avec une nouvelle session (sans mémoire)
- [ ] Workflow testé avec une session existante (avec mémoire)
- [ ] Vérification dans Supabase que la mémoire est bien sauvegardée

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Gérer correctement les sessions vides (nouvelles conversations)
