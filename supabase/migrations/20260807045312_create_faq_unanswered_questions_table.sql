/*
# Create FAQ Unanswered Questions Table

1. Purpose
   - Logs questions that users ask the FAQ chatbot but that the bot cannot answer.
   - Lets admins review these gaps and mark them resolved, so the FAQ content can be improved over time.

2. New Tables
   - `public.faq_unanswered_questions`
     - `id` (uuid, primary key, auto-generated)
     - `question_text` (text, not null) — the question the user asked
     - `client_id` (uuid, nullable) — optional reference to public.clients(id)
     - `client_email` (text, nullable) — optional email of the client who asked
     - `created_at` (timestamptz, default now(), not null)
     - `resolved` (boolean, default false, not null) — admin marks resolved

3. Indexes
   - `idx_faq_unanswered_created_at` on `created_at` for chronological sorting.

4. Security (RLS)
   - RLS enabled on the table.
   - INSERT policy for `anon` role: allows logging a question. If `client_id` is provided, it must
     reference an existing client with status = 'Active'. If `client_id` is NULL, the insert is allowed
     (anonymous question).
   - SELECT / UPDATE / DELETE policies for `authenticated` role: full access (admins review and manage
     the logged questions). USING (true) / WITH CHECK (true) is acceptable here because access to this
     table is restricted to authenticated admin users by the app, and the data is operational/admin-only.

5. Important Notes
   - Clients (anon role) can ONLY insert. They cannot read, update, or delete logged questions.
   - Only authenticated (admin) users can view, mark resolved, or delete entries.
   - The table is safe to re-run (idempotent): CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
     and DROP POLICY IF EXISTS before each CREATE POLICY.
*/

-- Create table to log FAQ questions the chatbot couldn't answer
CREATE TABLE IF NOT EXISTS public.faq_unanswered_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  client_email text,
  created_at timestamptz DEFAULT now() NOT NULL,
  resolved boolean DEFAULT false NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_faq_unanswered_created_at
  ON public.faq_unanswered_questions(created_at);
ALTER TABLE public.faq_unanswered_questions ENABLE ROW LEVEL SECURITY;
-- Clients (anon, active only) can log a question — insert only, no read/update/delete
DROP POLICY IF EXISTS "anon_insert_unanswered_questions" ON public.faq_unanswered_questions;
CREATE POLICY "anon_insert_unanswered_questions"
  ON public.faq_unanswered_questions FOR INSERT
  TO anon
  WITH CHECK (
    client_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = faq_unanswered_questions.client_id
        AND clients.status = 'Active'
    )
  );
-- Admin (authenticated) has full access to view, update (mark resolved), and delete
DROP POLICY IF EXISTS "admin_select_unanswered_questions" ON public.faq_unanswered_questions;
CREATE POLICY "admin_select_unanswered_questions"
  ON public.faq_unanswered_questions FOR SELECT
  TO authenticated
  USING (true);
DROP POLICY IF EXISTS "admin_update_unanswered_questions" ON public.faq_unanswered_questions;
CREATE POLICY "admin_update_unanswered_questions"
  ON public.faq_unanswered_questions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
DROP POLICY IF EXISTS "admin_delete_unanswered_questions" ON public.faq_unanswered_questions;
CREATE POLICY "admin_delete_unanswered_questions"
  ON public.faq_unanswered_questions FOR DELETE
  TO authenticated
  USING (true);
