/*
  # Register Course Lessons as Tools in Unified System

  1. Changes
    - Adds 6 course lesson tools to the `tools` table under the "Courses" module
    - This makes Courses behave identically to Certification, Monetization, and Beyond Coaching
    - Tools are registered with the same structure used by all other sections

  2. New Tools (under Courses module)
    - Intention Setting (route: courses/morning-rituals/intention-setting)
    - Box Breathing (route: courses/morning-rituals/box-breathing)
    - Affirmations (route: courses/morning-rituals/affirmations)
    - Version 2 (route: courses/morning-rituals/version-2)
    - Review Journal (route: courses/morning-rituals/review-journal)
    - Goal of the Week (route: courses/morning-rituals/goal-of-the-week)

  3. Notes
    - Existing courses/course_lessons tables remain unchanged
    - Tools follow the same access control pattern (user_tool_access) as other sections
    - Each tool has type-hint in description for video content
*/

DO $$
DECLARE
  v_courses_module_id uuid;
BEGIN
  SELECT id INTO v_courses_module_id
  FROM public.modules
  WHERE name = 'courses'
  LIMIT 1;

  IF v_courses_module_id IS NOT NULL THEN
    INSERT INTO public.tools (module_id, name, display_name, description, route, icon, sort_order)
    VALUES
      (v_courses_module_id, 'intention_setting', 'Intention Setting', 'Set powerful daily intentions', 'courses/morning-rituals/intention-setting', 'Compass', 1),
      (v_courses_module_id, 'box_breathing', 'Box Breathing', 'Master the box breathing technique', 'courses/morning-rituals/box-breathing', 'Wind', 2),
      (v_courses_module_id, 'affirmations', 'Affirmations', 'Daily affirmations for success', 'courses/morning-rituals/affirmations', 'MessageCircle', 3),
      (v_courses_module_id, 'version_2', 'Version 2', 'Advanced morning ritual techniques', 'courses/morning-rituals/version-2', 'Layers', 4),
      (v_courses_module_id, 'review_journal', 'Review Journal', 'Daily journaling and reflection', 'courses/morning-rituals/review-journal', 'BookOpen', 5),
      (v_courses_module_id, 'goal_of_the_week', 'Goal of the Week', 'Weekly goal setting and tracking', 'courses/morning-rituals/goal-of-the-week', 'CalendarCheck', 6)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Course lesson tools registered successfully under Courses module';
  ELSE
    RAISE NOTICE 'Courses module not found';
  END IF;
END $$;
