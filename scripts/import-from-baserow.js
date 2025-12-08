#!/usr/bin/env node

/**
 * Import clients data from Baserow to Supabase
 * Table: Clients-donnes (ID: 814)
 */

import { createClient } from '@supabase/supabase-js';

const BASEROW_URL = 'https://baserow.lecoach.digital';
const BASEROW_TOKEN = 'K83XsQKY35KXx1qp27iS9XZsYdx5PvZa';
const TABLE_ID = '814';

const SUPABASE_URL = 'https://supabase.lecoach.digital';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjQ3OTMwNjcsImV4cCI6MjA4MDE1MzA2N30.VRseImlnW5TTquG91vD6xg5WB4IQ760iAshWjajwttE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fetchBaserowData() {
  console.log('📥 Récupération des données depuis Baserow...\n');

  try {
    const response = await fetch(`${BASEROW_URL}/api/database/rows/table/${TABLE_ID}/?user_field_names=true&size=200`, {
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Baserow API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.results;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération Baserow:', error.message);
    throw error;
  }
}

async function importClients(baserowData) {
  console.log(`📊 ${baserowData.length} clients trouvés dans Baserow\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of baserowData) {
    try {
      // Extract Baserow fields
      const idClient = row['ID-Client'] || '';
      const email = row['E-mail'] || '';
      const actif = row['Actif'] || false;
      const telephone = row['Téléphone'] || '';
      const role = row['Role']?.value || 'Client';
      const webhookUrl = row['webhook_url'] || '';

      // Determine name from ID-Client or email
      let name = idClient.trim();
      if (!name && email) {
        name = email.split('@')[0]; // Use email username as fallback
      }
      if (!name) {
        console.log(`   ⏭️  Ligne ${row.id} ignorée: pas de nom ou email`);
        skipped++;
        continue;
      }

      // Only import Admin and Client roles (skip Prospect and Partenaire)
      if (role !== 'Admin' && role !== 'Client') {
        console.log(`   ⏭️  ${name} ignoré: role = ${role}`);
        skipped++;
        continue;
      }

      console.log(`\n➡️  Import: ${name} (${email || 'pas d\'email'})...`);

      // Generate slug
      const slug = generateSlug(name);

      // Map Baserow data to Supabase schema
      const clientData = {
        slug,
        name,
        status: actif ? 'active' : 'suspended',
      };

      // Check if client already exists
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', clientData.slug)
        .single();

      if (existing) {
        console.log(`   ⏭️  Client "${clientData.name}" existe déjà (slug: ${clientData.slug})`);
        skipped++;
        continue;
      }

      // Insert tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert(clientData)
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Insert tenant_config
      const { error: configError } = await supabase
        .from('tenant_configs')
        .insert({
          tenant_id: tenant.id,
          branding: {
            primaryColor: '#00d4ff',
            accentColor: '#8a2be2',
            backgroundColor: '#0a0e27',
            foregroundColor: '#ffffff',
            companyName: name,
            assistantName: 'Assistant IA',
            welcomeMessage: `Bienvenue sur ${name}`,
            logoUrl: '',
            faviconUrl: '',
          },
          ai_config: {
            webhookUrl: webhookUrl || '',
            systemPrompt: `Tu es un assistant IA pour ${name}.`,
            tone: 'professional',
            temperature: 0.7,
            maxTokens: 2000,
            editorialStrategy: '',
          }
        });

      if (configError) throw configError;

      console.log(`   ✅ Client "${clientData.name}" importé avec succès`);
      console.log(`      → Slug: ${slug}`);
      console.log(`      → Status: ${clientData.status}`);
      console.log(`      → Role: ${role}`);
      if (email) console.log(`      → Email: ${email}`);
      if (telephone) console.log(`      → Téléphone: ${telephone}`);
      if (webhookUrl) console.log(`      → Webhook: ${webhookUrl}`);

      imported++;

    } catch (error) {
      console.error(`   ❌ Erreur import client:`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(60));
  console.log(`✅ Importés:  ${imported}`);
  console.log(`⏭️  Ignorés:   ${skipped} (déjà existants ou non éligibles)`);
  console.log(`❌ Erreurs:   ${errors}`);
  console.log(`📦 Total:     ${baserowData.length}`);
  console.log('='.repeat(60) + '\n');

  if (imported > 0) {
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Vérifiez les clients importés dans Supabase');
    console.log('   2. Configurez les sous-domaines Hostinger pour chaque client');
    console.log('   3. Personnalisez le branding de chaque client dans l\'interface admin\n');
  }
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

// Main execution
(async () => {
  try {
    console.log('🚀 Import Baserow → Supabase');
    console.log('='.repeat(60));
    console.log(`📍 Source: ${BASEROW_URL}`);
    console.log(`📋 Table: Clients-donnes (ID: ${TABLE_ID})`);
    console.log(`🎯 Destination: ${SUPABASE_URL}`);
    console.log('='.repeat(60) + '\n');

    const baserowData = await fetchBaserowData();

    if (!baserowData || baserowData.length === 0) {
      console.log('⚠️  Aucune donnée trouvée dans Baserow');
      return;
    }

    // Display first row structure to verify
    console.log('📋 Premier enregistrement Baserow:');
    console.log('─'.repeat(60));
    console.log(`ID-Client: ${baserowData[0]['ID-Client']}`);
    console.log(`E-mail: ${baserowData[0]['E-mail']}`);
    console.log(`Actif: ${baserowData[0]['Actif']}`);
    console.log(`Role: ${baserowData[0]['Role']?.value}`);
    console.log(`Webhook: ${baserowData[0]['webhook_url']}`);
    console.log('─'.repeat(60) + '\n');

    // Ask for confirmation
    console.log('⚠️  ATTENTION: Cet import va créer des enregistrements dans Supabase');
    console.log('Voulez-vous continuer? (Tapez "oui" puis Entrée, ou Ctrl+C pour annuler)\n');

    // Wait for user input
    process.stdin.setEncoding('utf8');
    const confirmation = await new Promise((resolve) => {
      process.stdin.once('data', (data) => resolve(data.toString().trim()));
    });

    if (confirmation.toLowerCase() !== 'oui') {
      console.log('\n❌ Import annulé par l\'utilisateur\n');
      process.exit(0);
    }

    console.log('\n🔄 Démarrage de l\'import...\n');
    await importClients(baserowData);

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
})();
