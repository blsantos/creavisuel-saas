# 🚀 Plan d'Implémentation Complète SaaS Multi-Tenant
## Version: 2.0 - Date: 2025-12-08

---

## 📋 Vue d'Ensemble

Ce document détaille l'implémentation complète des fonctionnalités suivantes :

1. ✅ **Bibliothèque de Contenu** - Stockage des contenus chat et templates
2. 🔐 **Gestion Authentification Clients** - Création comptes + envoi credentials
3. 📊 **Dashboard Admin Complet** - Stats, tokens, coûts
4. 💰 **Tracking Tokens & Coûts** - Calcul en euros par client
5. 💳 **Onglet Billing** - Préparation intégration Dolibarr
6. 🤖 **Gestion Avancée Assistants** - Contrôles complets

---

## 🎯 PARTIE 1: Bibliothèque de Contenu Chat

### Objectif
Stocker automatiquement tous les contenus créés via le chat dans la `content_library`.

### 1.1 Migration SQL - Ajout Colonne conversation_id

```sql
-- ===================================================
-- Migration 013: Lier content_library aux conversations
-- ===================================================

-- Ajouter colonne conversation_id à content_library
ALTER TABLE content_library
ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Index pour requêtes rapides
CREATE INDEX idx_content_library_conversation_id ON content_library(conversation_id);

-- Fonction pour créer du contenu depuis une conversation
CREATE OR REPLACE FUNCTION save_chat_content_to_library(
  p_conversation_id UUID,
  p_message_id UUID,
  p_tenant_id UUID,
  p_user_id UUID,
  p_type TEXT, -- 'post', 'image', 'video', 'audio', 'document'
  p_title TEXT,
  p_content TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_thumbnail_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_content_id UUID;
BEGIN
  -- Insérer dans content_library
  INSERT INTO content_library (
    tenant_id,
    user_id,
    conversation_id,
    type,
    title,
    content,
    media_url,
    thumbnail_url,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_conversation_id,
    p_type,
    p_title,
    p_content,
    p_media_url,
    p_thumbnail_url,
    jsonb_build_object(
      'source', 'chat',
      'message_id', p_message_id,
      'created_via', 'ai_assistant'
    ) || p_metadata
  )
  RETURNING id INTO v_content_id;

  RETURN v_content_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_chat_content_to_library IS 'Sauvegarde automatiquement le contenu créé via chat dans la bibliothèque';
```

### 1.2 Modification N8N - Sauvegarde Automatique

**Nouveau Nœud après "Préparer Sauvegarde" :**

Nom: **"Save to Library"** (HTTP Request)

```javascript
// ===================================================
// N8N Node: Détecter si le contenu doit être sauvegardé
// ===================================================
const items = $input.all();
const firstItem = items[0]?.json || {};

const aiResponse = firstItem.aiResponse || '';
const messageType = firstItem.messageType || 'text';
const mediaUrl = firstItem.mediaUrl || '';
const sessionId = firstItem.session_id || '';
const tenantId = firstItem.tenant_id || '';

// Déterminer si on doit sauvegarder dans la bibliothèque
let shouldSave = false;
let contentType = 'post';
let title = 'Conversation Chat';

// Logique de détection
if (messageType === 'image') {
  shouldSave = true;
  contentType = 'image';
  title = 'Image créée via chat';
} else if (messageType === 'video') {
  shouldSave = true;
  contentType = 'video';
  title = 'Vidéo créée via chat';
} else if (messageType === 'audio') {
  shouldSave = true;
  contentType = 'audio';
  title = 'Audio créé via chat';
} else if (aiResponse.length > 500 || aiResponse.includes('template') || aiResponse.includes('post')) {
  // Si c'est un long texte ou mentionne "template"/"post", on sauvegarde
  shouldSave = true;
  contentType = 'post';
  title = aiResponse.substring(0, 50) + '...';
}

if (!shouldSave) {
  // Ne rien faire, retourner vide
  return [];
}

// Préparer les données pour la sauvegarde
return [{
  json: {
    conversationId: sessionId,
    tenantId: tenantId,
    type: contentType,
    title: title,
    content: aiResponse,
    mediaUrl: mediaUrl || null,
    metadata: {
      messageType: messageType,
      source: 'chat_ai',
      createdAt: new Date().toISOString()
    }
  }
}];
```

