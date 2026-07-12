/*
# Assignments System

## Summary
Adds a homework/assignment layer to the platform, scoped to tools under
Certification, Monetization, and Beyond Coaching modules. Courses are
excluded at the UI level — no DB-level enforcement needed.

## New Tables

### assignments
One optional assignment per tool (enforced by UNIQUE constraint on tool_id).
Admin creates an assignment by writing instructions and optionally attaching
reference files. A tool with no row here simply has no assignment.

Columns:
- id             uuid PK
- tool_id        uuid FK → tools.id (CASCADE delete), UNIQUE
- instructions   text  — the assignment prompt shown to the mentee
- is_active      boolean — admin can disable without deleting
- created_at     timestamptz
- created_by     uuid FK → profiles.id

### assignment_reference_files
Files the admin attaches to an assignment (unlimited, e.g. templates, PDFs).
Deleted automatically when the parent assignment is deleted (CASCADE).

Columns:
- id              uuid PK
- assignment_id   uuid FK → assignments.id (CASCADE delete)
- file_path       text  — Supabase Storage path
- file_name       text  — display name
- uploaded_at     timestamptz

### assignment_submissions
One submission per client per assignment (UNIQUE on assignment_id + client_id).
Absence of a row means "not started". Status flows: completed → reviewed.

Columns:
- id             uuid PK
- assignment_id  uuid FK → assignments.id (CASCADE delete)
- client_id      uuid FK → clients.id (CASCADE delete)
- status         text CHECK ('completed' | 'reviewed'), default 'completed'
- submitted_at   timestamptz
- feedback       text  — admin written feedback
- reviewed_at    timestamptz

### assignment_submission_files
Files the client attaches to their submission.
Deleted automatically when the parent submission is deleted (CASCADE).

Columns:
- id            uuid PK
- submission_id uuid FK → assignment_submissions.id (CASCADE delete)
- file_path     text  — Supabase Storage path
- file_name     text  — display name
- uploaded_at   timestamptz

## Indexes
- assignments.tool_id
- assignment_reference_files.assignment_id
- assignment_submissions.client_id
- assignment_submissions.assignment_id
- assignment_submission_files.submission_id

## Security / RLS
All four tables have RLS enabled.

Auth model:
- Admin = authenticated Supabase user (full CRUD on everything)
- Clients = use the anon key (no Supabase auth session), so client-facing
  policies use TO anon, authenticated to allow the anon-key frontend to operate.

Policy summary:
| Table                         | authenticated (admin)         | anon (clients)          |
|-------------------------------|-------------------------------|-------------------------|
| assignments                   | SELECT + INSERT + UPDATE + DELETE | SELECT                |
| assignment_reference_files    | SELECT + INSERT + UPDATE + DELETE | SELECT                |
| assignment_submissions        | SELECT + INSERT + UPDATE + DELETE | SELECT + INSERT + UPDATE |
| assignment_submission_files   | SELECT + INSERT + UPDATE + DELETE | SELECT + INSERT       |

Clients cannot DELETE their own submissions or files (admin manages that).
*/

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id     uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  instructions text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  created_by  uuid REFERENCES public.profiles(id),
  UNIQUE(tool_id)
);

CREATE TABLE IF NOT EXISTS public.assignment_reference_files (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  file_path      text NOT NULL,
  file_name      text NOT NULL,
  uploaded_at    timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.assignment_submission_files (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  uuid NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  file_path      text NOT NULL,
  file_name      text NOT NULL,
  uploaded_at    timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_assignments_tool_id
  ON public.assignments(tool_id);

CREATE INDEX IF NOT EXISTS idx_assignment_reference_files_assignment_id
  ON public.assignment_reference_files(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_client_id
  ON public.assignment_submissions(client_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id
  ON public.assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submission_files_submission_id
  ON public.assignment_submission_files(submission_id);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────

ALTER TABLE public.assignments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_reference_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submission_files ENABLE ROW LEVEL SECURITY;

-- assignments: admin full CRUD, clients read-only
DROP POLICY IF EXISTS "admin_select_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "admin_insert_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "admin_update_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "admin_delete_assignments"  ON public.assignments;
DROP POLICY IF EXISTS "anon_select_assignments"   ON public.assignments;

CREATE POLICY "admin_select_assignments"  ON public.assignments FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_assignments"  ON public.assignments FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_assignments"  ON public.assignments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_assignments"  ON public.assignments FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_assignments"   ON public.assignments FOR SELECT
  TO anon USING (is_active = true);

-- assignment_reference_files: admin full CRUD, clients read-only
DROP POLICY IF EXISTS "admin_select_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_insert_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_update_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "admin_delete_ref_files"  ON public.assignment_reference_files;
DROP POLICY IF EXISTS "anon_select_ref_files"   ON public.assignment_reference_files;

CREATE POLICY "admin_select_ref_files"  ON public.assignment_reference_files FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_ref_files"  ON public.assignment_reference_files FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_ref_files"  ON public.assignment_reference_files FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_ref_files"  ON public.assignment_reference_files FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_ref_files"   ON public.assignment_reference_files FOR SELECT
  TO anon USING (true);

-- assignment_submissions: admin full CRUD, clients can create + read + update their own
DROP POLICY IF EXISTS "admin_select_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_insert_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_update_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "admin_delete_submissions"  ON public.assignment_submissions;
DROP POLICY IF EXISTS "anon_select_submissions"   ON public.assignment_submissions;
DROP POLICY IF EXISTS "anon_insert_submissions"   ON public.assignment_submissions;
DROP POLICY IF EXISTS "anon_update_submissions"   ON public.assignment_submissions;

CREATE POLICY "admin_select_submissions"  ON public.assignment_submissions FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_submissions"  ON public.assignment_submissions FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_submissions"  ON public.assignment_submissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_submissions"  ON public.assignment_submissions FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_submissions"   ON public.assignment_submissions FOR SELECT
  TO anon USING (true);
CREATE POLICY "anon_insert_submissions"   ON public.assignment_submissions FOR INSERT
  TO anon WITH CHECK (true);
CREATE POLICY "anon_update_submissions"   ON public.assignment_submissions FOR UPDATE
  TO anon USING (true) WITH CHECK (true);

-- assignment_submission_files: admin full CRUD, clients can upload + read
DROP POLICY IF EXISTS "admin_select_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_insert_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_update_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "admin_delete_submission_files"  ON public.assignment_submission_files;
DROP POLICY IF EXISTS "anon_select_submission_files"   ON public.assignment_submission_files;
DROP POLICY IF EXISTS "anon_insert_submission_files"   ON public.assignment_submission_files;

CREATE POLICY "admin_select_submission_files"  ON public.assignment_submission_files FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_submission_files"  ON public.assignment_submission_files FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_submission_files"  ON public.assignment_submission_files FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_submission_files"  ON public.assignment_submission_files FOR DELETE
  TO authenticated USING (true);
CREATE POLICY "anon_select_submission_files"   ON public.assignment_submission_files FOR SELECT
  TO anon USING (true);
CREATE POLICY "anon_insert_submission_files"   ON public.assignment_submission_files FOR INSERT
  TO anon WITH CHECK (true);
