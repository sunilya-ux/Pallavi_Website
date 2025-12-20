/*
  # Fix Remaining RLS Performance Issue
  
  ## Summary
  This migration addresses the remaining RLS performance issue in the clients table
  by splitting the consolidated SELECT policy into separate policies for different roles.
  
  ## Changes Made
  
  ### 1. RLS Policy Optimization
  
  #### Clients Table SELECT Policy
  - **Issue**: The consolidated "Allow client login and admin access" policy uses 
    `current_setting('role')` which gets re-evaluated for each row
  - **Fix**: Split into two separate policies:
    1. "Allow login verification" - For anon users (login flow)
    2. "Admins can read all clients" - For authenticated admin users
  - **Performance Impact**: Eliminates per-row evaluation of current_setting()
  
  ## Technical Details
  
  The consolidated policy was attempting to handle both anon (login) and authenticated 
  (admin) access in a single CASE statement. This required checking `current_setting('role')` 
  for each row, creating a performance bottleneck.
  
  By using separate policies with different role targets (TO anon vs TO authenticated),
  PostgreSQL can optimize the policy evaluation at query planning time rather than 
  per-row execution.
  
  ## Note on "Multiple Permissive Policies"
  
  Supabase may flag this as "multiple permissive policies" but this is actually the 
  correct and performant approach. Having separate policies for different roles is 
  better than a single policy that checks role per-row.
  
  The alternative (single consolidated policy) would require runtime role checking,
  which is exactly what we're trying to avoid for performance reasons.
*/

-- ============================================================================
-- FIX CLIENTS TABLE SELECT POLICY
-- ============================================================================

-- Drop the consolidated policy that uses current_setting()
DROP POLICY IF EXISTS "Allow client login and admin access" ON public.clients;

-- Create separate optimized policies for each role

-- Policy 1: Allow anon users to read for login verification
CREATE POLICY "Allow login verification"
  ON public.clients
  FOR SELECT
  TO anon
  USING (true);

-- Policy 2: Allow authenticated admin users to read all clients
CREATE POLICY "Admins can read all clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies are correctly configured:
-- SELECT tablename, policyname, roles, cmd, 
--        CASE WHEN qual LIKE '%current_setting%' THEN 'HAS_ISSUE' ELSE 'OK' END as status
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'clients'
-- ORDER BY policyname;
