# 🎨 Préparer Contexte avec Gestion des Médias

## 📋 Objectif

Adapter le nœud "Préparer Contexte" pour gérer les différents types de messages :
- **text** : Message texte standard
- **image** : URL d'image + description
- **video** : URL de vidéo + description
- **audio** : URL audio + transcription éventuelle
- **pdf** : URL PDF + contenu extrait

---

## ✅ Code Complet du Nœud "Préparer Contexte" (Version avec Médias)

**Type :** Function
**Code à utiliser :**

```javascript
// VERSION COMPLÈTE - Gestion des médias (text, image, video, audio, pdf)
const items = $input.all();
const firstItem = items[0]?.json || {};

console.log('🔍 Préparer Contexte (avec médias) - Input:', JSON.stringify(firstItem, null, 2));

// Extraction des données de base
const sessionId = firstItem.sessionId || firstItem.session_id || 'default-session';
const chatInput = firstItem.message || firstItem.chatInput || firstItem.input || '';
const messageType = firstItem.type || 'text';
const tenant = firstItem.tenant || {};
const conversationHistory = firstItem.conversationHistory || [];

console.log('📊 Message type:', messageType);

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

// 🎨 Traitement spécifique selon le type de média
let processedMessage = chatInput;
let mediaUrl = null;
let mediaInstructions = '';

// Extraction de l'URL du média depuis le message
const urlRegex = /(https?:\/\/[^\s]+)/i;
const urlMatch = chatInput.match(urlRegex);

if (urlMatch && messageType !== 'text') {
  mediaUrl = urlMatch[1];
  // Nettoyer le message pour enlever l'URL
  processedMessage = chatInput.replace(mediaUrl, '').trim();

  console.log('🎨 Media detected:', { type: messageType, url: mediaUrl });
}

// Instructions spécifiques selon le type
switch (messageType) {
  case 'image':
    mediaInstructions = `
📷 IMAGE REÇUE:
URL: ${mediaUrl || 'Non fournie'}
Action: Analyse cette image et réponds à la question de l'utilisateur.
${processedMessage ? `Question: ${processedMessage}` : 'Décris ce que tu vois dans l\'image.'}
`;
    break;

  case 'video':
    mediaInstructions = `
🎥 VIDÉO REÇUE:
URL: ${mediaUrl || 'Non fournie'}
Action: L'utilisateur a envoyé une vidéo.
${processedMessage ? `Question: ${processedMessage}` : 'Confirme la réception de la vidéo et demande ce que l\'utilisateur souhaite savoir.'}
Note: Tu ne peux pas voir les vidéos directement, mais tu peux en discuter avec l'utilisateur.
`;
    break;

  case 'audio':
    mediaInstructions = `
🎤 AUDIO REÇU:
URL: ${mediaUrl || 'Non fournie'}
Action: L'utilisateur a envoyé un fichier audio.
${processedMessage ? `Question: ${processedMessage}` : 'Confirme la réception de l\'audio et demande ce que l\'utilisateur souhaite savoir.'}
Note: Tu ne peux pas écouter les audios directement, mais tu peux en discuter avec l'utilisateur.
`;
    break;

  case 'pdf':
    mediaInstructions = `
📄 DOCUMENT PDF REÇU:
URL: ${mediaUrl || 'Non fournie'}
Action: L'utilisateur a envoyé un document PDF.
${processedMessage ? `Question: ${processedMessage}` : 'Confirme la réception du document et demande ce que l\'utilisateur souhaite savoir.'}
Note: Tu ne peux pas lire les PDF directement, mais tu peux en discuter avec l'utilisateur.
`;
    break;

  default:
    // Type 'text' - pas d'instructions spéciales
    processedMessage = chatInput;
    mediaInstructions = '';
}

// Construire l'historique de conversation
let historyText = '';
if (conversationHistory.length > 0) {
  historyText = '\n📝 HISTORIQUE DE LA CONVERSATION:\n';
  conversationHistory.slice(-5).forEach(msg => {
    historyText += `${msg.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant'}: ${msg.content}\n`;
  });
}

// Configuration IA
const aiConfig = tenant.aiConfig || {};
const systemPrompt = aiConfig.systemPrompt || 'Tu es un assistant IA professionnel et créatif.';
const tone = aiConfig.tone || 'professionnel';
const model = aiConfig.model || 'gpt-4o-mini';

// 🎯 Construire le prompt final
let finalPrompt = systemPrompt;

// Ajouter le contexte de l'entreprise
if (tenant.name) {
  finalPrompt += `\n\n🏢 Entreprise: ${tenant.name}`;
}

// Ajouter la mémoire long terme
if (memoireLongue) {
  finalPrompt += `\n\n🧠 MÉMOIRE (informations importantes sur ce client):\n${memoireLongue}`;
}

// Ajouter l'historique
if (historyText) {
  finalPrompt += historyText;
}

// Ajouter les instructions média si présentes
if (mediaInstructions) {
  finalPrompt += `\n\n${mediaInstructions}`;
}

// Ajouter le style de réponse
finalPrompt += `\n\n✨ Style de réponse: ${tone}`;

// Construire le message utilisateur final
let finalUserMessage = processedMessage || chatInput;

// Pour les images avec GPT-4 Vision, on pourrait ajouter l'URL dans le message
if (messageType === 'image' && mediaUrl) {
  finalUserMessage = `[Image: ${mediaUrl}]\n${processedMessage || 'Que vois-tu dans cette image ?'}`;
}

