#!/usr/bin/env node

/**
 * Script to check and fix database structure
 * Vérifie si les tables tenants et tenant_configs existent
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.lecoach.digital';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NzkzMDU2LCJleHAiOjIwODAxNTMwNTZ9.3PK2meYhQpHE5TSpRC8TP7owHpBfCFXsrTTOuNCtgbc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('🔍 Vérification de la structure de la base de données...\n');

  try {
    // Test 1: Check tenants table
    console.log('1️⃣  Vérification table tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);

    if (tenantsError) {
      console.error('❌ Erreur table tenants:', tenantsError.message);
      console.log('   → La migration 001_create_tenants.sql doit être exécutée\n');
      return;
    } else {
      console.log('✅ Table tenants existe');
      console.log(`   → ${tenants?.length || 0} tenant(s) trouvé(s)\n`);
    }

    // Test 2: Check tenant_configs table
    console.log('2️⃣  Vérification table tenant_configs...');
    const { data: configs, error: configsError } = await supabase
      .from('tenant_configs')
      .select('*')
      .limit(1);

    if (configsError) {
      console.error('❌ Erreur table tenant_configs:', configsError.message);
      console.log('   → La migration 002_create_tenant_configs.sql doit être exécutée\n');
    } else {
      console.log('✅ Table tenant_configs existe');
      console.log(`   → ${configs?.length || 0} config(s) trouvée(s)\n`);
    }

    // Test 3: Check image_templates table
    console.log('3️⃣  Vérification table image_templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('image_templates')
      .select('id, name, tenant_id')
      .limit(5);

    if (templatesError) {
      console.error('❌ Erreur table image_templates:', templatesError.message);
      console.log('   → Les migrations image_templates doivent être exécutées\n');
    } else {
      console.log('✅ Table image_templates existe');
      console.log(`   → ${templates?.length || 0} template(s) trouvé(s)`);
      if (templates && templates.length > 0) {
        templates.forEach(t => {
          console.log(`      - ${t.name} ${t.tenant_id ? '(client)' : '(global)'}`);
        });
      }
      console.log('');
    }

    // Test 4: List all tenants with details
    console.log('4️⃣  Liste des clients (tenants)...');
    const { data: allTenants, error: listError } = await supabase
      .from('tenants')
      .select('id, slug, name, status, created_at')
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Erreur lecture tenants:', listError.message);
    } else {
      console.log(`✅ ${allTenants?.length || 0} client(s) total:`);
      if (allTenants && allTenants.length > 0) {
        allTenants.forEach(t => {
          const date = new Date(t.created_at).toLocaleDateString('fr-FR');
          console.log(`   - ${t.name} (${t.slug}) - ${t.status} - créé le ${date}`);
        });
      } else {
        console.log('   Aucun client trouvé\n');
      }
      console.log('');
    }

    // Test 5: Test insertion (dry run)
    console.log('5️⃣  Test d\'insertion (simulation)...');
    const testSlug = `test-${Date.now()}`;
    const { data: inserted, error: insertError } = await supabase
      .from('tenants')
      .insert({
        slug: testSlug,
        name: 'Test Client',
        status: 'trial'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur lors du test d\'insertion:', insertError.message);
      console.log('   Code:', insertError.code);
      console.log('   Hint:', insertError.hint);
      console.log('\n⚠️  Problèmes possibles:');
      console.log('   1. Les RLS policies bloquent l\'insertion (403 Forbidden)');
      console.log('   2. Authentification requise pour créer des tenants');
      console.log('   3. Contraintes de validation non respectées\n');

      if (insertError.code === '42501') {
        console.log('💡 Solution: Désactiver temporairement les RLS policies:');
        console.log('   ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;\n');
      }
    } else {
      console.log('✅ Test d\'insertion réussi');
      console.log('   → Tenant créé:', inserted.slug);

      // Cleanup: Delete test tenant
      const { error: deleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('slug', testSlug);

      if (deleteError) {
        console.log('   ⚠️  Impossible de supprimer le tenant de test:', deleteError.message);
      } else {
        console.log('   → Tenant de test supprimé\n');
      }
    }

    console.log('\n✅ Vérification terminée!\n');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Run check
checkDatabase();
