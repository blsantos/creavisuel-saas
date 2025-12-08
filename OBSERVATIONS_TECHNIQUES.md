# Observations Techniques Importantes - CréaVisuel SaaS

**Date:** 2025-12-07
**Auteur:** Documentation automatique

---

## 🔴 PIÈGES CRITIQUES À ÉVITER

### 1. ⚠️ Traefik v3 - Syntaxe HostRegexp

**PIÈGE:** Utiliser l'ancienne syntaxe Traefik v2 pour HostRegexp

**❌ NE FONCTIONNE PAS:**
```yaml
HostRegexp(`{subdomain:[a-z0-9-]+}.creavisuel.pro`)
```

**✅ CORRECT (v3.4.4):**
```yaml
HostRegexp(`^[a-z0-9-]+\\.creavisuel\\.pro$$`)
```

**Symptômes si erreur:**
- Tous subdomains retournent 404
- Traefik ne route pas les requêtes
- Logs Traefik ne montrent aucune erreur

**Solution:** Toujours utiliser regex pure avec double échappement `\\.` et double `$$` à la fin.

---

### 2. ⚠️ Supabase RLS - Service Role Required

**PIÈGE:** Utiliser le client Supabase normal pour opérations admin

**❌ NE FONCTIONNE PAS:**
```typescript
import { supabase } from '@/shared/integrations/supabase/client';

// ❌ ERROR 42501 - RLS policy violation
await supabase.from('tenants').insert({ slug: 'test', name: 'Test' });
await supabase.from('tenants').delete().eq('id', tenantId);
await supabase.from('tenant_configs').update({...}).eq('tenant_id', id);
```

**✅ CORRECT:**
```typescript
import { supabaseAdmin } from '@/shared/lib/supabase-admin';

// ✅ Bypass RLS avec service_role
await supabaseAdmin.from('tenants').insert({ slug: 'test', name: 'Test' });
await supabaseAdmin.from('tenants').delete().eq('id', tenantId);
await supabaseAdmin.from('tenant_configs').update({...}).eq('tenant_id', id);
```

**Symptômes si erreur:**
- Error code: 42501
- Message: "new row violates row-level security policy"
- Opération échoue silencieusement

**Règle:** TOUTES les opérations admin (CRUD clients, configs) doivent utiliser `supabaseAdmin`.

---

### 3. ⚠️ React State - Edit Mode vs Create Mode

**PIÈGE:** Ne pas différencier mode création et édition

**❌ PROBLÈME:**
```typescript
const handleSave = async () => {
  // Toujours INSERT, jamais UPDATE
  await supabase.from('image_templates').insert(data);
};
```

**✅ CORRECT:**
```typescript
const [editingId, setEditingId] = useState<string | null>(null);

const handleSave = async () => {
  if (editingId) {
    // Mode édition - UPDATE
    await supabase.from('image_templates')
      .update(data)
      .eq('id', editingId);
  } else {
    // Mode création - INSERT
    await supabase.from('image_templates')
      .insert(data);
  }
};

const handleLoad = (item) => {
  setEditingId(item.id);  // Activer mode édition
  setFormData(item);
};
```

**Symptômes si erreur:**
- Chaque édition crée un doublon
- Les modifications ne persistent pas
- Base de données pleine de duplicatas

**Solution:** Toujours tracker l'ID de l'item en cours d'édition.

---

### 4. ⚠️ React Remount - Stale Data

**PIÈGE:** Ne pas forcer le remount après modifications

**❌ PROBLÈME:**
```typescript
const [showModal, setShowModal] = useState(false);

const handleClose = () => {
  setShowModal(false);  // Modal fermée mais liste pas rafraîchie
};

return <ClientList />;  // ❌ Même instance, données stale
```

**✅ CORRECT:**
```typescript
const [refreshTrigger, setRefreshTrigger] = useState(0);

const handleClose = () => {
  setShowModal(false);
  setRefreshTrigger(prev => prev + 1);  // Forcer refresh
};

return <ClientList key={refreshTrigger} />;  // ✅ Remount avec nouvelles données
```

**Symptômes si erreur:**
- Modifications invisibles après sauvegarde
- Besoin de F5 pour voir changements
- Cache React affiche vieilles données

**Solution:** Utiliser `key={trigger}` pour forcer remount des composants.

---

### 5. ⚠️ Color Input - Empty String Invalid

**PIÈGE:** Laisser input color vide

**❌ NE FONCTIONNE PAS:**
```typescript
<input 
  type="color" 
  value={formData.primaryColor}  // ❌ Si undefined/null → ERREUR
/>
```

