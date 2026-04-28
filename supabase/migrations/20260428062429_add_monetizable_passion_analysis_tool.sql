/*
  # Add Monetizable Passion Analysis Tool to Monetization Module

  1. Changes
    - Adds "Monetizable Passion Analysis" tool to the Monetization module
    - Tool route: monetizable-passion-analysis
    - Icon: FileText
    - Description: Upload handwritten notes or screenshots to discover true passion and monetizable career paths
    - Sort order: 3 (after existing Monetization tools)

  2. Notes
    - Tool respects existing module-level permissions
    - Uses the same enable/disable pattern as other tools in the system
    - Requires admin to grant access per client
*/

DO $$
DECLARE
  v_monetization_module_id uuid;
BEGIN
  SELECT id INTO v_monetization_module_id
  FROM modules
  WHERE name = 'monetization'
  LIMIT 1;

  IF v_monetization_module_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM tools
      WHERE module_id = v_monetization_module_id
      AND name = 'monetizable_passion_analysis'
    ) THEN
      INSERT INTO tools (
        module_id,
        name,
        display_name,
        description,
        route,
        icon,
        sort_order
      ) VALUES (
        v_monetization_module_id,
        'monetizable_passion_analysis',
        'Monetizable Passion Analysis',
        'Upload handwritten notes or screenshots to discover true passion and monetizable career paths',
        'monetizable-passion-analysis',
        'FileText',
        3
      );

      RAISE NOTICE 'Monetizable Passion Analysis tool added successfully';
    ELSE
      RAISE NOTICE 'Monetizable Passion Analysis tool already exists';
    END IF;
  ELSE
    RAISE NOTICE 'Monetization module not found';
  END IF;
END $$;
