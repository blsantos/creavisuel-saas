#!/usr/bin/env node

/**
 * Create Supabase Storage bucket for client assets
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://supabase.lecoach.digital';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjQ3OTMwNjcsImV4cCI6MjA4MDE1MzA2N30.VRseImlnW5TTquG91vD6xg5WB4IQ760iAshWjajwttE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createBucket() {
  console.log('📦 Création du bucket Supabase Storage...\n');

  try {
    // Check if bucket already exists
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const bucketExists = existingBuckets?.some(b => b.name === 'client-assets');

    if (bucketExists) {
      console.log('✅ Le bucket "client-assets" existe déjà\n');
      return;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('client-assets', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    });

    if (error) throw error;

    console.log('✅ Bucket "client-assets" créé avec succès');
    console.log('   → Publique: Oui');
    console.log('   → Taille max: 5MB');
    console.log('   → Types acceptés: PNG, JPEG, GIF, WEBP\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createBucket();
