# 🤖 Guide du Workflow N8N - CréaVisuel SaaS

## 📋 Vue d'ensemble

Ce workflow N8N gère les conversations IA pour tous les clients de CréaVisuel SaaS de manière multi-tenant. Chaque client a sa propre configuration (system prompt, ton, webhooks).

## 🏗️ Architecture

```
Frontend (React) → Supabase → Webhook N8N → OpenAI Agent → Réponse
                      ↓
               Conversations DB
               Messages DB
               Redis Memory
```

## 🔧 Configuration par Client

Chaque client (tenant) a sa configuration dans `tenant_configs.ai_config` :

```json
{
  "tone": "friendly",
  "webhookUrl": "https://auto.lecoach.digital/webhook/[WEBHOOK_ID]/chat",
  "systemPrompt": "Tu es l'assistant IA de [NOM CLIENT]...",
  "temperature": 0.7,
  "maxTokens": 2000,
  "model": "gpt-4o-mini"
}
```

## 📡 Payload Envoyé au Webhook

Le frontend envoie ce JSON au webhook N8N :

```json
{
  "chatInput": "Le message de l'utilisateur",
  "message": "Le message de l'utilisateur",
  "type": "text",
  "sessionId": "uuid-de-la-conversation",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Message précédent 1"
    },
    {
      "role": "assistant",
      "content": "Réponse précédente 1"
    }
  ],
  "tenant": {
    "id": "tenant-uuid",
    "slug": "jeffterra",
    "name": "Salon Jeff Terra",
    "aiConfig": {
      "systemPrompt": "Tu es Jeff Terra I.A...",
      "tone": "friendly",
      "model": "gpt-4o-mini",
      "temperature": 0.7
    }
  }
}
```

## 🔄 Workflow N8N - Étapes

### 1. **When chat message received** (Chat Trigger)
- Reçoit le webhook POST
- Extrait les données du message

### 2. **Chat-inputs** (Set Node)
Extrait et structure les données :
```javascript
{
  "sessionId": "={{ $json.sessionId }}",
  "chatInput": "={{ $json.chatInput }}",
  "conversationHistory": "={{ $json.conversationHistory }}",
  "tenant.id": "={{ $json.tenant.id }}",
  "tenant.name": "={{ $json.tenant.name }}",
  "tenant.slug": "={{ $json.tenant.slug }}",
  "tenant.aiConfig.systemPrompt": "={{ $json.tenant.aiConfig.systemPrompt }}",
  "tenant.aiConfig.tone": "={{ $json.tenant.aiConfig.tone }}",
  "tenant.aiConfig.model": "={{ $json.tenant.aiConfig.model }}"
}
```

### 3. **Charger Session Supabase** (HTTP Request)
```http
GET https://supabase.lecoach.digital/rest/v1/n8n_conversations
  ?conversation_id=eq.{{ $json.sessionId }}
  &order=created_at.desc
  &limit=1
```

Headers:
- `apikey`: Supabase anon key
- `Authorization`: Bearer [anon key]

### 4. **Préparer Contexte** (Code Node)