**Erreur browser:** "The specified value "" does not conform to the required format"

**✅ CORRECT:**
```typescript
<input 
  type="color" 
  value={formData.primaryColor || '#10b981'}  // ✅ Fallback requis
/>
```

**Symptômes si erreur:**
- Console pleine d'erreurs validation HTML5
- Color picker ne fonctionne pas
- Formulaire inutilisable

**Solution:** Toujours fournir fallback hexadécimal valide.

---

## 💡 PATTERNS & BEST PRACTICES

### 1. Multi-Tenant Context Pattern

**Structure recommandée:**
```typescript
// 1. Provider au top-level
<BrowserRouter>
  <TenantProvider>
    <AppRouter />
  </TenantProvider>
</BrowserRouter>

// 2. Router conditionnel basé sur tenant
const AppRouter = () => {
  const { tenant, isLoading } = useTenant();
  
  if (isLoading) return <LoadingScreen />;
  if (!tenant) return <AdminApp />;  // Mode admin
  return <ClientApp tenant={tenant} />;  // Mode client
};

// 3. Utilisation dans composants
const MyComponent = () => {
  const { tenant } = useTenant();
  const branding = useBranding();
  
  return <div style={{ color: branding.primaryColor }}>
    Bienvenue chez {tenant.name}
  </div>;
};
```

**Avantages:**
- Un seul fetch tenant (au top)
- Contexte disponible partout
- Re-render automatique si tenant change

---

### 2. Admin Operations Pattern

**Toujours séparer client public et admin:**

```typescript
// ❌ MAUVAIS - Mélanger les deux
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Dans le même composant
await supabase.from('conversations').select();  // OK
await supabaseAdmin.from('tenants').insert();   // Risqué

// ✅ BON - Séparer les responsabilités
// AdminPanel.tsx (backend-like operations)
import { supabaseAdmin } from '@/lib/supabase-admin';
await supabaseAdmin.from('tenants').insert();

// ClientApp.tsx (frontend operations)
import { supabase } from '@/lib/supabase';
await supabase.from('conversations').select();
```

**Règle:** 
- `supabase` → Opérations frontend (SELECT, INSERT user data)
- `supabaseAdmin` → Opérations admin (CRUD tenants, bypass RLS)

---

### 3. Form State Management Pattern

**Pour forms complexes multi-étapes:**

```typescript
interface FormData {
  // Flat structure, pas de nested objects
  slug: string;
  name: string;
  primaryColor: string;
  logoUrl: string;
  // ... tous les champs au même niveau
}

const [formData, setFormData] = useState<FormData>(initialState);

// Helper pour update champs
const updateFormData = <K extends keyof FormData>(
  key: K, 
  value: FormData[K]
) => {
  setFormData(prev => ({ ...prev, [key]: value }));
};

// Usage
<input 
  value={formData.slug} 
  onChange={e => updateFormData('slug', e.target.value)}
/>
```

**Avantages:**
- Type-safe avec TypeScript
- Un seul state pour tout le wizard
- Facile à debugger
- Validation centralisée

---

### 4. File Upload Pattern

**Pattern robuste avec validation:**

```typescript
const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // 1. Validation type
  if (!file.type.startsWith('image/')) {
    toast.error('Format invalide');
    return;
  }
  
  // 2. Validation taille
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) {
    toast.error('Fichier trop lourd (max 2MB)');
    return;
  }
  
  // 3. Upload avec nom unique
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `logos/${fileName}`;
  
  try {
    setUploading(true);
    
    const { data, error } = await supabaseAdmin.storage
      .from('client-assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // 4. Récupérer URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('client-assets')
      .getPublicUrl(path);
    
    updateFormData('logoUrl', publicUrl);
    toast.success('Logo uploadé');
    
  } catch (error) {
    toast.error(error.message);
  } finally {
    setUploading(false);
  }
};
```

---

### 5. Docker Container Update Pattern

**Workflow mise à jour production:**

```bash
# 1. Build local
cd /root/creavisuel-saas
npm run build

# 2. Vérifier build
ls -lah dist/
cat dist/index.html  # Vérifier assets paths

# 3. Backup config important
cp /opt/ncat/docker-compose.yml /opt/ncat/docker-compose.yml.backup

# 4. Recreate container (force pull nouvelle config)
cd /opt/ncat
docker-compose up -d --force-recreate creavisuel-saas

# 5. Vérifier logs
docker logs ncat-creavisuel-saas-1 --tail 50

# 6. Test santé
curl -I https://creavisuel.pro
curl -I https://test.creavisuel.pro
```