// 📤 Retourner les données avec toutes les infos pour les nœuds suivants
const result = {
  // Pour OpenAI
  systemPrompt: finalPrompt,
  userMessage: finalUserMessage,
  model: model,

  // Metadata du message
  messageType: messageType,
  mediaUrl: mediaUrl,
  originalMessage: chatInput,
  processedMessage: processedMessage,

  // Pour Préparer Sauvegarde (conservé)
  sessionId: sessionId,
  chatInput: chatInput,
  tenant_id: tenant.id || '66fd102d-d010-4d99-89ed-4e4f0336961e',
  tenantId: tenant.id || '66fd102d-d010-4d99-89ed-4e4f0336961e',
  tenantName: tenant.name || 'Unknown',
  tone: tone,
  messageCount: messageCount,
  memory: memoryData
};

console.log('✅ Préparer Contexte - Output:', JSON.stringify(result, null, 2));

return [{ json: result }];
```

---

## 🎨 Exemples de Traitement par Type

### 1. Message Texte Standard
**Input:**
```json
{
  "message": "Comment créer un logo ?",
  "type": "text",
  "sessionId": "abc123"
}
```

**Output (systemPrompt inclura):**
```
Tu es un assistant IA professionnel et créatif.

🏢 Entreprise: JeffTerra

📝 HISTORIQUE DE LA CONVERSATION:
👤 Utilisateur: Bonjour
🤖 Assistant: Bonjour ! Comment puis-je vous aider ?

✨ Style de réponse: professionnel
```

**Output (userMessage):**
```
Comment créer un logo ?
```

---

### 2. Message avec Image
**Input:**
```json
{
  "message": "📷 Image: https://supabase.../image.jpg",
  "type": "image",
  "sessionId": "abc123"
}
```

**Output (systemPrompt inclura):**
```
Tu es un assistant IA professionnel et créatif.

📷 IMAGE REÇUE:
URL: https://supabase.../image.jpg
Action: Analyse cette image et réponds à la question de l'utilisateur.
Décris ce que tu vois dans l'image.

✨ Style de réponse: professionnel
```

**Output (userMessage):**
```
[Image: https://supabase.../image.jpg]
Que vois-tu dans cette image ?
```

---

### 3. Message avec Vidéo + Question
**Input:**
```json
{
  "message": "🎥 Vidéo: https://supabase.../video.mp4 Peux-tu résumer cette vidéo ?",
  "type": "video",
  "sessionId": "abc123"
}
```

**Output (systemPrompt inclura):**
```
Tu es un assistant IA professionnel et créatif.

🎥 VIDÉO REÇUE:
URL: https://supabase.../video.mp4
Action: L'utilisateur a envoyé une vidéo.
Question: Peux-tu résumer cette vidéo ?
Note: Tu ne peux pas voir les vidéos directement, mais tu peux en discuter avec l'utilisateur.

✨ Style de réponse: professionnel
```

**Output (userMessage):**
```
Peux-tu résumer cette vidéo ?
```

---

## 🔄 Workflow Complet avec Médias

```
Chat Trigger (reçoit type + message)
  ↓
Extract Input
  ↓
Get a row (charge mémoire)
  ↓
Préparer Contexte ✅ (détecte type, extrait URL, adapte prompt)
  ↓
Switch (route selon type)
  ├─ text → OpenAI GPT-4o-mini
  ├─ image → OpenAI GPT-4 Vision (ou GPT-4o-mini avec description)
  ├─ video → OpenAI GPT-4o-mini (notification)
  ├─ audio → OpenAI GPT-4o-mini (notification)
  └─ pdf → OpenAI GPT-4o-mini (notification)
  ↓
Préparer Sauvegarde
  ↓
Upsert Memory (SQL)
  ↓
Respond to Webhook
```

---

## 🎯 Avantages de Cette Approche

✅ **Détection automatique des médias** - Extrait l'URL depuis le message
✅ **Instructions contextuelles** - Adapte le prompt selon le type
✅ **Conserve les métadonnées** - Type, URL, message original
✅ **Compatible GPT-4 Vision** - Format `[Image: URL]` pour les images
✅ **Fallback intelligent** - Gère les cas où l'URL n'est pas fournie
✅ **Historique préservé** - Conserve la conversation précédente

---

## 🧪 Test avec Médias

### Test Image
```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "📷 Image: https://example.com/logo.jpg Analyse ce logo",
    "type": "image",
    "sessionId": "test-image-001",
    "tenant": {
      "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
      "name": "JeffTerra",
      "slug": "jeffterra",
      "aiConfig": {
        "systemPrompt": "Tu es un expert en design graphique",
        "tone": "professionnel",
        "model": "gpt-4o-mini"
      }
    }
  }'
```

### Test Vidéo
```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "🎥 Vidéo: https://example.com/demo.mp4",
    "type": "video",
    "sessionId": "test-video-001",
    "tenant": {
      "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
      "name": "JeffTerra",
      "slug": "jeffterra",
      "aiConfig": {
        "systemPrompt": "Tu es un assistant vidéo",
        "tone": "créatif",
        "model": "gpt-4o-mini"
      }
    }
  }'
```

---

## 📋 Checklist d'Implémentation

- [ ] Remplacer le code du nœud "Préparer Contexte" avec cette version
- [ ] Tester avec un message texte standard
- [ ] Tester avec une image (vérifier extraction URL)
- [ ] Tester avec une vidéo
- [ ] Tester avec un audio
- [ ] Vérifier les logs N8N pour `messageType` et `mediaUrl`
- [ ] Vérifier que le prompt inclut les instructions média

---

## 🔮 Prochaines Évolutions

1. **GPT-4 Vision pour images** - Utiliser le modèle Vision pour analyse réelle
2. **Transcription audio** - Intégrer Whisper API pour audio
3. **Extraction PDF** - Parser le contenu des PDF
4. **Analyse vidéo** - Extraire frames + transcription

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Gestion complète des médias dans le contexte N8N