```javascript
const chatInputs = $('Chat-inputs').first().json;

const sessionId = chatInputs.sessionId || 'session-' + Date.now();
const chatInput = chatInputs.chatInput || '';
const tenantId = chatInputs['tenant.id'];

const supabaseResponse = $input.first().json;
let session = null;
let sessionId_db = null;

if (Array.isArray(supabaseResponse) && supabaseResponse.length > 0) {
  session = supabaseResponse[0];
  sessionId_db = session.id;
}

let memoireLongue = '';
let existingInfosCles = '';
let existingPreferences = '';
let existingSujets = '';
let existingResume = '';
let messageCount = 1;

if (session) {
  messageCount = session.message_count ? parseInt(session.message_count) + 1 : 1;

  existingInfosCles = session.key_info || '';
  existingPreferences = session.preferences || '';
  existingSujets = session.topics || '';
  existingResume = session.context_summary || '';

  if (existingInfosCles && existingInfosCles.trim()) {
    memoireLongue += `\n👤 INFOS IMPORTANTES:\n${existingInfosCles}\n`;
  }

  if (existingPreferences && existingPreferences.trim()) {
    memoireLongue += `\n⭐ PRÉFÉRENCES:\n${existingPreferences}\n`;
  }

  if (existingSujets && existingSujets.trim()) {
    memoireLongue += `\n🏷️ SUJETS ABORDÉS: ${existingSujets}\n`;
  }

  if (existingResume && existingResume.trim()) {
    memoireLongue += `\n📋 RÉSUMÉ:\n${existingResume}\n`;
  }
}

if (!memoireLongue.trim()) {
  memoireLongue = '(Nouvelle conversation)';
}

// Ajouter l'historique récent
let historyText = '';
const history = chatInputs.conversationHistory || [];
if (Array.isArray(history) && history.length > 0) {
  historyText = '\n\n💬 MESSAGES RÉCENTS:\n' +
    history.slice(-5).map(m =>
      `${m.role === 'user' ? '👤 Client' : '🤖 Assistant'}: ${m.content.substring(0, 150)}...`
    ).join('\n');
}

return [{
  json: {
    sessionId,
    chatInput,
    tenantId,
    tenantName: chatInputs['tenant.name'],
    tenantSlug: chatInputs['tenant.slug'],
    systemPrompt: chatInputs['tenant.aiConfig.systemPrompt'],
    tone: chatInputs['tenant.aiConfig.tone'],
    model: chatInputs['tenant.aiConfig.model'] || 'gpt-4o-mini',
    sessionId_db,
    hasSession: !!session,
    messageCount,
    memoireLongue,
    historyText,
    existingInfosCles,
    existingPreferences,
    existingSujets,
    existingResume
  }
}];
```

### 5. **Préparer Prompt Dynamique** (Code Node)

```javascript
const context = $('Préparer Contexte').first().json;

// System prompt du tenant (configurable par client)
const systemPrompt = context.systemPrompt ||
  'Tu es un assistant IA professionnel, serviable et sympathique.';

const tone = context.tone || 'professional';
const tenantName = context.tenantName || 'Client';

// Instructions de ton
let toneInstructions = '';
switch(tone) {
  case 'friendly':
    toneInstructions = '\n💬 TON: Amical, chaleureux. Tu peux tutoyer si on te tutoie. Utilise quelques emojis avec modération.';
    break;
  case 'professional':
    toneInstructions = '\n💼 TON: Professionnel, courtois, vouvoiement par défaut.';
    break;
  case 'casual':
    toneInstructions = '\n😊 TON: Décontracté, simple, comme un ami qui aide.';
    break;
}

// Construire le prompt final
const finalPrompt = `${systemPrompt}
${toneInstructions}

📊 CONTEXTE DE LA CONVERSATION:
${context.memoireLongue}
${context.historyText}

🎯 RÈGLES:
- Réponds de manière concise et claire (2-4 paragraphes max)
- Si tu ne sais pas, dis-le honnêtement
- Utilise les informations du contexte ci-dessus
- Reste cohérent avec les messages précédents
- Adapte-toi au ton de la conversation

💬 MESSAGE ACTUEL À TRAITER:
${context.chatInput}`;

return [{
  json: {
    finalPrompt,
    chatInput: context.chatInput,
    sessionId: context.sessionId,
    sessionId_db: context.sessionId_db,
    hasSession: context.hasSession,
    tenantId: context.tenantId,
    tenantName: context.tenantName,
    tone: tone,
    model: context.model,
    messageCount: context.messageCount,
    existingInfosCles: context.existingInfosCles,
    existingPreferences: context.existingPreferences,
    existingSujets: context.existingSujets,
    existingResume: context.existingResume
  }
}];
```

### 6. **Agent IA** (OpenAI Assistant)

Configuration :
- **Model**: `gpt-4o-mini` (ou celui du tenant)
- **Prompt**: `={{ $json.finalPrompt }}`
- **Temperature**: `0.7`
- **Max tokens**: `2000`

### 7. **Redis Chat Memory** (Memory Node)
- **Session Key**: `={{ $json.sessionId }}`
- **Context Window**: `10` messages

### 8. **Tools disponibles** :
- **TOOL-Conseils** (MCP Tool)
- **GenerateurImage_CreaVisuel** (Workflow Tool)
- **HumainLoop** (Workflow Tool)
- **Scrappeur** (Agent Tool)
- **Recherche Web** (Perplexity Tool)
- **Redis** (Redis Tool)
- **QuelleJourEstAujourdhui** (DateTime Tool)

