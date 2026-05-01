/*
  # Add Life Purpose Generator Tool to Certification Module

  1. Changes
    - Adds "Life Purpose Generator" tool to the Certification module
    - Tool route: life-purpose-generator
    - Icon: Target
    - Description: Upload life purpose answers to receive 3 polished purpose statements
    - Sort order: 50 (after existing Certification tools)

  2. Notes
    - Tool respects existing module-level permissions
    - Uses the same enable/disable pattern as other tools in the system
    - Requires admin to grant access per client
*/

DO $$
DECLARE
  v_certification_module_id uuid;
BEGIN
  SELECT id INTO v_certification_module_id
  FROM modules
  WHERE name = 'certification'
  LIMIT 1;

  IF v_certification_module_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM tools
      WHERE module_id = v_certification_module_id
      AND name = 'life_purpose_generator'
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
        v_certification_module_id,
        'life_purpose_generator',
        'Life Purpose Generator',
        'Upload life purpose answers to receive 3 polished purpose statements',
        'life-purpose-generator',
        'Target',
        50
      );

      RAISE NOTICE 'Life Purpose Generator tool added successfully';
    ELSE
      RAISE NOTICE 'Life Purpose Generator tool already exists';
    END IF;
  ELSE
    RAISE NOTICE 'Certification module not found';
  END IF;
END $$;
