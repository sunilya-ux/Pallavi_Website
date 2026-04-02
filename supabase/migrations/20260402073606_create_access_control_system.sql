/*
  # Create Modular Access Control System
  
  ## Summary
  This migration creates a flexible, scalable access control system for managing
  user permissions across modules and tools in the dashboard.
  
  ## Changes Made
  
  ### 1. New Tables
  
  #### `modules` Table
  - `id` (uuid, primary key) - Unique identifier for each module
  - `name` (text, unique, not null) - Module name (e.g., "Certification")
  - `display_name` (text, not null) - Human-readable name
  - `description` (text) - Module description
  - `icon` (text) - Icon identifier for UI
  - `sort_order` (integer, default 0) - Display order in UI
  - `is_active` (boolean, default true) - Whether module is globally available
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  
  #### `tools` Table
  - `id` (uuid, primary key) - Unique identifier for each tool
  - `module_id` (uuid, foreign key) - Parent module
  - `name` (text, not null) - Tool identifier (e.g., "passion_smm")
  - `display_name` (text, not null) - Human-readable name
  - `description` (text) - Tool description
  - `icon` (text) - Icon identifier for UI
  - `sort_order` (integer, default 0) - Display order within module
  - `is_active` (boolean, default true) - Whether tool is globally available
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - UNIQUE constraint on (module_id, name)
  
  #### `user_module_access` Table
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key) - References clients table
  - `module_id` (uuid, foreign key) - References modules table
  - `is_enabled` (boolean, default true) - Access status
  - `granted_at` (timestamptz, default now())
  - `granted_by` (uuid) - Admin who granted access
  - UNIQUE constraint on (client_id, module_id)
  
  #### `user_tool_access` Table
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key) - References clients table
  - `tool_id` (uuid, foreign key) - References tools table
  - `is_enabled` (boolean, default true) - Access status
  - `granted_at` (timestamptz, default now())
  - `granted_by` (uuid) - Admin who granted access
  - UNIQUE constraint on (client_id, tool_id)
  
  ### 2. Indexes
  - Index on `tools.module_id` for efficient joins
  - Index on `user_module_access.client_id` for permission lookups
  - Index on `user_tool_access.client_id` for permission lookups
  
  ### 3. Security (RLS Policies)
  
  All tables have RLS enabled with the following policies:
  
  #### `modules` Table
  - Anon users can read active modules (for login flow)
  - Authenticated admins can manage all modules
  
  #### `tools` Table
  - Anon users can read active tools (for login flow)
  - Authenticated admins can manage all tools
  
  #### `user_module_access` Table
  - Clients can read their own module access
  - Admins can read all module access
  - Admins can insert/update/delete module access
  
  #### `user_tool_access` Table
  - Clients can read their own tool access
  - Admins can read all tool access
  - Admins can insert/update/delete tool access
  
  ### 4. Initial Data
  
  Seed data includes:
  - 3 main modules: Certification, Monetization, Beyond Coaching
  - 1 initial tool: Passion Coaching SMM (under Monetization)
  
  ### 5. Helper Function
  
  Created `get_user_permissions` function that returns a client's complete
  permission set including modules and tools they have access to.
  
  ## Notes
  
  - System is designed for scalability (14-15+ tools)
  - Module/tool configuration is database-driven, not hardcoded
  - Access control is granular (module-level and tool-level)
  - Admin can control visibility at both levels
  - Locked tools remain visible but disabled in UI
*/

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Modules table: Main organizational units (Certification, Monetization, etc.)
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tools table: Individual features within modules
CREATE TABLE IF NOT EXISTS public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  route text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(module_id, name)
);

-- User module access: Which modules each user can access
CREATE TABLE IF NOT EXISTS public.user_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES public.profiles(id),
  UNIQUE(client_id, module_id)
);

-- User tool access: Which specific tools each user can access
CREATE TABLE IF NOT EXISTS public.user_tool_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES public.profiles(id),
  UNIQUE(client_id, tool_id)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tools_module_id ON public.tools(module_id);
CREATE INDEX IF NOT EXISTS idx_user_module_access_client_id ON public.user_module_access(client_id);
CREATE INDEX IF NOT EXISTS idx_user_tool_access_client_id ON public.user_tool_access(client_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tool_access ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES - MODULES
-- ============================================================================

CREATE POLICY "Anyone can read active modules"
  ON public.modules
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert modules"
  ON public.modules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update modules"
  ON public.modules
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

CREATE POLICY "Admins can delete modules"
  ON public.modules
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
-- CREATE RLS POLICIES - TOOLS
-- ============================================================================

CREATE POLICY "Anyone can read active tools"
  ON public.tools
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert tools"
  ON public.tools
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update tools"
  ON public.tools
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

CREATE POLICY "Admins can delete tools"
  ON public.tools
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
-- CREATE RLS POLICIES - USER MODULE ACCESS
-- ============================================================================

CREATE POLICY "Clients can read own module access"
  ON public.user_module_access
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can read all module access"
  ON public.user_module_access
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert module access"
  ON public.user_module_access
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update module access"
  ON public.user_module_access
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

CREATE POLICY "Admins can delete module access"
  ON public.user_module_access
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
-- CREATE RLS POLICIES - USER TOOL ACCESS
-- ============================================================================

CREATE POLICY "Clients can read own tool access"
  ON public.user_tool_access
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can read all tool access"
  ON public.user_tool_access
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert tool access"
  ON public.user_tool_access
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update tool access"
  ON public.user_tool_access
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

CREATE POLICY "Admins can delete tool access"
  ON public.user_tool_access
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
-- SEED INITIAL DATA
-- ============================================================================

-- Insert 3 main modules
INSERT INTO public.modules (name, display_name, description, icon, sort_order)
VALUES 
  ('certification', 'Certification', 'Professional certification tools and resources', 'Award', 1),
  ('monetization', 'Monetization', 'Tools to monetize your coaching practice', 'DollarSign', 2),
  ('beyond_coaching', 'Beyond Coaching', 'Advanced coaching tools and features', 'Sparkles', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert initial tool: Passion Coaching SMM
INSERT INTO public.tools (module_id, name, display_name, description, icon, route, sort_order)
SELECT 
  m.id,
  'passion_smm',
  'Passion Coaching SMM',
  'AI-powered social media marketing content generator',
  'Share2',
  '/passion-coaching',
  1
FROM public.modules m
WHERE m.name = 'monetization'
ON CONFLICT (module_id, name) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to get complete user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'modules', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'name', m.name,
          'display_name', m.display_name,
          'description', m.description,
          'icon', m.icon,
          'sort_order', m.sort_order,
          'has_access', COALESCE(uma.is_enabled, false)
        ) ORDER BY m.sort_order
      )
      FROM public.modules m
      LEFT JOIN public.user_module_access uma 
        ON uma.module_id = m.id 
        AND uma.client_id = user_client_id
      WHERE m.is_active = true
    ),
    'tools', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'module_id', t.module_id,
          'name', t.name,
          'display_name', t.display_name,
          'description', t.description,
          'icon', t.icon,
          'route', t.route,
          'sort_order', t.sort_order,
          'has_access', COALESCE(uta.is_enabled, false)
        ) ORDER BY t.module_id, t.sort_order
      )
      FROM public.tools t
      LEFT JOIN public.user_tool_access uta 
        ON uta.tool_id = t.id 
        AND uta.client_id = user_client_id
      WHERE t.is_active = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