### 9. **Extraire Suivi & Mémoire** (Code Node)

```javascript
const ctx = $('Préparer Prompt Dynamique').first().json;

const sessionId = ctx.sessionId;
const chatInput = ctx.chatInput;
const sessionId_db = ctx.sessionId_db;
const hasSession = ctx.hasSession;
const messageCount = ctx.messageCount;
const tenantId = ctx.tenantId;

const existingInfosCles = ctx.existingInfosCles || '';
const existingPreferences = ctx.existingPreferences || '';
const existingSujets = ctx.existingSujets || '';
const existingResume = ctx.existingResume || '';

let agentResponse = '';
const agentOutput = $input.first().json;

if (agentOutput.output) {
  agentResponse = agentOutput.output;
} else if (agentOutput.text) {
  agentResponse = agentOutput.text;
} else if (typeof agentOutput === 'string') {
  agentResponse = agentOutput;
} else {
  agentResponse = JSON.stringify(agentOutput);
}

// Extraire les nouvelles informations (si l'IA a structuré sa réponse)
let suivi = {
  nouvelles_infos: null,
  nouvelles_preferences: null,
  sujet_actuel: 'conversation',
  intention: 'Discussion générale',
  sentiment: 'neutre',
  tache_terminee: false,
  follow_up_requis: false,
  tag: 'Conversation'
};

let reponseClean = agentResponse;

// Nettoyer les blocs de métadonnées si présents
reponseClean = reponseClean.replace(/```json[\s\S]*?```/g, '').trim();

// Fusionner les nouvelles infos
let infosFinales = existingInfosCles;
if (suivi.nouvelles_infos && String(suivi.nouvelles_infos).trim()) {
  infosFinales = existingInfosCles
    ? `${existingInfosCles}\n• ${suivi.nouvelles_infos}`
    : `• ${suivi.nouvelles_infos}`;
}

let prefsFinales = existingPreferences;
if (suivi.nouvelles_preferences && String(suivi.nouvelles_preferences).trim()) {
  prefsFinales = existingPreferences
    ? `${existingPreferences}\n• ${suivi.nouvelles_preferences}`
    : `• ${suivi.nouvelles_preferences}`;
}

// Sujets
let sujetsFinaux = existingSujets;
if (suivi.sujet_actuel && suivi.sujet_actuel !== 'conversation') {
  const sujetsArray = existingSujets ? existingSujets.split(', ') : [];
  if (!sujetsArray.includes(suivi.sujet_actuel)) {
    sujetsArray.push(suivi.sujet_actuel);
    sujetsFinaux = sujetsArray.slice(-10).join(', ');
  }
}

// Résumé
const dateNow = new Date().toLocaleDateString('fr-FR');
const heureNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const msgPreview = chatInput ? chatInput.substring(0, 60) : '(média)';
const nouvelleEntree = `[${dateNow} ${heureNow}] ${suivi.sujet_actuel}: ${msgPreview}...`;

let resumeFinal = existingResume
  ? `${existingResume}\n${nouvelleEntree}`
  : nouvelleEntree;

const resumeLines = resumeFinal.split('\n');
resumeFinal = resumeLines.slice(-20).join('\n');

return [{
  json: {
    sessionId,
    sessionId_db,
    hasSession,
    reponseAgent: reponseClean,
    tenantId,
    conversation_id: sessionId,
    tenant_id: tenantId,
    last_message: chatInput || '(média)',
    last_response: reponseClean.substring(0, 5000),
    message_count: messageCount,
    status: suivi.tache_terminee ? 'terminée' : 'en_cours',
    agent: 'chatN8N',
    intentions: [suivi.intention],
    tags: suivi.tag,
    follow_up_required: suivi.follow_up_requis,
    sentiment: suivi.sentiment || 'neutre',
    key_info: infosFinales.substring(0, 5000),
    preferences: prefsFinales.substring(0, 2000),
    topics: sujetsFinaux.substring(0, 500),
    context_summary: resumeFinal.substring(0, 5000)
  }
}];
```

### 10. **Session existe?** (Switch Node)
Vérifie si `{{ $json.hasSession }}` est `true` ou `false`

