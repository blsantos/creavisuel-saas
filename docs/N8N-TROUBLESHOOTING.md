# 🔧 Dépannage N8N - Webhook ne répond pas

## 🚨 Problème

Le webhook accepte les requêtes (HTTP 200) mais ne retourne aucune réponse.

## ✅ Checklist de Vérification

### 1. Vérifier que le workflow est ACTIF

Dans N8N :
1. Allez sur **Workflows**
2. Trouvez le workflow importé
3. Vérifiez que le toggle en haut à droite est **ON** (vert)
4. Si OFF (gris), cliquez dessus pour l'activer

### 2. Vérifier qu'il y a un nœud "Respond to Webhook"

Le workflow DOIT avoir un nœud "Respond to Webhook" à la fin :

```
Chat Trigger (Webhook)
  ↓
Extract Input
  ↓
Charger Mémoire
  ↓
Préparer Contexte
  ↓
OpenAI GPT
  ↓
Préparer Sauvegarde
  ↓
Sauvegarder Mémoire
  ↓
Respond to Webhook  ← IMPORTANT !
```

**Si ce nœud manque**, le webhook ne retournera jamais de réponse.

### 3. Vérifier les Credentials OpenAI

Le nœud "OpenAI GPT" nécessite des credentials :
1. Cliquez sur le nœud "OpenAI GPT"
2. Vérifiez que les credentials sont configurées
3. Testez les credentials (bouton "Test Connection")

### 4. Vérifier les Erreurs d'Exécution

Dans N8N :
1. Allez sur **Executions** (historique des exécutions)
2. Regardez les dernières exécutions
3. Cliquez sur une exécution pour voir les erreurs détaillées

**Erreurs communes :**
- ❌ `Table 'n8n_conversations' not found` → Créer la table (SQL fourni)
- ❌ `OpenAI API key invalid` → Configurer les credentials OpenAI
- ❌ `Node returned no data` → Vérifier que les Function nodes retournent bien des données

### 5. Tester le Workflow Manuellement

Dans N8N :
1. Ouvrez le workflow
2. Cliquez sur le nœud "Chat Trigger"
3. Cliquez sur **"Test Workflow"**
4. Cliquez sur **"Listen for Test Event"**
5. Envoyez une requête curl :
   ```bash
   curl -X POST "https://auto.lecoach.digital/webhook/chat" \
     -H "Content-Type: application/json" \
     -d '{"message":"Test manuel","sessionId":"test-001"}'
   ```
6. Regardez les données circuler entre les nœuds

### 6. Simplifier le Workflow pour Debug

Si rien ne fonctionne, créez un workflow minimal :

**Workflow Debug Minimal :**
```
1. Chat Trigger (Webhook)
   ↓
2. Function Node
   Code: return [{ json: { test: "ça marche!" } }];
   ↓
3. Respond to Webhook
   Body: {{ $json.test }}
```

Testez ce workflow simple pour vérifier que le webhook fonctionne de base.

---

## 🔍 Diagnostic Avancé

### Vérifier que la table existe

Dans Supabase SQL Editor :
```sql
SELECT * FROM public.n8n_conversations LIMIT 5;
```

Si erreur `table does not exist`, exécutez le script de création.

### Vérifier les Policies RLS

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'n8n_conversations';
```

Doit afficher au moins une policy permettant l'accès `anon`.

### Tester l'API Supabase directement

```bash
# Test GET
curl -X GET "https://supabase.lecoach.digital/rest/v1/n8n_conversations?limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc"

# Test POST
curl -X POST "https://supabase.lecoach.digital/rest/v1/n8n_conversations" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "session_id": "test-direct-001",
    "tenant_id": "66fd102d-d010-4d99-89ed-4e4f0336961e",
    "short_term_memory": {},
    "long_term_memory": {},
    "message_count": 0
  }'
```

---

## 🎯 Solution Rapide : Workflow Minimal

Si vous voulez juste que ça fonctionne rapidement, créez ce workflow minimal dans N8N :

### Nœud 1 : Webhook Trigger
- **Type :** Webhook
- **Path :** `chat-simple`
- **Method :** POST

### Nœud 2 : Function Node
```javascript
const input = $input.first().json;
const message = input.message || "Aucun message";

return [{
  json: {
    response: `Vous avez dit : "${message}". Je suis votre assistant IA !`,
    success: true
  }
}];
```

### Nœud 3 : Respond to Webhook
- **Response Data Source :** Define Below
- **Response Body :** `{{ $json }}`

### Connexions :
Webhook → Function → Respond to Webhook

### Test :
```bash
curl -X POST "https://auto.lecoach.digital/webhook/chat-simple" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

Devrait retourner :
```json
{
  "response": "Vous avez dit : \"Hello\". Je suis votre assistant IA !",
  "success": true
}
```

---

## 📞 Si Rien ne Fonctionne

1. Vérifiez les logs N8N (Executions → Details)
2. Vérifiez que N8N est bien démarré (`docker ps | grep n8n`)
3. Redémarrez N8N si nécessaire
4. Contactez-moi avec les logs d'erreur

---

**🤖 Généré avec Claude Code**
**Date :** 2025-12-08
