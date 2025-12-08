# 🔧 Corriger le Nœud "Switch" - Classification du Type de Message

## 🚨 Problème

Le nœud "Switch1" essaie de lire `$('Chat-inputsOLD').item.json.type` mais ce nœud n'existe pas.

**Erreur :** Le workflow s'arrête au nœud Switch.

---

## ✅ Solution : Simplifier le Switch

Remplacez les références à `Chat-inputsOLD` par `$input` ou créez un nœud simple avant le Switch.

### Option 1 : Modifier le Switch Directement ⚡

**Dans chaque condition du nœud Switch, changez :**

#### Avant (❌ Ne fonctionne pas) :
```
={{ $('Chat-inputsOLD').item.json.type }}
```

#### Après (✅ Fonctionne) :
```
={{ $json.type }}
```

**OU si les données viennent d'un nœud précédent nommé autrement :**
```
={{ $input.item.json.type }}
```

---

### Configuration Complète du Switch

Voici comment configurer chaque condition :

#### **Condition 1 : Image**
- **Left Value :** `={{ $json.type }}`
- **Operator :** equals
- **Right Value :** `image`
- **Output Key :** `image`

#### **Condition 2 : Text**
- **Left Value :** `={{ $json.type }}`
- **Operator :** equals
- **Right Value :** `text`
- **Output Key :** `text`

#### **Condition 3 : Video**
- **Left Value :** `={{ $json.type }}`
- **Operator :** equals
- **Right Value :** `video`
- **Output Key :** `Video`

#### **Condition 4 : Audio**
- **Left Value :** `={{ $json.type }}`
- **Operator :** equals
- **Right Value :** `audio`
- **Output Key :** `audio`

#### **Condition 5 : PDF**
- **Left Value :** `={{ $json.type }}`
- **Operator :** equals
- **Right Value :** `pdf`
- **Output Key :** `PDF`

#### **Condition Fallback (Default) :**
- Ajoutez une condition "else" qui renvoie vers "text" par défaut

---

### Option 2 : Créer un Nœud "Extract Type" Avant le Switch 🎯

Si le `type` n'existe pas dans vos données, créez un nœud Function qui l'ajoute :

**Nœud : "Extract Type" (Function)**

**Position :** Juste **AVANT** le nœud Switch

**Code :**
```javascript
// Récupérer les données
const items = $input.all();
const data = items[0]?.json || {};

// Déterminer le type de message
let messageType = 'text'; // Par défaut

// Si un type est fourni, l'utiliser
if (data.type) {
  messageType = data.type.toLowerCase();
}
// Sinon, détecter basé sur le contenu
else if (data.message) {
  const msg = data.message.toLowerCase();

  // Détection simple basée sur des patterns
  if (msg.includes('image:') || msg.includes('📷')) {
    messageType = 'image';
  } else if (msg.includes('video:') || msg.includes('🎥')) {
    messageType = 'video';
  } else if (msg.includes('audio:') || msg.includes('🎤')) {
    messageType = 'audio';
  } else if (msg.includes('.pdf') || msg.includes('document:')) {
    messageType = 'pdf';
  }
}

// Retourner les données avec le type ajouté
return [{
  json: {
    ...data,
    type: messageType
  }
}];
```

**Puis modifiez le Switch pour lire** : `={{ $json.type }}`

---

### Option 3 : Supprimer le Switch (Plus Simple) 🚀

Si vous n'avez besoin que du flux "text" pour l'instant :

1. **Supprimez le nœud Switch**
2. **Connectez directement** le nœud précédent au nœud suivant
3. Le workflow sera plus simple et fonctionnera immédiatement

**Workflow simplifié :**
```
Chat Trigger
  ↓
Extract Input
  ↓
Get a row (Supabase)
  ↓
Préparer Contexte
  ↓
OpenAI GPT  ← Connecter directement ici (sans Switch)
  ↓
Save/Update row
  ↓
Respond to Webhook
```

Vous pourrez ajouter le Switch plus tard quand vous implémenterez les autres types (image, video, audio).

---

## 🎯 Recommandation

Pour **débloquer rapidement** :

### **Solution Immédiate : Supprimer le Switch**

1. Dans N8N, **supprimez le nœud "Switch1"**
2. **Connectez directement** "Préparer Contexte" → "OpenAI GPT"
3. Testez le workflow

### **Solution Future : Réimplémenter le Switch**

Quand vous aurez besoin de gérer différents types de messages :

1. Ajoutez un nœud "Extract Type" avant le Switch
2. Configurez le Switch avec `={{ $json.type }}`
3. Créez des branches spécifiques pour chaque type

---

## 📝 Mise à Jour du Frontend

Pour que le type soit correctement envoyé depuis le frontend, vérifiez que `useChatWithSupabase.ts` envoie :

```typescript
// Dans sendMessage
await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    type: 'text',  // ✅ Toujours inclure le type
    sessionId: conversationId,
    conversationHistory: recentMessages,
    tenant: {
      id: tenant?.id,
      slug: tenant?.slug,
      name: tenant?.name,
      aiConfig: { /* ... */ }
    }
  })
});
```

Et dans `handleSendMedia` :

```typescript
await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    message: mediaUrl,
    type: 'image', // ✅ Ou 'video', 'audio' selon le cas
    sessionId: conversationId,
    // ...
  })
});
```

---

## 🧪 Tester Après Correction

```bash
# Test avec type text
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour test",
    "type": "text",
    "sessionId": "test-type-001"
  }'

# Test avec type image (futur)
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "https://example.com/image.jpg",
    "type": "image",
    "sessionId": "test-type-002"
  }'
```

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Corriger le nœud Switch pour classifier les types de messages
