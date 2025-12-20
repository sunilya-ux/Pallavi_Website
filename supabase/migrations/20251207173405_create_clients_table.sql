/*
  # Create Clients Table
  
  1. New Tables
    - `clients` - Store client account information
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `password_hash` (text, not null) - Securely hashed password
      - `status` (text, default 'Active') - Account status (Active/Inactive)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on clients table
    - Only admins can read all client records
    - Only admins can insert, update, and delete clients
    - Clients cannot access this table directly
  
  3. Important Notes
    - Passwords will be hashed using bcrypt before storage
    - Admin access is determined by checking the profiles table
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  status text DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can select from clients table
CREATE POLICY "Admins can read all clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert clients
CREATE POLICY "Admins can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update clients
CREATE POLICY "Admins can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete clients
CREATE POLICY "Admins can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
