/*
  # Create agency settings table

  1. New Tables
    - `agency_settings`
      - `id` (uuid, primary key)
      - `agency_name` (text) - Name of the agency
      - `agency_address` (text) - Full address of the agency
      - `agency_siret` (text) - SIRET number (14 digits)
      - `agency_professional_card` (text) - Professional card number
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `updated_by` (uuid) - User who last updated the settings

  2. Security
    - Enable RLS on `agency_settings` table
    - Add policy for all authenticated users to read settings
    - Add policy for admin users to update settings

  3. Data
    - Insert default agency settings for Lotier Immobilier
*/

-- Create agency_settings table
CREATE TABLE IF NOT EXISTS agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name text NOT NULL DEFAULT 'Lotier Immobilier',
  agency_address text NOT NULL DEFAULT '',
  agency_siret text NOT NULL DEFAULT '',
  agency_professional_card text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read settings
CREATE POLICY "Authenticated users can read agency settings"
  ON agency_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admin users to update settings
CREATE POLICY "Admin users can update agency settings"
  ON agency_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default settings (only one row should exist)
INSERT INTO agency_settings (
  agency_name,
  agency_address,
  agency_siret,
  agency_professional_card
)
VALUES (
  'Lotier Immobilier',
  '123 Avenue des Champs-Élysées, 75008 Paris',
  '12345678901234',
  'CPI 7501 2023 000 000 000'
)
ON CONFLICT DO NOTHING;