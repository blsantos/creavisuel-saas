# Architecture CréaVisuel SaaS - Vue Technique Complète

**Version:** v0.1.0-alpha
**Date:** 2025-12-07

---

## 🏗️ Vue d'Ensemble

CréaVisuel SaaS est une plateforme multi-tenant permettant à B2Santos de créer et gérer des espaces clients personnalisés avec IA, génération de contenu, et outils média intégrés.

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                    *.creavisuel.pro
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   TRAEFIK v3.4.4                             │
│  - Wildcard routing: *.creavisuel.pro                        │
│  - SSL Let's Encrypt automatique                             │
│  - Load balancing                                            │
└────────┬──────────────────────────┬─────────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐       ┌──────────────────────┐
│  CréaVisuel     │       │  Chat Standalone     │
│  SaaS App       │       │  (legacy, migration  │
│  (nginx:alpine) │       │   vers SaaS)         │
└────────┬────────┘       └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              REACT 18 APPLICATION (SPA)                      │
│  ┌──────────────────┐        ┌─────────────────┐            │
│  │   Admin Panel    │        │   Client App    │            │
│  │  (B2Santos)      │        │  (Subdomains)   │            │
│  │                  │        │                 │            │
│  │ • Clients CRUD   │        │ • Dashboard     │            │
│  │ • Templates      │        │ • Chat IA       │            │
│  │ • Analytics      │        │ • Library       │            │
│  └──────────────────┘        │ • Templates     │            │
│                              │ • Tools         │            │
│                              └─────────────────┘            │
└────────┬────────────────────────────────┬───────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────────────────┐  ┌──────────────────────┐
│      SUPABASE               │  │  NCAT API            │
│  - PostgreSQL (RLS)         │  │  (Render Tools)      │
│  - Auth                     │  │  - Image gen         │
│  - Storage (assets)         │  │  - Video gen         │
│  - Edge Functions (future)  │  │  - Audio gen         │
└─────────────────────────────┘  └──────────────────────┘
```

---

## 🔄 Flow Routing Multi-Tenant

### 1. Requête Entrante

```
User browser → https://jeffterra.creavisuel.pro
```

### 2. DNS Resolution

```
DNS Lookup: jeffterra.creavisuel.pro
↓
Hostinger DNS:
  *.creavisuel.pro → A record → 46.202.175.252
