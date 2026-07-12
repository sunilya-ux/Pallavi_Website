-- # Assignments System - Security and Infrastructure Patch
-- # Patches migration: 20260712122459_create_assignments_system
--
-- This migration tightens security, adds the Storage bucket, and adds a
-- performance helper. All statements are idempotent and safe to re-run.
--
-- Changes:
--
-- 1. Remove anon UPDATE on assignment_submissions
--    Clients must not modify a submission after creating it. No self-assigned
--    status bumps, no touching the feedback column. Only authenticated admins
--    may UPDATE (to write feedback and mark as reviewed). The anon INSERT
--    policy is kept so clients can still submit for the first time.
--
-- 2. Tighten reference-file visibility
--    Replaces the broad anon SELECT policy (which exposed files for any
--    assignment regardless of state) with a scoped version that only surfaces
--    files whose parent assignment has is_active = true. Matches the filter
--    already applied to the assignments SELECT policy.
--
-- 3. Supabase Storage - private "assignments" bucket
--    Creates a private Storage bucket. Folder layout:
--      reference/   admin-uploaded instructions / templates
--      submissions/ client-uploaded submission files
--    Storage object policies (bucket_id = 'assignments'):
--      SELECT - anon + authenticated can download from reference/* and submissions/*
--      INSERT - anon + authenticated can upload; mime type enforced at bucket level
--               and double-checked in WITH CHECK (.doc, .docx, .jpg, .png)
--      DELETE - authenticated only (admin manages cleanup)
--
-- 4. Helper function get_assignment_status_for_client(user_client_id uuid)
--    Returns a jsonb array of all active assignments with the given client's
--    submission status: null = not started, 'completed', or 'reviewed'.
--    One DB round-trip replaces N per-tool sidebar queries.
--    SECURITY DEFINER lets the anon-key client call it and join submission
--    rows for the passed-in client_id. GRANT covers anon + authenticated.


-- ─────────────────────────────────────────────
-- 1. Remove anon UPDATE on assignment_submissions
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_update_submissions" ON public.assignment_submissions;


-- ─────────────────────────────────────────────
-- 2. Tighten reference file visibility
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_select_ref_files" ON public.assignment_reference_files;

CREATE POLICY "anon_select_ref_files" ON public.assignment_reference_files FOR SELECT
  TO anon USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.id = assignment_reference_files.assignment_id
        AND assignments.is_active = true
    )
  );


-- ─────────────────────────────────────────────
-- 3. Storage bucket + object policies
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'assignments',
  'assignments',
  false,
  ARRAY[
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- SELECT: anon + authenticated can download from reference/* and submissions/*
DROP POLICY IF EXISTS "assignments_select_objects" ON storage.objects;
CREATE POLICY "assignments_select_objects" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] IN ('reference', 'submissions')
  );

-- INSERT: anon + authenticated can upload; mime type also enforced in predicate
DROP POLICY IF EXISTS "assignments_insert_objects" ON storage.objects;
CREATE POLICY "assignments_insert_objects" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] IN ('reference', 'submissions')
    AND (metadata->>'mimetype') IN (
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    )
  );

-- DELETE: authenticated (admin) only
DROP POLICY IF EXISTS "assignments_delete_objects" ON storage.objects;
CREATE POLICY "assignments_delete_objects" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'assignments');


-- ─────────────────────────────────────────────
-- 4. Helper function
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
      'tool_id',       a.tool_id,
      'assignment_id', a.id,
      'status',        s.status
    )
  ) INTO result
  FROM public.assignments a
  LEFT JOIN public.assignment_submissions s
    ON  s.assignment_id = a.id
    AND s.client_id     = user_client_id
  WHERE a.is_active = true;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant anon-key clients and admin the ability to call this function
GRANT EXECUTE ON FUNCTION public.get_assignment_status_for_client(uuid) TO anon, authenticated;
