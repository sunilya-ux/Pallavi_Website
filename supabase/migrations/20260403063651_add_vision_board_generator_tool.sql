/*
  # Add Vision Board Generator Tool to Certification Module

  1. Changes
    - Adds Vision Board Generator tool to the Certification module
    - Tool route: /tools/vision-board-generator
    - Icon: Image
    - Description: Create personalized vision boards based on life goals
    - Enabled by default for all users with Certification module access
  
  2. Notes
    - Tool respects existing module-level permissions
    - Uses the same enable/disable pattern as other tools in the system
*/

-- Insert Vision Board Generator tool into the Certification module
DO $$
DECLARE
  v_certification_module_id uuid;
BEGIN
  -- Get the Certification module ID
  SELECT id INTO v_certification_module_id
  FROM modules
  WHERE name = 'certification'
  LIMIT 1;

  -- Only proceed if Certification module exists
  IF v_certification_module_id IS NOT NULL THEN
    -- Check if tool already exists
    IF NOT EXISTS (
      SELECT 1 FROM tools
      WHERE route = '/tools/vision-board-generator'
    ) THEN
      -- Insert the Vision Board Generator tool
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
        'vision_board_generator',
        'Vision Board Generator',
        'Create a personalized, powerful vision board based on your life goals',
        '/tools/vision-board-generator',
        'Image',
        40
      );

      RAISE NOTICE 'Vision Board Generator tool added successfully';
    ELSE
      RAISE NOTICE 'Vision Board Generator tool already exists';
    END IF;
  ELSE
    RAISE NOTICE 'Certification module not found';
  END IF;
END $$;