**Nœud HTTP Request suivant:**

```
Type: HTTP Request
Method: POST
URL: https://supabase.lecoach.digital/rest/v1/rpc/save_chat_content_to_library

Authentication: Supabase API

Body Parameters:
- p_conversation_id: ={{ $json.conversationId }}
- p_message_id: ={{ $json.conversationId }}
- p_tenant_id: ={{ $json.tenantId }}
- p_user_id: null
- p_type: ={{ $json.type }}
- p_title: ={{ $json.title }}
- p_content: ={{ $json.content }}
- p_media_url: ={{ $json.mediaUrl }}
- p_thumbnail_url: null
- p_metadata: ={{ JSON.stringify($json.metadata) }}
```

---

## 🔐 PARTIE 2: Système de Gestion des Clients

### 2.1 Migration SQL - Ajout Colonnes Authentification

```sql
-- ===================================================
-- Migration 014: Système authentification clients
-- ===================================================

-- Ajouter colonnes pour login direct
ALTER TABLE tenants
ADD COLUMN login_email TEXT UNIQUE,
ADD COLUMN login_password_hash TEXT,
ADD COLUMN login_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN last_login_at TIMESTAMPTZ;

-- Index pour recherche par email
CREATE INDEX idx_tenants_login_email ON tenants(login_email) WHERE login_email IS NOT NULL;

-- Fonction pour créer un client avec credentials
CREATE OR REPLACE FUNCTION create_tenant_with_credentials(
  p_slug TEXT,
  p_name TEXT,
  p_email TEXT,
  p_password TEXT DEFAULT NULL, -- Si NULL, génère automatiquement
  p_plan_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  email TEXT,
  generated_password TEXT,
  login_url TEXT
) AS $$
DECLARE
  v_tenant_id UUID;
  v_password TEXT;
  v_password_hash TEXT;
BEGIN
  -- Générer mot de passe si non fourni (12 caractères alphanumériques)
  IF p_password IS NULL THEN
    v_password := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
  ELSE
    v_password := p_password;
  END IF;

  -- Hash le mot de passe (utilise crypt de pgcrypto)
  v_password_hash := crypt(v_password, gen_salt('bf', 8));

  -- Créer le tenant
  INSERT INTO tenants (
    slug,
    name,
    status,
    plan_id,
    login_email,
    login_password_hash,
    login_enabled
  )
  VALUES (
    p_slug,
    p_name,
    'trial', -- Nouveau client démarre en trial
    p_plan_id,
    p_email,
    v_password_hash,
    TRUE
  )
  RETURNING id INTO v_tenant_id;

  -- Retourner les infos
  RETURN QUERY SELECT
    v_tenant_id,
    p_email,
    v_password,
    'https://' || p_slug || '.creavisuel.pro/login';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier login
CREATE OR REPLACE FUNCTION verify_tenant_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  tenant_id UUID,
  tenant_slug TEXT,
  tenant_name TEXT,
  status TEXT
) AS $$
DECLARE
  v_tenant_record RECORD;
BEGIN
  -- Chercher le tenant
  SELECT
    id,
    slug,
    name,
    status,
    login_password_hash
  INTO v_tenant_record
  FROM tenants
  WHERE login_email = p_email
  AND login_enabled = TRUE;

  -- Si pas trouvé
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Vérifier mot de passe
  IF v_tenant_record.login_password_hash = crypt(p_password, v_tenant_record.login_password_hash) THEN
    -- Mettre à jour last_login_at
    UPDATE tenants
    SET last_login_at = NOW()
    WHERE id = v_tenant_record.id;

    RETURN QUERY SELECT
      TRUE,
      v_tenant_record.id,
      v_tenant_record.slug,
      v_tenant_record.name,
      v_tenant_record.status;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Installer extension pgcrypto si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON FUNCTION create_tenant_with_credentials IS 'Crée un client avec génération automatique de credentials';
COMMENT ON FUNCTION verify_tenant_login IS 'Vérifie les credentials de login d''un client';
```

### 2.2 Backend - API pour Envoi Email

Créer: `/root/creavisuel-saas/src/server/email-service.ts`