↓
Resolves to: 46.202.175.252:443
```

### 3. Traefik Routing

```
Traefik reçoit requête HTTPS
↓
Check Host header: "jeffterra.creavisuel.pro"
↓
Match rule: HostRegexp(`^[a-z0-9-]+\.creavisuel\.pro$$`)
↓
Route vers service: creavisuel-saas (container nginx)
↓
Génère certificat SSL si pas déjà existant (Let's Encrypt)
```

**Labels Traefik:**
```yaml
traefik.http.routers.saas.rule=
  Host(`creavisuel.pro`) || 
  Host(`www.creavisuel.pro`) || 
  HostRegexp(`^[a-z0-9-]+\.creavisuel\.pro$$`)
```

### 4. Nginx Reverse Proxy

```
Nginx container reçoit requête
↓
Location matching:
  /api/*     → Proxy to 172.18.0.1:3001 (NCAT API)
  /static/*  → Proxy to 172.18.0.1:3001
  /*         → Serve /usr/share/nginx/html/index.html
```

**nginx.conf:**
```nginx
location / {
  try_files $uri $uri/ /index.html;  # SPA fallback
}
```

### 5. React Application Load

```
Browser loads index.html
↓
Executes JS bundle: /assets/index-CdT_1zaE.js
↓
React app boots
↓
TenantProvider initializes
```

### 6. TenantContext Logic

```typescript
// 1. Extract subdomain
const hostname = window.location.hostname;
// "jeffterra.creavisuel.pro"

const parts = hostname.split('.');
// ["jeffterra", "creavisuel", "pro"]

const subdomain = parts[0];
// "jeffterra"

// 2. Fetch tenant from Supabase
const { data: tenant } = await supabase
  .from('tenants')
  .select('*')
  .eq('slug', 'jeffterra')
  .single();

// 3. Fetch tenant config
const { data: config } = await supabase
  .from('tenant_configs')
  .select('*')
  .eq('tenant_id', tenant.id)
  .single();

// 4. Apply branding
document.documentElement.style.setProperty('--primary', config.branding.primaryColor);
document.title = `${config.branding.companyName} | ${config.branding.assistantName}`;

// 5. Provide to app
<TenantContext.Provider value={{ tenant, config }}>
  <ClientApp />
</TenantContext.Provider>
```

### 7. Conditional Rendering

```typescript
// router.tsx
const AppRouter = () => {
  const { tenant, isLoading } = useTenant();
  
  if (isLoading) return <LoadingScreen />;
  
  // No subdomain (creavisuel.pro) → Admin Panel
  if (!tenant) {
    return <AdminApp />;
  }
  
  // Subdomain detected → Client App
  return <ClientApp tenant={tenant} />;
};
```

---

## 📦 Structure Base de Données

### Tables Supabase

#### `tenants` (Clients SaaS)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- Subdomain
  name TEXT NOT NULL,                 -- Company name
  owner_email TEXT,
  status TEXT DEFAULT 'trial',        -- trial|active|suspended
  plan_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
```

#### `tenant_configs` (Branding + IA)
```sql
CREATE TABLE tenant_configs (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  branding JSONB,         -- Colors, logos, fonts
  ai_config JSONB,        -- Tone, prompts, webhook
  pwa_config JSONB,       -- Manifest data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemple `branding` JSONB:**
```json
{
  "primaryColor": "#10b981",
  "accentColor": "#8b5cf6",
  "backgroundColor": "#0a0e27",
  "foregroundColor": "#ffffff",
  "companyName": "Salon Jeff Terra",
  "logoUrl": "https://supabase.../client-assets/logos/123.png",
  "faviconUrl": "https://supabase.../client-assets/favicons/123.ico",
  "assistantName": "Assistant IA",
  "welcomeMessage": "Bienvenue chez Salon Jeff Terra",
  "fontPrimary": "Inter",
  "fontSecondary": "Poppins"
}
```

**Exemple `ai_config` JSONB:**
```json
{
  "webhookUrl": "https://n8n.creavisuel.pro/webhook/jeffterra",
  "systemPrompt": "Tu es un assistant IA pour Salon Jeff Terra, spécialisé en coiffure...",
  "tone": "friendly",
  "temperature": 0.7,
  "maxTokens": 2000,
  "editorialStrategy": "Posts inspirants 3x/semaine, focus tendances coiffure"
}
```

#### `image_templates` (Studio Templates)
```sql
CREATE TABLE image_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),  -- NULL = global template
  name TEXT NOT NULL,
  category TEXT,                          -- 'social_post' | 'blog' | 'image'
  config JSONB,                           -- Canvas layers + props
  is_global BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemple `config` JSONB:**
```json
{
  "width": 1200,
  "height": 630,
  "backgroundColor": "#0a0e27",
  "layers": [
    {
      "id": "layer_text_1",
      "type": "text",
      "content": "Salon Jeff Terra",
      "x": 100,
      "y": 100,
      "fontSize": 48,
      "fontFamily": "Inter",
      "color": "#ffffff",
      "fontWeight": "bold",
      "rotation": 0
    },
    {
      "id": "layer_rect_1",
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 1100,
      "height": 530,
      "fillColor": "rgba(16, 185, 129, 0.1)",
      "strokeColor": "#10b981",
      "strokeWidth": 2
    }
  ]
}
```

#### RLS Policies

**Isolation multi-tenant:**
```sql
-- Policy: Users can only see their tenant data
CREATE POLICY tenant_isolation ON tenants
FOR SELECT USING (
  id IN (
    SELECT tenant_id FROM tenant_configs 
    WHERE tenant_id = current_setting('app.tenant_id')::UUID
  )
);

-- Admin bypass
CREATE POLICY admin_all_access ON tenants
FOR ALL USING (
  current_setting('app.user_role') = 'admin'
);
```

**Note:** Dans la pratique actuelle, on utilise `service_role` key qui bypass toutes RLS.

---

## 🔐 Authentification & Sécurité

### Service Role Pattern

**Frontend (public):**
```typescript
// src/shared/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY  // Anon key (RLS enforced)
);
```

**Backend Admin (server-like):**
```typescript
// src/shared/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,  // Service role (bypass RLS)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**Règle d'usage:**
- ✅ `supabase` pour reads user data (conversations, messages)
- ✅ `supabaseAdmin` pour CRUD tenants, configs, admin operations
- ❌ JAMAIS exposer `SERVICE_ROLE_KEY` au frontend

---

## 🎨 Système de Branding Dynamique

### 1. CSS Variables Base (Tailwind)

**tailwind.config.ts:**
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        accent: 'hsl(var(--accent))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      }
    }
  }
}
```

### 2. Application Dynamique (TenantContext)

```typescript
const applyBranding = (config: TenantConfig) => {
  const root = document.documentElement;
  const { branding } = config;
  
  // Override Tailwind CSS variables
  if (branding.primaryColor) {
    root.style.setProperty('--primary', branding.primaryColor);
  }
  if (branding.accentColor) {
    root.style.setProperty('--accent', branding.accentColor);
  }
  
  // Document metadata
  if (branding.companyName) {
    document.title = `${branding.companyName} | ${branding.assistantName}`;
  }
  
  // Favicon
  if (branding.faviconUrl) {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = branding.faviconUrl;
  }
};
```

### 3. Utilisation dans Composants

```tsx
const ClientDashboard = () => {
  const branding = useBranding();
  
  return (
    <div className="bg-background text-foreground">
      <h1 style={{ color: branding.primaryColor }}>
        {branding.companyName}
      </h1>
      <img src={branding.logoUrl} alt="Logo" />
    </div>
  );
};
```

**Résultat:** Chaque client voit son propre branding sans rebuild!

---

## 📂 Filesystem & Docker Volumes

### Structure Production

```
VPS 46.202.175.252
├── /root/creavisuel-saas/          # Code source
│   ├── dist/                       # Build production
│   │   ├── index.html
│   │   └── assets/
│   │       ├── index-CdT_1zaE.js   # App bundle
│   │       └── index-DTiE-s-R.css  # Styles
│   ├── src/                        # Source TypeScript
│   ├── nginx.conf                  # Nginx config
│   └── package.json
│
├── /opt/ncat/                      # Docker orchestration
│   ├── docker-compose.yml          # Main config
│   └── .env                        # Environment vars
│
└── /var/lib/docker/volumes/        # Docker volumes
    ├── ncat_traefik_data/          # SSL certs
    └── ...
```

### Docker Compose Mapping

```yaml
services:
  creavisuel-saas:
    image: nginx:alpine
    volumes:
      - /root/creavisuel-saas/dist:/usr/share/nginx/html:ro
      - /root/creavisuel-saas/nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

**Flow:**
1. Build: `npm run build` → génère `/root/creavisuel-saas/dist/`
2. Nginx sert fichiers depuis mount read-only
3. Hot reload: Rebuild + recreate container

---

## 🔌 API Integration

### NCAT Render API

**Localisation:** Container `ncat-ncat-1` sur port 3001

**Endpoints:**
```
POST /api/render/image
POST /api/render/video
POST /api/audio/generate
GET  /static/renders/{id}.png
```

**Proxy Nginx:**
```nginx
location ^~ /api/ {
  proxy_pass http://172.18.0.1:3001/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

**Usage depuis React:**
```typescript
const generateImage = async (template: Template) => {
  const response = await fetch('/api/render/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template.config)
  });
  
  const { imageUrl } = await response.json();
  return imageUrl;  // /static/renders/123.png
};
```

---

## 🚀 Déploiement

### Build Production

```bash
cd /root/creavisuel-saas
npm run build
```

**Vite build output:**
```
vite v6.0.0 building for production...
✓ 245 modules transformed.
dist/index.html                  1.31 kB │ gzip: 0.52 kB
dist/assets/index-CdT_1zaE.js  542.10 kB │ gzip: 178.23 kB
dist/assets/index-DTiE-s-R.css  89.45 kB │ gzip: 18.67 kB
```

### Container Update

```bash
cd /opt/ncat
docker-compose up -d --force-recreate creavisuel-saas
```

**Ce qui se passe:**
1. Arrête container existant
2. Crée nouveau container avec image `nginx:alpine`
3. Monte volumes `/root/creavisuel-saas/dist` et `nginx.conf`
4. Applique labels Traefik
5. Démarre container
6. Traefik détecte nouveau container et route traffic

### Zero-Downtime (future)

**Avec Traefik health checks:**
```yaml
labels:
  - "traefik.http.services.saas.loadbalancer.healthcheck.path=/health"
  - "traefik.http.services.saas.loadbalancer.healthcheck.interval=10s"
```

---

## 📊 Monitoring & Logs

### Traefik Logs

```bash
# Voir traffic en temps réel
docker logs -f ncat-traefik-1

# Filtrer erreurs
docker logs ncat-traefik-1 2>&1 | grep -i error

# SSL cert generation
docker logs ncat-traefik-1 2>&1 | grep -i acme
```

### Application Logs

```bash
# Nginx access logs
docker exec ncat-creavisuel-saas-1 tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec ncat-creavisuel-saas-1 tail -f /var/log/nginx/error.log
```

### Supabase Logs

Via Dashboard: https://supabase.lecoach.digital → Logs

---

## 🔮 Évolutions Futures

### Phase 2-3 (Court Terme)

- [ ] Analytics Dashboard admin
- [ ] Client Dashboard UI complet
- [ ] Migration Chat depuis chatn8n-media-hub
- [ ] Content Library avec filtres
- [ ] Templates avec formulaires dynamiques

### Phase 4-6 (Moyen Terme)

- [ ] OAuth intégration (Facebook, Instagram, LinkedIn)
- [ ] Automation scheduling
- [ ] Email notifications
- [ ] Supabase Edge Functions pour webhook proxy

### Architecture Future

```
Current:
Browser → Traefik → Nginx → React SPA
                            ↓
                         Supabase

Future (Serverless):
Browser → Traefik → Supabase Edge Functions → React SPA
                            ↓
                    PostgreSQL + Auth + Storage
```

**Avantages:**
- Pas de gestion serveur Nginx
- Edge Functions = backend serverless
- Auto-scaling
- Logs centralisés

---

**Dernière mise à jour:** 2025-12-07 02:00 UTC
**Auteur:** Documentation technique automatique
