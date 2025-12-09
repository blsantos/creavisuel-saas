#!/usr/bin/env node

/**
 * Create Supabase Storage bucket for client assets
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supabase.lecoach.digital';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans les variables d\'environnement');
  console.error('   Ajoutez-le dans votre fichier .env (voir .env.example)');
  process.exit(1);
}

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
