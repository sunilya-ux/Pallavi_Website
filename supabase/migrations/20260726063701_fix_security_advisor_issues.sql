/*
  # Fix Security Advisor Issues

  ## Summary
  Addresses every issue flagged by the Supabase security advisor:
  - Function search_path mutable (3 functions)
  - RLS Policy Always True (admin policies on 5 assignment tables +
    anon policies on passion_coaching_responses, assignment_submissions,
    assignment_submission_files)
  - Public/Authenticated can execute SECURITY DEFINER functions (4 functions)
  - Leaked password protection (dashboard-only, noted below)

  ## 1. Function search_path (SECURITY DEFINER functions)
  Pins `search_path = public` on all SECURITY DEFINER functions so a
  hostile `search_path` cannot hijack unqualified object references.
  - public.get_user_permissions(uuid)
  - public.get_user_course_permissions(uuid)
  - public.get_assignment_status_for_client(uuid)
  - public.handle_new_user()

  ## 2. RLS admin policies (assignment_groups, assignments,
     assignment_reference_files, assignment_submissions,
     assignment_submission_files)
  Replaces `USING (true)` / `WITH CHECK (true)` with a real admin-role
  check: the authenticated user must have a row in `profiles` with
  `role = 'admin'`. This matches the pattern already used on the
  `clients`, `modules`, and `tools` tables. Admins keep full CRUD;
  non-admin authenticated users now get nothing.

  ## 3. RLS anon policies (passion_coaching_responses,
     assignment_submissions, assignment_submission_files)
  The app's clients log in with the anon key (no Supabase auth
  session), so `auth.uid()` is null for them and true per-row
  ownership checks are impossible at the DB layer. The previous
  `WITH CHECK (true)` allowed writes for any client_id, including
  nonexistent ones. These policies now require the `client_id`
  (or the parent submission's `client_id`) to reference an active
  row in `public.clients`. This is the strongest check available
  given the anon-key architecture and does not break the frontend,
  which always passes a valid client_id.

  ## 4. SECURITY DEFINER functions callable by anon/authenticated
  - get_user_permissions, get_user_course_permissions,
    get_assignment_status_for_client: recreated as SECURITY INVOKER
    with `SET search_path = public`. They only read tables that anon
    already has SELECT access to, so INVOKER works without privilege
    escalation.
  - handle_new_user: stays SECURITY DEFINER (it is a trigger that
    inserts into profiles on signup) but EXECUTE is revoked from
    anon and authenticated so it cannot be invoked via RPC. The
    trigger still fires because triggers run as the function owner.

  ## 5. Leaked password protection
  This is a dashboard setting, not a SQL change. Enable it in the
  Supabase Dashboard: Authentication → Providers → Email →
  "Password breach detection". No API key required.

  ## Notes
  - All policy statements drop first (CREATE POLICY has no reliable
    IF NOT EXISTS) so the migration is idempotent.
  - No tables, columns, or data are dropped or renamed.
*/

-- ============================================================================
-- 1. Pin search_path on SECURITY DEFINER functions
-- ============================================================================

ALTER FUNCTION public.get_user_permissions(uuid)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_course_permissions(uuid)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_assignment_status_for_client(uuid)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;

-- ============================================================================
-- 2. Recreate the three get_* functions as SECURITY INVOKER
--    (bodies unchanged; only the security context + search_path change)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'modules', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'name', m.name,
          'display_name', m.display_name,
          'description', m.description,
          'icon', m.icon,
          'sort_order', m.sort_order,
          'has_access', COALESCE(uma.is_enabled, false)
        ) ORDER BY m.sort_order
      )
      FROM public.modules m
      LEFT JOIN public.user_module_access uma
        ON uma.module_id = m.id
        AND uma.client_id = user_client_id
      WHERE m.is_active = true
    ),
    'tools', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'module_id', t.module_id,
          'name', t.name,
          'display_name', t.display_name,
          'description', t.description,
          'icon', t.icon,
          'route', t.route,
          'sort_order', t.sort_order,
          'has_access', COALESCE(uta.is_enabled, false)
        ) ORDER BY t.module_id, t.sort_order
      )
      FROM public.tools t
      LEFT JOIN public.user_tool_access uta
        ON uta.tool_id = t.id
        AND uta.client_id = user_client_id
      WHERE t.is_active = true
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_course_permissions(user_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.get_assignment_status_for_client(user_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'group_id',      g.id,
      'module_id',     g.module_id,
      'assignment_id', a.id,
      'status',        s.status
    )
  ) INTO result
  FROM public.assignments a
  JOIN public.assignment_groups g ON g.id = a.group_id
  LEFT JOIN public.assignment_submissions s
    ON s.assignment_id = a.id AND s.client_id = user_client_id
  WHERE a.is_active = true AND g.is_active = true;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================================================
