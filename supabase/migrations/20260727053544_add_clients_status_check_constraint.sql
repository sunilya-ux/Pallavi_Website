/*
# Add CHECK constraint on clients.status

1. Purpose
   - Lock the `clients.status` column to only the two values used by the app:
     'Active' and 'Inactive'. This protects the RLS insert policies on
     `assignment_submissions` and `assignment_submission_files`, which both
     gate inserts on `clients.status = 'Active'`. Without a constraint, a
     free-text value (e.g. 'active', 'Pending', NULL) could silently break
     those policies.

2. Pre-check
   - Verified 0 existing rows violate the constraint (all rows are 'Active').

3. Changes
   - Add constraint `clients_status_check_values` enforcing
     status IN ('Active', 'Inactive'). Nullability is not altered in this
     migration to keep the change purely additive.

4. Security
   - No RLS or policy changes. The existing policies already assume 'Active';
     this constraint makes that assumption enforceable at the DB level.

5. Notes
   - Idempotent: uses `DO $$ ... IF NOT EXISTS ... END $$` so re-running is safe.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clients_status_check_values'
      AND conrelid = 'public.clients'::regclass
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_status_check_values
      CHECK (status IN ('Active', 'Inactive'));
  END IF;
END $$;