/*
  # Add "Build Your Business in One Day" module
  1. New module 'build_your_business' with sort_order 0 (appears first in sidebar,
     before Certification which is 1). No existing module is changed.
  2. New tool 'byb_passion_analysis' (display name "Monetizable Passion Analysis")
     under this module, route 'byb-passion-analysis', sort_order 1.
  3. Access is granted by admin per client, same as other modules.
*/
INSERT INTO public.modules (name, display_name, description, icon, sort_order)
VALUES (
  'build_your_business',
  'Build Your Business in One Day',
  'Discover your niche and build your business foundation',
  'Rocket',
  0
)
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  v_module_id uuid;
BEGIN
  SELECT id INTO v_module_id
  FROM public.modules
  WHERE name = 'build_your_business'
  LIMIT 1;

  IF v_module_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.tools WHERE name = 'byb_passion_analysis'
  ) THEN
    INSERT INTO public.tools (
      module_id, name, display_name, description, route, icon, sort_order
    ) VALUES (
      v_module_id,
      'byb_passion_analysis',
      'Monetizable Passion Analysis',
      'Upload handwritten notes or screenshots to discover your true passion and monetizable career paths',
      'byb-passion-analysis',
      'FileText',
      1
    );
  END IF;
END $$;