### 11a. **Mettre à Jour Session Supabase** (HTTP Request - si existe)
```http
PATCH https://supabase.lecoach.digital/rest/v1/n8n_conversations
  ?id=eq.{{ $json.sessionId_db }}
```

Headers:
- `apikey`: [anon key]
- `Authorization`: Bearer [anon key]
- `Prefer`: return=representation

Body:
```json
{
  "last_message": "{{ $json.last_message }}",
  "last_response": "{{ $json.last_response }}",
  "message_count": {{ $json.message_count }},
  "status": "{{ $json.status }}",
  "intentions": {{ $json.intentions }},
  "tags": "{{ $json.tags }}",
  "follow_up_required": {{ $json.follow_up_required }},
  "sentiment": "{{ $json.sentiment }}",
  "key_info": "{{ $json.key_info }}",
  "preferences": "{{ $json.preferences }}",
  "topics": "{{ $json.topics }}",
  "context_summary": "{{ $json.context_summary }}",
  "updated_at": "{{ new Date().toISOString() }}"
}
```

### 11b. **Créer Nouvelle Session Supabase** (HTTP Request - si n'existe pas)
```http
POST https://supabase.lecoach.digital/rest/v1/n8n_conversations
```

Body:
```json
{
  "conversation_id": "{{ $json.conversation_id }}",
  "tenant_id": "{{ $json.tenant_id }}",
  "agent": "chatN8N",
  "last_message": "{{ $json.last_message }}",
  "last_response": "{{ $json.last_response }}",
  "message_count": 1,
  "status": "en_cours",
  "intentions": {{ $json.intentions }},
  "tags": "{{ $json.tags }}",
  "follow_up_required": {{ $json.follow_up_required }},
  "sentiment": "{{ $json.sentiment }}",
  "key_info": "{{ $json.key_info }}",
  "preferences": "{{ $json.preferences }}",
  "topics": "{{ $json.topics }}",
  "context_summary": "{{ $json.context_summary }}"
}
```

### 12. **Edit Fields** (Set Node)
```json
{
  "Response": "={{ $json.last_response || $json.reponseAgent }}"
}
```

### 13. **Respond to Webhook** (Respond Node)
Retourne la réponse au frontend

## 📊 Table Supabase: n8n_conversations

```sql
CREATE TABLE n8n_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(255) UNIQUE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  agent VARCHAR(100) DEFAULT 'chatN8N',
  last_message TEXT,
  last_response TEXT,
  message_count INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'en_cours',
  intentions TEXT[],
  tags VARCHAR(100),
  follow_up_required BOOLEAN DEFAULT false,
  sentiment VARCHAR(50) DEFAULT 'neutre',
  key_info TEXT,
  preferences TEXT,
  topics VARCHAR(500),
  context_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔑 Variables d'Environnement N8N

```env
SUPABASE_URL=https://supabase.lecoach.digital
SUPABASE_ANON_KEY=<your-anon-key>
OPENAI_API_KEY=<your-openai-key>
REDIS_HOST=redis
REDIS_PORT=6379
```

## 🎯 Bonnes Pratiques

1. **System Prompt par Client** : Chaque client doit avoir son propre system prompt dans `tenant_configs.ai_config.systemPrompt`

2. **Historique Limité** : Envoyer max 10 messages d'historique pour ne pas saturer le contexte

3. **Mémoire Redis** : 10 messages en mémoire courte, le reste dans Supabase

4. **Nettoyage** : Archiver les conversations de plus de 30 jours

5. **Monitoring** : Logger les erreurs dans Supabase `logs` table

## 🐛 Debugging

Pour tester le webhook :
```bash
curl -X POST "https://auto.lecoach.digital/webhook/[ID]/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "chatInput": "Bonjour",
    "type": "text",
    "sessionId": "test-123",
    "tenant": {
      "id": "tenant-id",
      "name": "Test Client",
      "aiConfig": {
        "systemPrompt": "Tu es un assistant de test.",
        "tone": "friendly"
      }
    }
  }'
```

## 📝 TODO Future

- [ ] Support média (images, PDF, audio)
- [ ] RAG avec base de connaissance vectorisée
- [ ] Analytics des conversations
- [ ] Export des conversations
- [ ] Widget chat embeddable
- [ ] Support multi-langue automatique
