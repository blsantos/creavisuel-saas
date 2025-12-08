# 🎨 CréaVisuel SaaS - Plateforme Multi-Tenant d'Assistants IA

Plateforme SaaS multi-tenant pour la création et gestion d'assistants IA personnalisés par client, avec chat intelligent, génération de contenu et gestion automatisée.

## 🚀 Fonctionnalités

### Pour les Clients (Tenant)
- ✅ **Chat IA personnalisé** - Assistant conversationnel adapté à chaque client
- ✅ **Mémoire contextuelle** - L'IA se souvient des conversations précédentes
- ✅ **Historique complet** - Toutes les conversations sauvegardées dans Supabase
- ✅ **Multi-langue** - Support français et portugais
- ✅ **PWA** - Installation comme application mobile
- ✅ **Partage** - iframe, widget (à venir), lien direct
- 🔄 **RAG (À venir)** - Base de connaissance personnalisée par client

### Pour les Super Admin
- ✅ **Multi-tenant** - Gestion de plusieurs clients depuis un seul compte
- ✅ **Configuration IA** - System prompt, ton, modèle par client
- ✅ **Plans tarifaires** - Gestion des features par plan (Free, Starter, Pro, Enterprise)
- ✅ **Branding** - Logo, couleurs, nom d'assistant personnalisés
- ✅ **Analytics** - Suivi des conversations et usage
- ✅ **Webhook N8N** - Chaque client peut avoir son propre workflow

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Supabase (Database + Auth + Storage)
    ↓
N8N Workflow (Webhook)
    ↓
OpenAI Assistant + Tools
    ↓
Redis (Memory courte)
    ↓
Supabase (Memory longue)
```

## 📦 Stack Technique

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build rapide
- **TailwindCSS** - Styling
- **Shadcn/ui** - Components
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Supabase Client** - Backend integration

### Backend
- **Supabase** - Database PostgreSQL + Auth + Storage
- **N8N** - Workflow automation
- **Redis** - Cache et mémoire courte
- **OpenAI** - GPT-4o-mini
- **Cloudinary** - CDN pour images

## 📚 Documentation

- [**Workflow N8N Guide**](./docs/WORKFLOW-N8N-GUIDE.md) - Configuration détaillée du workflow
- [SQL Schema](./docs/SQL-SCHEMA.sql) - Schéma complet de la base de données
- [API Reference](./docs/API.md) - Documentation de l'API (à venir)
- [Deployment Guide](./docs/DEPLOYMENT.md) - Guide de déploiement complet (à venir)

## 🚀 Quick Start

### 1. Cloner le repo
```bash
git clone https://github.com/votre-username/creavisuel-saas.git
cd creavisuel-saas
npm install
```

### 2. Configuration
```bash
cp .env.example .env
# Éditer .env avec vos credentials Supabase
```

### 3. Build & Run
```bash
npm run build
docker-compose up -d
```

## 🎨 Personnalisation avec Lovable

Le frontend peut être personnalisé visuellement avec [Lovable.dev](https://lovable.dev) :

1. Pousser le code sur GitHub
2. Connecter le repo à Lovable
3. Utiliser l'éditeur visuel pour modifier le design
4. Les changements sont poussés automatiquement
5. Rebuild et redéployer

## 📄 Licence

MIT License

## 👥 Contact

- **Email** : contact@b2santos.fr
- **Demo** : https://jeffterra.creavisuel.pro

---

**Made with ❤️ by B2Santos**
