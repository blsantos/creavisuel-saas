-- Test avec un seul template
INSERT INTO image_templates (name, category, tenant_id, config) VALUES
(
  'Test - Coiffure Conseils',
  'custom',
  NULL,
  '{"width": 1080, "height": 1080, "backgroundColor": "#f8e5f0", "layers": [{"id": "bg", "type": "shape", "x": 0, "y": 0, "width": 1080, "height": 1080, "color": "#f8e5f0", "zIndex": 0}, {"id": "title", "type": "text", "content": "CONSEILS BEAUTÉ", "x": 90, "y": 150, "color": "#d946ef", "fontSize": 72, "fontWeight": "700", "fontFamily": "Bebas Neue", "textAlign": "left", "zIndex": 2}]}'::jsonb
);
