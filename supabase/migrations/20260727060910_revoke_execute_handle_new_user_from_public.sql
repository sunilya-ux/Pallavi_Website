/*
# Revoke direct EXECUTE on public.handle_new_user()

1. Purpose
   - `public.handle_new_user()` is a SECURITY DEFINER function owned by
     `postgres`, invoked only by the `on_auth_user_created` trigger on
     `auth.users`. It creates a profile row on signup. It is not meant to be
     called directly via RPC by clients.
   - Currently the function has `EXECUTE` granted to `PUBLIC`, which means
     every role — including `anon` and `authenticated` — can call it directly
     via the PostgREST RPC endpoint. This is unnecessary exposure: the trigger
     does not need a PUBLIC grant to fire (trigger invocation runs with the
     function owner's privileges).

2. Pre-check
   - Confirmed function exists, owned by postgres, SECURITY DEFINER.
   - Confirmed trigger `on_auth_user_created` on `auth.users` uses this function.
   - Confirmed current grants: PUBLIC, postgres, service_role all have EXECUTE.

3. Changes
   - REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC.
     This removes direct-call access from anon + authenticated (which inherited
     it via PUBLIC). The explicit service_role grant is preserved. postgres
     retains owner privileges implicitly.
   - Do NOT revoke from service_role: edge functions / server-side code may
     legitimately call it.
   - The trigger continues to work: trigger invocation uses the owner's
     (postgres) privileges, not the caller's, so no EXECUTE grant is needed
     for the trigger to fire.

4. What is NOT changed
   - Function body: untouched.
   - Trigger: untouched.
   - service_role grant: preserved.
   - No other functions touched.

5. Idempotency
   - REVOKE is idempotent: revoking a privilege that isn't granted is a no-op,
     so re-running this migration is safe.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;