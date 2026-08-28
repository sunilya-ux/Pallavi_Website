/*
# Add response_text column to assignment_submissions

1. Changes
- Add nullable `response_text` text column to `public.assignment_submissions`.
- Existing rows (including old test data) will simply have NULL here — no backfill needed.

2. Security
- No RLS or policy changes. Existing policies on assignment_submissions continue to govern access.

3. Notes
- Idempotent: uses ADD COLUMN IF NOT EXISTS so re-running is safe.
- The column is intentionally nullable because older submissions predate the written-response feature.
*/

ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS response_text text;
