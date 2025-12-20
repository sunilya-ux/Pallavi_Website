/*
  # Fix Security and Performance Issues
  
  ## Summary
  This migration addresses multiple security and performance concerns identified by Supabase's advisor.
  
  ## Changes Made
  
  ### 1. Performance Optimizations
  
  #### Add Missing Foreign Key Index
  - **Table**: `passion_coaching_responses`
  - **Issue**: Foreign key `client_id` was not indexed, causing slow JOIN operations
  - **Fix**: Create index `idx_passion_coaching_responses_client_id`
  - **Impact**: Significantly improves query performance when joining with clients table
  
  #### Remove Unused Index
  - **Table**: `clients`
  - **Issue**: Index `idx_clients_status` was created but never used in queries
  - **Fix**: Drop the unused index to reduce storage overhead and improve write performance
  
  ### 2. RLS Policy Performance Improvements
  
  #### Auth Function Initialization
  - **Issue**: Multiple RLS policies re-evaluate `auth.uid()` for each row, causing O(n) performance
  - **Fix**: Wrap `auth.uid()` in subquery `(select auth.uid())` to evaluate once per query (O(1))
  - **Affected Policies**:
    - `profiles`: "Users can read own profile"
    - `profiles`: "Users can update own profile"
    - `clients`: "Admins can read all clients"
    - `clients`: "Admins can insert clients"
    - `clients`: "Admins can update clients"
    - `clients`: "Admins can delete clients"
  
  ### 3. Policy Consolidation
  
  #### Clients Table SELECT Policies
  - **Issue**: Multiple permissive SELECT policies ("Admins can read all clients" + "Allow login verification")
  - **Fix**: Consolidate into single policy that handles both use cases efficiently
  - **Security Note**: The login verification mechanism exposes client records to unauthenticated users.
    This is by design for the current authentication flow but should be considered for refactoring
    to use server-side verification via edge functions in the future.
  
  ## Important Notes
  
  ### Manual Dashboard Configuration Required
  
  The following issues cannot be fixed via SQL migration and require manual configuration in the Supabase Dashboard:
  
  1. **Auth DB Connection Strategy**
     - Navigate to: Project Settings → Database → Connection Pooling
     - Change from fixed "10 connections" to percentage-based allocation
     - Recommended: Set to appropriate percentage based on your instance size
  
  2. **Leaked Password Protection**
     - Navigate to: Authentication → Providers → Email
     - Enable "Password breach detection"
     - This checks passwords against HaveIBeenPwned.org database
     - No API key required, works automatically
  
  ## Testing Recommendations
  
  After applying this migration:
  1. Test admin user can still view/manage all clients
  2. Test regular users can only see their own profile
  3. Test unauthenticated users can still perform login verification
  4. Monitor query performance improvements using Supabase query analyzer
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEX
-- ============================================================================

-- Add index on passion_coaching_responses.client_id for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_passion_coaching_responses_client_id 
ON public.passion_coaching_responses(client_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEX
-- ============================================================================

-- Drop unused status index on clients table
DROP INDEX IF EXISTS public.idx_clients_status;

-- ============================================================================
-- 3. UPDATE PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK (
    (select auth.uid()) = id 
    AND role = (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
  );

-- ============================================================================
-- 4. UPDATE CLIENTS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Allow login verification" ON public.clients;

-- Create consolidated SELECT policy for both login verification and admin access
CREATE POLICY "Allow client login and admin access"
  ON public.clients
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow anon users for login verification (current authentication mechanism)
    -- OR allow authenticated admin users for client management
    CASE 
      WHEN current_setting('role') = 'anon' THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'admin'
      )
    END
  );

-- Recreate admin-only policies with optimized auth.uid() calls
CREATE POLICY "Admins can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES (commented out)
-- ============================================================================

-- Verify indexes exist:
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename IN ('clients', 'passion_coaching_responses', 'profiles')
-- ORDER BY tablename, indexname;

-- Verify policies:
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