-- 3. Revoke direct RPC execute on handle_new_user (trigger-only)
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- ============================================================================
-- 4. RLS admin policies — real admin-role checks
--    (5 assignment tables x insert/update/delete)
-- ============================================================================

-- ---- assignment_groups ----
DROP POLICY IF EXISTS "admin_insert_assignment_groups" ON public.assignment_groups;
DROP POLICY IF EXISTS "admin_update_assignment_groups" ON public.assignment_groups;
DROP POLICY IF EXISTS "admin_delete_assignment_groups" ON public.assignment_groups;

CREATE POLICY "admin_insert_assignment_groups" ON public.assignment_groups FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );
CREATE POLICY "admin_update_assignment_groups" ON public.assignment_groups FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));
CREATE POLICY "admin_delete_assignment_groups" ON public.assignment_groups FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- ---- assignments ----
DROP POLICY IF EXISTS "admin_insert_assignments" ON public.assignments;
DROP POLICY IF EXISTS "admin_update_assignments" ON public.assignments;
DROP POLICY IF EXISTS "admin_delete_assignments" ON public.assignments;

CREATE POLICY "admin_insert_assignments" ON public.assignments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );
CREATE POLICY "admin_update_assignments" ON public.assignments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));
CREATE POLICY "admin_delete_assignments" ON public.assignments FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- ---- assignment_reference_files ----
DROP POLICY IF EXISTS "admin_insert_ref_files" ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_update_ref_files" ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_delete_ref_files" ON public.assignment_reference_files;

CREATE POLICY "admin_insert_ref_files" ON public.assignment_reference_files FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );
CREATE POLICY "admin_update_ref_files" ON public.assignment_reference_files FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));
CREATE POLICY "admin_delete_ref_files" ON public.assignment_reference_files FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- ---- assignment_submissions ----
DROP POLICY IF EXISTS "admin_insert_submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_update_submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_delete_submissions" ON public.assignment_submissions;

CREATE POLICY "admin_insert_submissions" ON public.assignment_submissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );
CREATE POLICY "admin_update_submissions" ON public.assignment_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));
CREATE POLICY "admin_delete_submissions" ON public.assignment_submissions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- ---- assignment_submission_files ----
DROP POLICY IF EXISTS "admin_insert_submission_files" ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_update_submission_files" ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_delete_submission_files" ON public.assignment_submission_files;

CREATE POLICY "admin_insert_submission_files" ON public.assignment_submission_files FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );
CREATE POLICY "admin_update_submission_files" ON public.assignment_submission_files FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));
CREATE POLICY "admin_delete_submission_files" ON public.assignment_submission_files FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- ============================================================================
-- 5. RLS anon policies — client-existence checks
-- ============================================================================

-- ---- passion_coaching_responses ----
DROP POLICY IF EXISTS "Clients can insert their own responses" ON public.passion_coaching_responses;
DROP POLICY IF EXISTS "Clients can update their own responses" ON public.passion_coaching_responses;

CREATE POLICY "Clients can insert their own responses"
  ON public.passion_coaching_responses FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = passion_coaching_responses.client_id
      AND clients.status = 'Active'
  ));

CREATE POLICY "Clients can update their own responses"
  ON public.passion_coaching_responses FOR UPDATE
  TO anon
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = passion_coaching_responses.client_id
      AND clients.status = 'Active'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = passion_coaching_responses.client_id
      AND clients.status = 'Active'
  ));

-- ---- assignment_submissions (anon insert) ----
DROP POLICY IF EXISTS "anon_insert_submissions" ON public.assignment_submissions;

CREATE POLICY "anon_insert_submissions"
  ON public.assignment_submissions FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = assignment_submissions.client_id
      AND clients.status = 'Active'
  ));

-- ---- assignment_submission_files (anon insert) ----
DROP POLICY IF EXISTS "anon_insert_submission_files" ON public.assignment_submission_files;

CREATE POLICY "anon_insert_submission_files"
  ON public.assignment_submission_files FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.assignment_submission_files sf
    JOIN public.assignment_submissions s ON s.id = sf.submission_id
    JOIN public.clients c ON c.id = s.client_id
    WHERE s.id = assignment_submission_files.submission_id
      AND c.status = 'Active'
  ));
