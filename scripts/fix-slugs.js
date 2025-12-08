#!/usr/bin/env node

/**
 * Fix tenant slugs - Convert UUIDs to readable slugs based on emails/names
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://supabase.lecoach.digital';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjQ3OTMwNjcsImV4cCI6MjA4MDE1MzA2N30.VRseImlnW5TTquG91vD6xg5WB4IQ760iAshWjajwttE';

// Baserow data mapping (from import)
const CLIENT_EMAILS = {
  '08e1ad91-7828-4334-88de-98d0ed82a8fa': 'lyeschallal35@gmail.com',
  'd4f6f57a-78c7-495a-bebe-b812b10c230a': 'jeffterra@yahoo.com',
  '965a9560-3559-4e86-880f-3b50aaa387b5': 'pouchardmireille@gmail.com',
  '783df194-9df7-4aed-898f-9853989f441f': 'contact@parlonsportugais.fr',
  'contact': 'contact@b2santos.fr',
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function generateSlugFromEmail(email) {
  // Extract username from email
  const username = email.split('@')[0];

  // Clean and normalize
  return username
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/[0-9]+$/g, '') // Remove trailing numbers
    .substring(0, 50); // Limit length
}

async function fixSlugs() {
  console.log('🔧 Correction des slugs clients\n');
  console.log('='.repeat(60));

  try {
    // Get all tenants
    const { data: tenants, error: fetchError } = await supabase
      .from('tenants')
      .select('id, slug, name')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`📊 ${tenants.length} clients trouvés\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const tenant of tenants) {
      const oldSlug = tenant.slug;

      // Skip if already a good slug (not UUID and not "admin" or "test")
      if (!oldSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) &&
          oldSlug !== 'admin' && oldSlug !== 'test') {
        console.log(`⏭️  ${tenant.name} (${oldSlug}) - slug déjà correct`);
        skipped++;
        continue;
      }

      // Get email from mapping
      const email = CLIENT_EMAILS[oldSlug];
      if (!email) {
        console.log(`⚠️  ${tenant.name} (${oldSlug}) - pas d'email trouvé, ignoré`);
        skipped++;
        continue;
      }

      // Generate new slug from email
      let newSlug = generateSlugFromEmail(email);

      // Handle domain-based slugs (like parlonsportugais)
      if (email.includes('@') && !email.includes('gmail') && !email.includes('yahoo')) {
        const domain = email.split('@')[1].split('.')[0];
        if (domain && domain.length > 3) {
          newSlug = domain;
        }
      }

      console.log(`\n🔄 ${tenant.name}`);
      console.log(`   Ancien: ${oldSlug}`);
      console.log(`   Email:  ${email}`);
      console.log(`   Nouveau: ${newSlug}`);

      // Check if new slug already exists
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', tenant.id)
        .single();

      if (existing) {
        // Add number suffix if conflict
        let counter = 2;
        let uniqueSlug = `${newSlug}${counter}`;

        while (true) {
          const { data: conflict } = await supabase
            .from('tenants')
            .select('id')
            .eq('slug', uniqueSlug)
            .single();

          if (!conflict) {
            newSlug = uniqueSlug;
            break;
          }
          counter++;
          uniqueSlug = `${newSlug}${counter}`;
        }

        console.log(`   ⚠️  Conflit détecté, utilisation de: ${newSlug}`);
      }

      // Update slug
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ slug: newSlug })
        .eq('id', tenant.id);

      if (updateError) {
        console.log(`   ❌ Erreur: ${updateError.message}`);
        errors++;
      } else {
        console.log(`   ✅ Slug mis à jour avec succès`);
        updated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ Mis à jour:  ${updated}`);
    console.log(`⏭️  Ignorés:     ${skipped}`);
    console.log(`❌ Erreurs:     ${errors}`);
    console.log(`📦 Total:       ${tenants.length}`);
    console.log('='.repeat(60) + '\n');

    if (updated > 0) {
      console.log('💡 Nouveaux URLs des clients:');
      const { data: updatedTenants } = await supabase
        .from('tenants')
        .select('slug, name')
        .order('created_at', { ascending: false })
        .limit(10);

      if (updatedTenants) {
        updatedTenants.forEach(t => {
          console.log(`   https://${t.slug}.creavisuel.pro - ${t.name}`);
        });
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Run
fixSlugs();
