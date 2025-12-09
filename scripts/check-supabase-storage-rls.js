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

async function checkStorageRLS() {
  console.log('\n🔍 Checking Supabase Storage Configuration...\n');

  // 1. List buckets
  console.log('📦 Listing all storage buckets:');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError);
    return;
  }

  buckets.forEach(bucket => {
    console.log(`  - ${bucket.name}`);
    console.log(`    Public: ${bucket.public}`);
    console.log(`    File size limit: ${bucket.file_size_limit ? (bucket.file_size_limit / 1024 / 1024) + 'MB' : 'No limit'}`);
    console.log(`    Allowed MIME types: ${bucket.allowed_mime_types || 'All'}`);
  });

  // 2. Check chat-media bucket specifically
  const chatMediaBucket = buckets.find(b => b.name === 'chat-media');

  if (!chatMediaBucket) {
    console.log('\n❌ chat-media bucket not found!');
    return;
  }

  console.log('\n✅ chat-media bucket exists');

  // 3. Try to query RLS policies from storage schema
  console.log('\n🔒 Checking RLS policies on storage.objects table:');

  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        ORDER BY policyname;
      `
    })
    .catch(e => ({ data: null, error: e }));

  if (policiesError || !policies) {
    console.log('⚠️  Cannot query RLS policies directly (requires exec_sql function)');
    console.log('   You can check policies manually in Supabase Dashboard:');
    console.log('   → Storage → chat-media → Policies');
  } else {
    console.log('Policies found:');
    console.log(JSON.stringify(policies, null, 2));
  }

  // 4. Test upload with service role (should always work)
  console.log('\n🧪 Testing upload with service_role key:');

  const testFileName = `test-${Date.now()}.txt`;
  const testContent = new Blob(['Hello from diagnostic script'], { type: 'text/plain' });

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-media')
    .upload(`test/${testFileName}`, testContent);

  if (uploadError) {
    console.log('❌ Upload failed even with service_role:');
    console.log('   Error:', uploadError.message);

    if (uploadError.message.includes('infinite recursion')) {
      console.log('\n💡 DIAGNOSIS: The RLS policies on storage.objects reference');
      console.log('   a table (likely muro_users) that has circular RLS dependencies.');
      console.log('\n📋 SOLUTIONS:');
      console.log('   1. Disable RLS temporarily on chat-media bucket to test');
      console.log('   2. Simplify RLS policies to not reference other tables');
      console.log('   3. Fix the circular RLS issue in the referenced table');
    }
  } else {
    console.log('✅ Upload successful with service_role!');
    console.log('   Path:', uploadData.path);

    // Clean up test file
    await supabase.storage.from('chat-media').remove([`test/${testFileName}`]);
    console.log('   (Test file cleaned up)');
  }

  console.log('\n✨ Diagnostic complete!\n');
}

checkStorageRLS().catch(console.error);
