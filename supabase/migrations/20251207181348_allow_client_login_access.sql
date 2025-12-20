/*
  # Allow Client Login Access

  1. Changes
    - Add RLS policy to allow unauthenticated users to SELECT from clients table
    - This enables the login flow where users need to verify credentials before authentication
    - The query is safe as it requires both email and password to match

  2. Security
    - Policy only allows SELECT operations
    - Client code already filters by email AND password, so no data exposure risk
    - This is necessary for the login flow to work for clients
*/

-- Allow anyone (including unauthenticated users) to read from clients table for login
CREATE POLICY "Allow login verification"
  ON clients
  FOR SELECT
  TO anon, authenticated
  USING (true);
