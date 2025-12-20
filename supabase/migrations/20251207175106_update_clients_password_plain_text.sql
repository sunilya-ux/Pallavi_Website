/*
  # Update Clients Table to Store Plain Text Passwords
  
  1. Changes
    - Rename `password_hash` column to `password`
    - Update to store passwords in plain text for admin visibility
    - This allows admins to view and edit client passwords directly
  
  2. Security Notes
    - This is a controlled admin panel
    - Password visibility is restricted to admin users only via RLS policies
    - Clients cannot access this table
*/

-- Rename password_hash column to password
ALTER TABLE public.clients 
RENAME COLUMN password_hash TO password;
