/*
  # Add Passion Roadmap Table

  1. New Tables
    - `passion_roadmaps`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `passion` (text, the passion/interest entered)
      - `roadmap_content` (text, generated roadmap)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `passion_roadmaps` table
    - Add policy for authenticated users to read their own roadmaps
    - Add policy for authenticated users to insert their own roadmaps
    - Add policy for authenticated users to update their own roadmaps
*/

CREATE TABLE IF NOT EXISTS passion_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  passion text NOT NULL,
  roadmap_content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE passion_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own passion roadmaps"
  ON passion_roadmaps
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE id = client_id
    )
  );

CREATE POLICY "Users can insert own passion roadmaps"
  ON passion_roadmaps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE id = client_id
    )
  );

CREATE POLICY "Users can update own passion roadmaps"
  ON passion_roadmaps
  FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE id = client_id
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE id = client_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_passion_roadmaps_client_id ON passion_roadmaps(client_id);
CREATE INDEX IF NOT EXISTS idx_passion_roadmaps_created_at ON passion_roadmaps(created_at DESC);