```typescript
// ===================================================
// Email Service - Envoi des credentials clients
// ===================================================
import nodemailer from 'nodemailer';

interface WelcomeEmailData {
  tenantName: string;
  email: string;
  password: string;
  loginUrl: string;
  slug: string;
}

// Configuration SMTP (à adapter selon votre provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .credentials-box {
      background: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .credential-item {
      margin: 10px 0;
    }
    .credential-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
    }
    .credential-value {
      background: white;
      padding: 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #2d3748;
      margin-top: 5px;
      border: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background: #f7fafc;
      padding: 20px 30px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
    .warning {
      background: #fff5f5;
      border-left: 4px solid #f56565;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      color: #742a2a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue sur CréaVisuel !</h1>
    </div>

    <div class="content">
      <h2>Bonjour ${data.tenantName} !</h2>

      <p>Votre espace client est maintenant prêt ! Nous sommes ravis de vous accueillir sur la plateforme CréaVisuel.</p>

      <div class="credentials-box">
        <h3 style="margin-top: 0;">🔐 Vos Identifiants de Connexion</h3>

        <div class="credential-item">
          <div class="credential-label">Email</div>
          <div class="credential-value">${data.email}</div>
        </div>

        <div class="credential-item">
          <div class="credential-label">Mot de passe temporaire</div>
          <div class="credential-value">${data.password}</div>
        </div>

        <div class="credential-item">
          <div class="credential-label">URL de connexion</div>
          <div class="credential-value">${data.loginUrl}</div>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Important :</strong> Changez votre mot de passe dès votre première connexion pour des raisons de sécurité.
      </div>

      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button">
          Se Connecter Maintenant
        </a>
      </div>

      <h3>📚 Pour Démarrer</h3>
      <ul>
        <li>Connectez-vous avec vos identifiants ci-dessus</li>
        <li>Personnalisez votre profil et vos préférences</li>
        <li>Explorez les templates disponibles</li>
        <li>Créez votre premier contenu avec l'assistant IA</li>
      </ul>

      <p>Si vous avez des questions, n'hésitez pas à nous contacter !</p>
    </div>

    <div class="footer">
      <p>CréaVisuel - Plateforme de Création de Contenu IA</p>
      <p>support@creavisuel.pro</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"CréaVisuel" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: `🎉 Bienvenue sur CréaVisuel - Vos identifiants`,
      html: emailHTML,
    });

    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Fonction helper pour l'API
export async function sendClientCredentials(
  tenantId: string,
  email: string,
  password: string,
  slug: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loginUrl = `https://${slug}.creavisuel.pro/login`;

    const sent = await sendWelcomeEmail({
      tenantName: name,
      email,
      password,
      loginUrl,
      slug,
    });

    if (sent) {
      // Marquer l'email comme envoyé dans la BD
      // TODO: Faire un UPDATE tenants SET welcome_email_sent = TRUE
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### 2.3 Frontend Admin - Composant Création Client

Modifier: `/root/creavisuel-saas/src/apps/admin/components/admin/clients/ClientFormModal.tsx`

```typescript
// Ajouter au formulaire de création :
const [email, setEmail] = useState('');
const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
const [customPassword, setCustomPassword] = useState('');
const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

// Lors de la soumission :
const handleCreateClient = async () => {
  try {
    // Appeler la fonction SQL
    const { data, error } = await supabase.rpc('create_tenant_with_credentials', {
      p_slug: slug,
      p_name: name,
      p_email: email,
      p_password: autoGeneratePassword ? null : customPassword,
      p_plan_id: selectedPlanId
    });

    if (error) throw error;

    const { tenant_id, email: clientEmail, generated_password, login_url } = data[0];

    // Envoyer l'email si demandé
    if (sendWelcomeEmail) {
      const response = await fetch('/api/send-client-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant_id,
          email: clientEmail,
          password: generated_password,
          slug: slug,
          name: name
        })
      });

      if (!response.ok) {
        console.warn('Failed to send email');
      }
    }

    toast({
      title: 'Client créé !',
      description: `Email: ${clientEmail} | Mot de passe: ${generated_password}`,
      duration: 10000 // Afficher plus longtemps
    });

    onClose();
  } catch (error) {
    toast({
      title: 'Erreur',
      description: String(error),
      variant: 'destructive'
    });
  }
};
```

---

## 📊 PARTIE 3: Dashboard Admin Complet

Je vais créer la suite dans le prochain fichier car celui-ci devient trop long...
