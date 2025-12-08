# ✅ Implémentation du Type de Message

## 📋 Résumé

Le système CréaVisuel envoie maintenant systématiquement le champ `type` dans le payload webhook, permettant à N8N de classifier et traiter différemment chaque type de message.

---

## 🎯 Types Supportés

| Type | Description | Emoji | Exemple |
|------|-------------|-------|---------|
| `text` | Message texte standard | 💬 | "Bonjour, comment ça va ?" |
| `image` | Image uploadée | 📷 | "📷 Image: https://..." |
| `video` | Vidéo uploadée | 🎥 | "🎥 Vidéo: https://..." |
| `audio` | Audio uploadé | 🎤 | "🎤 Audio: https://..." |
| `pdf` | Document PDF | 📄 | "📄 PDF: https://..." |

---

## 🔧 Modifications Effectuées

### 1. `useChatWithSupabase.ts` (Hook Principal)

#### Fonction `sendToWebhook`
Accepte maintenant un paramètre `messageType` :

```typescript
const sendToWebhook = async (
  userMessage: string,
  messageType: 'text' | 'image' | 'video' | 'audio' | 'pdf' = 'text'
): Promise<string | null> => {
  // ...
  body: JSON.stringify({
    chatInput: userMessage,
    message: userMessage,
    type: messageType,  // ✅ Type envoyé au webhook
    sessionId: conversationId,
    conversationHistory: recentMessages,
    tenant: { /* ... */ }
  })
}
```

#### Fonction `sendMessage`
Accepte et transmet le type :

```typescript
const sendMessage = useCallback(
  async (text: string, messageType: 'text' | 'image' | 'video' | 'audio' | 'pdf' = 'text') => {
    // 1. Save with type metadata
    const userMessage = await addMessage('user', trimmedText, { type: messageType });

    // 2. Send to webhook with type
    const aiResponse = await sendToWebhook(trimmedText, messageType);

    // ...
  }
)
```

### 2. `ChatPage.tsx` (Interface Client)

#### Fonction `handleSendMedia`
Transmet le type lors de l'upload de médias :

```typescript
const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio') => {
  // ...
  if (mediaUrl) {
    const mediaMessage = type === 'image'
      ? `📷 Image: ${mediaUrl}`
      : type === 'video'
      ? `🎥 Vidéo: ${mediaUrl}`
      : `🎤 Audio: ${mediaUrl}`;

    // ✅ Passe le type au sendMessage
    await sendMessage(mediaMessage, type);
  }
}
```

---

## 📤 Exemples de Payload Envoyés

### Message Texte
```json
{
  "message": "Bonjour, comment ça va ?",
  "chatInput": "Bonjour, comment ça va ?",
  "type": "text",
  "sessionId": "conv-123-abc",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "tenant": {
    "id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
    "slug": "jeffterra",
    "name": "JeffTerra",
    "aiConfig": {
      "systemPrompt": "Tu es un assistant...",
      "tone": "professionnel",
      "model": "gpt-4o-mini"
    }
  }
}
```

### Message Image
```json
{
  "message": "📷 Image: https://supabase.../image.jpg",
  "chatInput": "📷 Image: https://supabase.../image.jpg",
  "type": "image",
  "sessionId": "conv-123-abc",
  "conversationHistory": [ /* ... */ ],
  "tenant": { /* ... */ }
}
```

### Message Video
```json
{
  "message": "🎥 Vidéo: https://supabase.../video.mp4",
  "chatInput": "🎥 Vidéo: https://supabase.../video.mp4",
  "type": "video",
  "sessionId": "conv-123-abc",
  "conversationHistory": [ /* ... */ ],
  "tenant": { /* ... */ }
}
```

### Message Audio
```json
{
  "message": "🎤 Audio: https://supabase.../audio.mp3",
  "chatInput": "🎤 Audio: https://supabase.../audio.mp3",
  "type": "audio",
  "sessionId": "conv-123-abc",
  "conversationHistory": [ /* ... */ ],
  "tenant": { /* ... */ }
}
```

---

## 🔄 Configuration N8N - Nœud Switch

Maintenant que le `type` est envoyé, configurez le nœud Switch dans N8N :

### Dans Chaque Condition :

**Left Value :** `={{ $json.type }}`
**Operator :** equals
**Right Value :** `image` | `text` | `video` | `audio` | `pdf`

### Exemple de Configuration :

```json
{
  "conditions": [
    {
      "leftValue": "={{ $json.type }}",
      "rightValue": "text",
      "operator": { "type": "string", "operation": "equals" }
    }
  ],
  "outputKey": "text"
}
```

### Branches du Switch :

```
Switch (sur $json.type)
  ├─ text → OpenAI GPT (traitement texte standard)
  ├─ image → Vision API / Analyse d'image
  ├─ video → Transcription / Analyse vidéo
  ├─ audio → Whisper API / Transcription audio
  └─ pdf → Extraction texte / Analyse document
```

---

## 🧪 Tests

### Test Message Texte
```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour test",
    "type": "text",
    "sessionId": "test-text-001"
  }'
```

### Test Message Image
```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "📷 Image: https://example.com/image.jpg",
    "type": "image",
    "sessionId": "test-image-001"
  }'
```

### Test depuis l'Interface

1. **Text** : Tapez un message normal → `type: "text"`
2. **Image** : Uploadez une image → `type: "image"`
3. **Video** : Uploadez une vidéo → `type: "video"`
4. **Audio** : Uploadez un audio → `type: "audio"`

Vérifiez dans les logs N8N que le `type` arrive correctement.

---

## 📊 Metadata Sauvegardée

Le type est également sauvegardé dans Supabase (`messages` table) :

```sql
SELECT
  id,
  role,
  content,
  metadata->>'type' as message_type,
  created_at
FROM messages
WHERE conversation_id = 'conv-123'
ORDER BY created_at DESC;
```

Résultat :
```
| id   | role      | content                  | message_type | created_at          |
|------|-----------|--------------------------|--------------|---------------------|
| ...  | user      | 📷 Image: https://...    | image        | 2025-12-08 12:00:00 |
| ...  | assistant | Jolie image !            | NULL         | 2025-12-08 12:00:05 |
| ...  | user      | Bonjour                  | text         | 2025-12-08 11:55:00 |
```

---

## 🚀 Déploiement

✅ Code modifié
✅ Build créé
✅ Déployé à `/var/www/creavisuel.pro/`
✅ Nginx redémarré

**Date :** 2025-12-08 13:30
**Version :** v2.1.0 (avec type classification)

---

## 🔮 Prochaines Étapes

1. **Configurer le Switch dans N8N** avec `={{ $json.type }}`
2. **Tester chaque branche** (text, image, video, audio)
3. **Implémenter les traitements spécifiques** :
   - Image → Vision API (GPT-4 Vision)
   - Video → Transcription + analyse
   - Audio → Whisper API transcription
   - PDF → Extraction texte + analyse

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
**Objectif :** Classification des types de messages pour workflow N8N
