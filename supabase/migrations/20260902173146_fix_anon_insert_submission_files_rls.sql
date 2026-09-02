/*
# Fix anon INSERT policy on assignment_submission_files

1. Problem
- The existing `anon_insert_submission_files` policy has a self-referential WITH CHECK
  that joins back to `assignment_submission_files` itself. On the very first file row
  being inserted for a submission, no matching row exists yet, so the EXISTS check
  returns false and the INSERT is blocked with an RLS error:
  "new row violates row-level security policy for table 'assignment_submission_files'".

2. Fix
- Drop the broken `anon_insert_submission_files` policy.
- Recreate it with a WITH CHECK that joins `assignment_submissions` → `clients` only
  (no self-reference to assignment_submission_files), mirroring the working
  `anon_insert_submissions` policy on the parent table. This verifies the submission
  belongs to an Active client before allowing the file row insert.

3. Security
- No new tables. RLS remains enabled on assignment_submission_files.
- The anon INSERT policy still gates on the parent submission's client being Active.
- Admin (authenticated) INSERT policy is unchanged.

4. Notes
- Idempotent: DROP POLICY IF EXISTS before CREATE.
*/

DROP POLICY IF EXISTS "anon_insert_submission_files" ON public.assignment_submission_files;

CREATE POLICY "anon_insert_submission_files"
ON public.assignment_submission_files FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM assignment_submissions s
    JOIN clients c ON c.id = s.client_id
    WHERE s.id = assignment_submission_files.submission_id
      AND c.status = 'Active'
  )
);
