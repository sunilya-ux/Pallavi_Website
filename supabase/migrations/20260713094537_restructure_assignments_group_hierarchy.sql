-- # Assignments System — Group Hierarchy Restructure
-- # Replaces: 20260712122459_create_assignments_system
-- #           20260712125350_patch_assignments_security_and_storage
--
-- The previous schema tied each assignment directly to a tool (one per tool).
-- This migration replaces that flat structure with a two-level hierarchy:
--
--   assignment_groups  — a named folder (e.g. "Scientific Manifestation") scoped
--                        to a module, created by the admin
--   assignments        — individual tasks inside a group, each with its own title
--                        and instructions
--
-- assignment_reference_files, assignment_submissions, and
-- assignment_submission_files are structurally unchanged — they still hang off
-- assignments.id. They are rebuilt here after the drop.
--
-- The assignments Storage bucket and its storage policies are NOT touched.
-- Any test files uploaded under the old structure are now orphaned objects in
-- Storage. They can be manually cleared from the Supabase Storage dashboard
-- at any time; no action is required now.
--
-- RLS model (unchanged from previous migration):
--   Admin = authenticated Supabase user (full CRUD on all five tables)
--   Clients = anon key (no Supabase auth session) — read-only or insert-only
--             depending on the table


-- ─────────────────────────────────────────────
-- 1. Drop old structure
-- ─────────────────────────────────────────────

DROP TABLE IF EXISTS public.assignment_submission_files CASCADE;
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignment_reference_files CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP FUNCTION IF EXISTS public.get_assignment_status_for_client(uuid);


-- ─────────────────────────────────────────────
-- 2. assignment_groups
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignment_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id   uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title       text NOT NULL,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  created_by  uuid REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_groups_module_id
  ON public.assignment_groups(module_id);

ALTER TABLE public.assignment_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_assignment_groups"  ON public.assignment_groups;
DROP POLICY IF EXISTS "admin_insert_assignment_groups"  ON public.assignment_groups;
DROP POLICY IF EXISTS "admin_update_assignment_groups"  ON public.assignment_groups;
DROP POLICY IF EXISTS "admin_delete_assignment_groups"  ON public.assignment_groups;
DROP POLICY IF EXISTS "anon_select_assignment_groups"   ON public.assignment_groups;

CREATE POLICY "admin_select_assignment_groups" ON public.assignment_groups FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_assignment_groups" ON public.assignment_groups FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_assignment_groups" ON public.assignment_groups FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_assignment_groups" ON public.assignment_groups FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_assignment_groups"  ON public.assignment_groups FOR SELECT
  TO anon USING (is_active = true);


-- ─────────────────────────────────────────────
-- 3. assignments (group-based, with title)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES public.assignment_groups(id) ON DELETE CASCADE,
  title        text NOT NULL,
  instructions text,
  sort_order   integer DEFAULT 0,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  created_by   uuid REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_group_id
  ON public.assignments(group_id);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "admin_insert_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "admin_update_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "admin_delete_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "anon_select_assignments"   ON public.assignments;

CREATE POLICY "admin_select_assignments" ON public.assignments FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_assignments" ON public.assignments FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_assignments" ON public.assignments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_assignments" ON public.assignments FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_assignments"  ON public.assignments FOR SELECT
  TO anon USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.assignment_groups
      WHERE assignment_groups.id = assignments.group_id
        AND assignment_groups.is_active = true
    )
  );


-- ─────────────────────────────────────────────
-- 4. assignment_reference_files
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignment_reference_files (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  file_path      text NOT NULL,
  file_name      text NOT NULL,
  uploaded_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_reference_files_assignment_id
  ON public.assignment_reference_files(assignment_id);

ALTER TABLE public.assignment_reference_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_insert_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_update_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_delete_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "anon_select_ref_files"   ON public.assignment_reference_files;

CREATE POLICY "admin_select_ref_files" ON public.assignment_reference_files FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_ref_files" ON public.assignment_reference_files FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_ref_files" ON public.assignment_reference_files FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_ref_files" ON public.assignment_reference_files FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_ref_files"  ON public.assignment_reference_files FOR SELECT
  TO anon USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.assignment_groups g ON g.id = a.group_id
      WHERE a.id = assignment_reference_files.assignment_id
        AND a.is_active = true
        AND g.is_active = true
    )
  );


-- ─────────────────────────────────────────────
-- 5. assignment_submissions
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'completed'
                   CHECK (status IN ('completed', 'reviewed')),
  submitted_at   timestamptz DEFAULT now(),
  feedback       text,
  reviewed_at    timestamptz,
  UNIQUE(assignment_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_client_id
  ON public.assignment_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id
  ON public.assignment_submissions(assignment_id);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_insert_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_update_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_delete_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "anon_select_submissions"   ON public.assignment_submissions;
DROP POLICY IF EXISTS "anon_insert_submissions"   ON public.assignment_submissions;

CREATE POLICY "admin_select_submissions" ON public.assignment_submissions FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_submissions" ON public.assignment_submissions FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_submissions" ON public.assignment_submissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_submissions" ON public.assignment_submissions FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_submissions"  ON public.assignment_submissions FOR SELECT
  TO anon USING (true);
CREATE POLICY "anon_insert_submissions"  ON public.assignment_submissions FOR INSERT
  TO anon WITH CHECK (true);


-- ─────────────────────────────────────────────
-- 6. assignment_submission_files
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignment_submission_files (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  uuid NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  file_path      text NOT NULL,
  file_name      text NOT NULL,
  uploaded_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_submission_files_submission_id
  ON public.assignment_submission_files(submission_id);

ALTER TABLE public.assignment_submission_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_insert_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_update_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_delete_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "anon_select_submission_files"   ON public.assignment_submission_files;
DROP POLICY IF EXISTS "anon_insert_submission_files"   ON public.assignment_submission_files;

CREATE POLICY "admin_select_submission_files" ON public.assignment_submission_files FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_submission_files" ON public.assignment_submission_files FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_submission_files" ON public.assignment_submission_files FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_submission_files" ON public.assignment_submission_files FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_submission_files"  ON public.assignment_submission_files FOR SELECT
  TO anon USING (true);
CREATE POLICY "anon_insert_submission_files"  ON public.assignment_submission_files FOR INSERT
  TO anon WITH CHECK (true);


-- ─────────────────────────────────────────────
-- 7. Helper function (updated for group hierarchy)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_assignment_status_for_client(user_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION public.get_assignment_status_for_client(uuid) TO anon, authenticated;
