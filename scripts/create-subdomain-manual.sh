#!/bin/bash
# Script pour créer manuellement un sous-domaine pour un client
# Usage: ./create-subdomain-manual.sh <slug>

SLUG=$1

if [ -z "$SLUG" ]; then
  echo "❌ Usage: ./create-subdomain-manual.sh <slug>"
  echo "   Exemple: ./create-subdomain-manual.sh jeffterra"
  exit 1
fi

DOMAIN="creavisuel.pro"
SUBDOMAIN="${SLUG}.${DOMAIN}"

echo "🌐 Création du sous-domaine: $SUBDOMAIN"
echo "============================================"
echo ""

# 1. Vérifier si le wildcard DNS est configuré
echo "1️⃣  Vérification DNS..."
echo "   → Le wildcard *.creavisuel.pro doit pointer vers 46.202.175.252"
echo "   → Commande: dig *.creavisuel.pro"
echo ""

# 2. Vérifier Traefik
echo "2️⃣  Configuration Traefik..."
echo "   → Traefik est déjà configuré pour le wildcard via:"
echo "   → Rule: Host(\`creavisuel.pro\`) || HostRegexp(\`{subdomain:[a-z0-9-]+}.creavisuel.pro\`)"
echo "   → Service: creavisuel-app (container ncat-creavisuel-saas-1)"
echo ""

# 3. Test du sous-domaine
echo "3️⃣  Test du sous-domaine..."
echo "   → Attendez 1-2 minutes pour la propagation DNS"
echo "   → Testez: curl -I https://$SUBDOMAIN"
echo ""

# 4. Actions à faire manuellement
echo "✅ ACTIONS MANUELLES NÉCESSAIRES:"
echo "============================================"
echo ""
echo "SI le wildcard DNS n'est pas configuré:"
echo "  1. Connectez-vous à Hostinger panel"
echo "  2. Allez dans DNS Zone Editor pour creavisuel.pro"
echo "  3. Ajoutez un enregistrement:"
echo "     Type: A"
echo "     Name: *"
echo "     Value: 46.202.175.252"
echo "     TTL: 14400"
echo ""
echo "SINON (si wildcard DNS déjà configuré):"
echo "  ✓ Le sous-domaine devrait fonctionner automatiquement"
echo "  ✓ Traefik gère le routing automatiquement"
echo "  ✓ Let's Encrypt génère automatiquement le certificat SSL"
echo ""
echo "============================================"
echo "🎯 Test final:"
echo "   curl -I https://$SUBDOMAIN"
echo "============================================"
