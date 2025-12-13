#!/usr/bin/env node

/**
 * Script pour générer des thumbnails pour les templates
 * Génère une image SVG de preview depuis la config JSON
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Fonction pour générer un SVG depuis la config du template
function generateSVGFromConfig(config) {
  const { width, height, backgroundColor = '#ffffff', layers = [] } = config;

  // Trier les layers par zIndex
  const sortedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  let svgLayers = '';

  for (const layer of sortedLayers) {
    if (layer.type === 'shape') {
      const color = layer.color || '#cccccc';
      svgLayers += `<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${color}" />`;
    } else if (layer.type === 'text') {
      const fontSize = layer.fontSize || 24;
      const fontFamily = layer.fontFamily || 'Arial';
      const fontWeight = layer.fontWeight || '400';
      const color = layer.color || '#000000';
      const textAlign = layer.textAlign || 'left';

      let textAnchor = 'start';
      if (textAlign === 'center') textAnchor = 'middle';
      else if (textAlign === 'right') textAnchor = 'end';

      const content = (layer.content || 'Text').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      svgLayers += `<text x="${layer.x}" y="${layer.y + fontSize}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" fill="${color}" text-anchor="${textAnchor}">${content}</text>`;
    }
    // Pour images et vidéos, on pourrait ajouter un placeholder
    else if (layer.type === 'image') {
      svgLayers += `<rect x="${layer.x}" y="${layer.y}" width="${layer.width || 200}" height="${layer.height || 200}" fill="#e0e0e0" stroke="#999" stroke-width="2" />`;
      svgLayers += `<text x="${layer.x + (layer.width || 200) / 2}" y="${layer.y + (layer.height || 200) / 2}" font-size="16" fill="#666" text-anchor="middle" dominant-baseline="middle">Image</text>`;
    } else if (layer.type === 'video') {
      svgLayers += `<rect x="${layer.x}" y="${layer.y}" width="${layer.width || 200}" height="${layer.height || 200}" fill="#1a1a1a" stroke="#666" stroke-width="2" />`;
      svgLayers += `<text x="${layer.x + (layer.width || 200) / 2}" y="${layer.y + (layer.height || 200) / 2}" font-size="16" fill="#fff" text-anchor="middle" dominant-baseline="middle">▶ Video</text>`;
    }
  }

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}" />
  ${svgLayers}
</svg>`.trim();
}

// Convertir SVG en Data URL
function svgToDataUrl(svg) {
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function generateThumbnails() {
  console.log('🎨 Génération des thumbnails pour les templates...\n');

  try {
    // Récupérer tous les templates sans thumbnail
    const { data: templates, error } = await supabase
      .from('image_templates')
      .select('id, name, config, thumbnail_url')
      .is('thumbnail_url', null);

    if (error) throw error;

    if (!templates || templates.length === 0) {
      console.log('✅ Tous les templates ont déjà des thumbnails !');
      return;
    }

    console.log(`📦 ${templates.length} templates sans thumbnail trouvés\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const template of templates) {
      try {
        console.log(`⏳ Génération pour: ${template.name}`);

        // Générer le SVG
        const svg = generateSVGFromConfig(template.config);
        const dataUrl = svgToDataUrl(svg);

        // Mettre à jour le template avec le thumbnail
        const { error: updateError } = await supabase
          .from('image_templates')
          .update({ thumbnail_url: dataUrl })
          .eq('id', template.id);

        if (updateError) throw updateError;

        console.log(`   ✅ Thumbnail généré pour: ${template.name}`);
        successCount++;

      } catch (err) {
        console.error(`   ❌ Erreur pour ${template.name}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ Réussis: ${successCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📦 Total: ${templates.length}`);

  } catch (error) {
    console.error('❌ Erreur globale:', error.message);
    process.exit(1);
  }
}

// Exécution
generateThumbnails();