**⚠️ NE PAS:**
- Modifier container en direct (exec + edit)
- Oublier le build avant recreate
- Skip les tests après deploy

---

## 🔍 DEBUGGING TIPS

### Subdomain ne charge pas?

**Checklist:**
1. DNS: `dig +short <slug>.creavisuel.pro` → doit retourner 46.202.175.252
2. HTTPS: `curl -k -I https://<slug>.creavisuel.pro` → HTTP/2 200?
3. Traefik labels: `docker inspect ncat-creavisuel-saas-1 | grep "traefik.http.routers.saas.rule"`
4. Syntaxe regex v3? `HostRegexp(\`^[a-z0-9-]+\\.creavisuel\\.pro$$\`)`
5. Container running? `docker ps | grep creavisuel-saas`
6. Tenant existe? Query Supabase `tenants` table

**Si toujours 404:**
```bash
# Force reload Traefik config
cd /opt/ncat
docker-compose restart traefik
```

---

### React app ne détecte pas tenant?

**Debug steps:**

1. **Console browser:**
```javascript
// Dans console DevTools
window.location.hostname  // Doit être "slug.creavisuel.pro"
localStorage  // Check cached tenant data
```

2. **TenantContext:**
```typescript
// Ajouter logs temporaires
const fetchTenant = async () => {
  const subdomain = getSubdomain();
  console.log('🔍 Subdomain detected:', subdomain);
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', subdomain)
    .single();
  
  console.log('📊 Tenant data:', data);
  console.log('❌ Error:', error);
};
```

3. **Supabase RLS:**
```sql
-- Tester query directement dans Supabase SQL Editor
SELECT * FROM tenants WHERE slug = 'jeffterra';
-- Si retourne vide → RLS policy trop stricte
```

---

### Logo upload échoue?

**Debug checklist:**

1. **Bucket existe?**
```bash
# Vérifier via Supabase Dashboard ou:
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
sb.storage.listBuckets().then(r => console.log(r.data));
"
```

2. **Policies correctes?**
- Storage → `client-assets` → Policies
- INSERT: Authenticated users
- SELECT: Public read

3. **Size check:**
```typescript
console.log('File size:', file.size, 'bytes');
console.log('Max allowed:', 2 * 1024 * 1024, 'bytes');
```

---

## 📊 MÉTRIQUES DE PERFORMANCE

### Benchmarks attendus

**Page Load (Lighthouse):**
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >85

**Bundle Sizes:**
- Admin: ~500KB (GrapesJS included)
- Client: ~300KB
- Shared: ~200KB

**API Response Times:**
- Supabase SELECT: <100ms
- Supabase INSERT: <200ms
- Image upload: <2s (2MB file)

**Docker:**
- Build time: ~30s
- Container start: <5s
- Image size: ~150MB

---

## 🔐 SÉCURITÉ

### Secrets Management

**✅ BON:**
```typescript
// .env (gitignored)
VITE_SUPABASE_URL=https://supabase.lecoach.digital
VITE_SUPABASE_ANON_KEY=eyJhbGci...

// Usage
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**⚠️ ACCEPTABLE (temporaire):**
```typescript
// supabase-admin.ts (backend-only, jamais bundled frontend)
const SERVICE_ROLE_KEY = 'eyJhbGci...';  // Hardcoded OK si admin-only
```

**❌ DANGEREUX:**
```typescript
// client-side code
const API_KEY = 'secret123';  // ❌ Exposé dans bundle JS
fetch('https://api.com', {
  headers: { 'Authorization': API_KEY }  // ❌ Visible dans DevTools
});
```

### RLS Policies Best Practices

**Pattern multi-tenant:**
```sql
-- Isolation par tenant_id
CREATE POLICY "Users can only see their tenant data"
ON content_library
FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants 
    WHERE id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
  )
);

-- Admin bypass
CREATE POLICY "Admins see all"
ON content_library
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

---

## 📚 RESSOURCES UTILES

### Documentation Officielle

- Traefik v3: https://doc.traefik.io/traefik/
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- React Context: https://react.dev/reference/react/useContext
- shadcn/ui: https://ui.shadcn.com/

### Troubleshooting

- Traefik Routing: https://doc.traefik.io/traefik/routing/routers/
- Docker Compose: https://docs.docker.com/compose/
- Nginx SPA: https://github.com/facebook/create-react-app/blob/main/packages/cra-template/template/public/index.html

---

**Dernière mise à jour:** 2025-12-07 02:00 UTC
**Maintenu par:** Claude Code + B2Santos Team
