#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { data, error } = await supabase.from('image_templates').select('id, name, category, tenant_id');

if (error) {
  console.error('❌ Erreur:', error.message);
} else {
  console.log('✅ Templates trouvés:', data ? data.length : 0);
  if (data && data.length > 0) {
    data.forEach(t => console.log('  -', t.name, '(' + t.category + ')'));
  } else {
    console.log('⚠️  Aucun template trouvé dans la base');
  }
}
