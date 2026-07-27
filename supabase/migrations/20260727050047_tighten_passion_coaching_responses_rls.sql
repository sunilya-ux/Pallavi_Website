/*
  # Tighten anon RLS on passion_coaching_responses

  Replaces two anon-role policies that previously allowed unrestricted
  INSERT/UPDATE with a check that the client_id references an existing
  row in the clients table.

  Only these two policies change:
  - "Clients can insert their own responses" (INSERT)
  - "Clients can update their own responses" (UPDATE)

  The SELECT policies on this table are not touched. No schema, column,
  or frontend changes.
*/

DROP POLICY IF EXISTS "Clients can insert their own responses"
  ON public.passion_coaching_responses;

DROP POLICY IF EXISTS "Clients can update their own responses"
  ON public.passion_coaching_responses;

CREATE POLICY "Clients can insert their own responses"
  ON public.passion_coaching_responses
  FOR INSERT
  TO anon
  WITH CHECK (
    client_id IN (SELECT id FROM public.clients)
  );

CREATE POLICY "Clients can update their own responses"
  ON public.passion_coaching_responses
  FOR UPDATE
  TO anon
  USING (
    client_id IN (SELECT id FROM public.clients)
  )
  WITH CHECK (
    client_id IN (SELECT id FROM public.clients)
  );
