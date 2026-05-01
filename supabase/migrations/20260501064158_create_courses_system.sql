/*
  # Create Courses System

  1. New Tables

    ### `courses` Table
    - `id` (uuid, primary key) - Unique identifier
    - `module_id` (uuid, foreign key) - References the Courses module in modules table
    - `name` (text, unique, not null) - Course identifier
    - `display_name` (text, not null) - Human-readable name
    - `description` (text) - Course description
    - `icon` (text) - Icon name from lucide-react
    - `sort_order` (integer, default 0) - Display order
    - `is_active` (boolean, default true) - Whether course is globally available
    - `created_at` (timestamptz, default now())

    ### `course_lessons` Table
    - `id` (uuid, primary key) - Unique identifier
    - `course_id` (uuid, foreign key) - References courses table
    - `name` (text, not null) - Lesson identifier
    - `display_name` (text, not null) - Human-readable name
    - `description` (text) - Lesson description
    - `icon` (text) - Icon name from lucide-react
    - `route` (text) - Route for content loading
    - `sort_order` (integer, default 0) - Display order
    - `is_active` (boolean, default true) - Whether lesson is globally available
    - `created_at` (timestamptz, default now())
    - UNIQUE constraint on (course_id, name)

    ### `user_course_access` Table
    - `id` (uuid, primary key)
    - `client_id` (uuid, foreign key) - References clients table
    - `course_id` (uuid, foreign key) - References courses table
    - `is_enabled` (boolean, default true)
    - `granted_at` (timestamptz, default now())
    - `granted_by` (uuid)
    - UNIQUE constraint on (client_id, course_id)

    ### `user_lesson_access` Table
    - `id` (uuid, primary key)
    - `client_id` (uuid, foreign key) - References clients table
    - `lesson_id` (uuid, foreign key) - References course_lessons table
    - `is_enabled` (boolean, default true)
    - `granted_at` (timestamptz, default now())
    - `granted_by` (uuid)
    - UNIQUE constraint on (client_id, lesson_id)

  2. Security
    - Enable RLS on all new tables
    - Courses and lessons are readable by anyone (active ones)
    - Access tables are readable by the owning client (anon) and admins (authenticated)
    - Only admins can insert/update/delete access records

  3. Seed Data
    - Adds "Courses" module to the modules table
    - Adds "7 Figure Ensuring Morning Rituals" course
    - Adds 6 lessons: Intention Setting, Box Breathing, Affirmations, Version 2, Review Journal, Goal of the Week

  4. Helper Function
    - Creates `get_user_course_permissions` function to retrieve courses and lessons with access info
*/

-- ============================================================================
-- ADD COURSES MODULE
-- ============================================================================

INSERT INTO public.modules (name, display_name, description, icon, sort_order)
VALUES ('courses', 'Courses', 'Video courses and training programs', 'GraduationCap', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  route text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, name)
);

CREATE TABLE IF NOT EXISTS public.user_course_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES public.profiles(id),
  UNIQUE(client_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.user_lesson_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES public.profiles(id),
  UNIQUE(client_id, lesson_id)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_courses_module_id ON public.courses(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_access_client_id ON public.user_course_access(client_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_access_client_id ON public.user_lesson_access(client_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_access ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - COURSES
-- ============================================================================

CREATE POLICY "Anyone can read active courses"
  ON public.courses
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert courses"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update courses"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete courses"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - COURSE LESSONS
-- ============================================================================

CREATE POLICY "Anyone can read active lessons"
  ON public.course_lessons
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert lessons"
  ON public.course_lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update lessons"
  ON public.course_lessons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lessons"
  ON public.course_lessons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - USER COURSE ACCESS
-- ============================================================================

CREATE POLICY "Clients can read own course access"
  ON public.user_course_access
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can read all course access"
  ON public.user_course_access
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert course access"
  ON public.user_course_access
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update course access"
  ON public.user_course_access
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete course access"
  ON public.user_course_access
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - USER LESSON ACCESS
-- ============================================================================

CREATE POLICY "Clients can read own lesson access"
  ON public.user_lesson_access
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can read all lesson access"
  ON public.user_lesson_access
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert lesson access"
  ON public.user_lesson_access
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update lesson access"
  ON public.user_lesson_access
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lesson access"
  ON public.user_lesson_access
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- SEED DATA
-- ============================================================================

DO $$
DECLARE
  v_courses_module_id uuid;
  v_course_id uuid;
BEGIN
  SELECT id INTO v_courses_module_id
  FROM public.modules
  WHERE name = 'courses'
  LIMIT 1;

  IF v_courses_module_id IS NOT NULL THEN
    INSERT INTO public.courses (module_id, name, display_name, description, icon, sort_order)
    VALUES (
      v_courses_module_id,
      '7_figure_morning_rituals',
      '7 Figure Ensuring Morning Rituals',
      'Transform your mornings with proven rituals used by top achievers',
      'Sun',
      1
    )
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO v_course_id;

    IF v_course_id IS NULL THEN
      SELECT id INTO v_course_id FROM public.courses WHERE name = '7_figure_morning_rituals';
    END IF;

    IF v_course_id IS NOT NULL THEN
      INSERT INTO public.course_lessons (course_id, name, display_name, description, icon, route, sort_order)
      VALUES
        (v_course_id, 'intention_setting', 'Intention Setting', 'Set powerful daily intentions', 'Compass', 'courses/morning-rituals/intention-setting', 1),
        (v_course_id, 'box_breathing', 'Box Breathing', 'Master the box breathing technique', 'Wind', 'courses/morning-rituals/box-breathing', 2),
        (v_course_id, 'affirmations', 'Affirmations', 'Daily affirmations for success', 'MessageCircle', 'courses/morning-rituals/affirmations', 3),
        (v_course_id, 'version_2', 'Version 2', 'Advanced morning ritual techniques', 'Layers', 'courses/morning-rituals/version-2', 4),
        (v_course_id, 'review_journal', 'Review Journal', 'Daily journaling and reflection', 'BookOpen', 'courses/morning-rituals/review-journal', 5),
        (v_course_id, 'goal_of_the_week', 'Goal of the Week', 'Weekly goal setting and tracking', 'CalendarCheck', 'courses/morning-rituals/goal-of-the-week', 6)
      ON CONFLICT (course_id, name) DO NOTHING;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_course_permissions(user_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'courses', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'module_id', c.module_id,
          'name', c.name,
          'display_name', c.display_name,
          'description', c.description,
          'icon', c.icon,
          'sort_order', c.sort_order,
          'has_access', COALESCE(uca.is_enabled, false)
        ) ORDER BY c.sort_order
      )
      FROM public.courses c
      LEFT JOIN public.user_course_access uca
        ON uca.course_id = c.id
        AND uca.client_id = user_client_id
      WHERE c.is_active = true
    ),
    'lessons', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cl.id,
          'course_id', cl.course_id,
          'name', cl.name,
          'display_name', cl.display_name,
          'description', cl.description,
          'icon', cl.icon,
          'route', cl.route,
          'sort_order', cl.sort_order,
          'has_access', COALESCE(ula.is_enabled, false)
        ) ORDER BY cl.course_id, cl.sort_order
      )
      FROM public.course_lessons cl
      LEFT JOIN public.user_lesson_access ula
        ON ula.lesson_id = cl.id
        AND ula.client_id = user_client_id
      WHERE cl.is_active = true
    )
  ) INTO result;

  RETURN result;
END;
$$;
