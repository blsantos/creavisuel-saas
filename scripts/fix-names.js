#!/usr/bin/env node

/**
 * Fix tenant names - Convert UUIDs to readable names based on emails
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://supabase.lecoach.digital';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjQ3OTMwNjcsImV4cCI6MjA4MDE1MzA2N30.VRseImlnW5TTquG91vD6xg5WB4IQ760iAshWjajwttE';

// Mapping slug → readable name
const CLIENT_NAMES = {
  'lyeschallal': 'Lyes Challal',
  'jeffterra': 'Salon Jeff Terra',
  'pouchardmireille': 'MSP Design',
  'parlonsportugais': 'Le Bistrot LN',
  'contact': 'B2Santos',
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixNames() {
  console.log('🔧 Correction des noms de clients\n');
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

    for (const tenant of tenants) {
      const slug = tenant.slug;
      const oldName = tenant.name;

      // Get new name from mapping
      const newName = CLIENT_NAMES[slug];

      if (!newName) {
        console.log(`⏭️  ${oldName} (${slug}) - pas de nouveau nom défini`);
        skipped++;
        continue;
      }

      // Skip if already correct
      if (oldName === newName) {
        console.log(`⏭️  ${oldName} - déjà correct`);
        skipped++;
        continue;
      }

      console.log(`\n🔄 Mise à jour du nom`);
      console.log(`   Slug:    ${slug}`);
      console.log(`   Ancien:  ${oldName}`);
      console.log(`   Nouveau: ${newName}`);

      // Update name
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ name: newName })
        .eq('id', tenant.id);

      if (updateError) {
        console.log(`   ❌ Erreur: ${updateError.message}`);
      } else {
        console.log(`   ✅ Nom mis à jour avec succès`);

        // Also update companyName in branding
        const { data: config } = await supabase
          .from('tenant_configs')
          .select('id, branding')
          .eq('tenant_id', tenant.id)
          .single();

        if (config && config.branding) {
          const updatedBranding = {
            ...config.branding,
            companyName: newName
          };

          await supabase
            .from('tenant_configs')
            .update({ branding: updatedBranding })
            .eq('tenant_id', tenant.id);

          console.log(`   ✅ Branding mis à jour`);
        }

        updated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ Mis à jour:  ${updated}`);
    console.log(`⏭️  Ignorés:     ${skipped}`);
    console.log(`📦 Total:       ${tenants.length}`);
    console.log('='.repeat(60) + '\n');

    if (updated > 0) {
      console.log('💡 Clients mis à jour:');
      const { data: updatedTenants } = await supabase
        .from('tenants')
        .select('slug, name')
        .in('slug', Object.keys(CLIENT_NAMES));

      if (updatedTenants) {
        updatedTenants.forEach(t => {
          console.log(`   ✅ ${t.name} → https://${t.slug}.creavisuel.pro`);
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
fixNames();
