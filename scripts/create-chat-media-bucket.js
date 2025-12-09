#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.lecoach.digital';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans les variables d\'environnement');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChatMediaBucket() {
  console.log('🔍 Checking if chat-media bucket exists...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    process.exit(1);
  }

  const existingBucket = buckets.find(b => b.name === 'chat-media');

  if (existingBucket) {
    console.log('✅ Bucket chat-media already exists!');
    return;
  }

  console.log('📦 Creating chat-media bucket...');

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('chat-media', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
  });

  if (error) {
    console.error('❌ Error creating bucket:', error);
    process.exit(1);
  }

  console.log('✅ Bucket chat-media created successfully!', data);

  // Set public policy
  console.log('🔓 Setting public access policy...');

  const { error: policyError } = await supabase.rpc('create_storage_policy', {
    bucket_name: 'chat-media',
    policy_name: 'Public Access',
    definition: 'true'
  }).catch(() => {
    console.log('⚠️  Could not set policy via RPC, bucket is already public');
  });

  console.log('🎉 Setup complete!');
}

createChatMediaBucket().catch(console.error);
