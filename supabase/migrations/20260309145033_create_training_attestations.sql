/*
  # Create training attestations system

  1. New Tables
    - `training_attestations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `full_name` (text) - Name of the person attesting
      - `role` (text) - Role/position of the person
      - `signature_data` (text) - Base64 encoded signature image
      - `ip_address` (text) - IP address of the person signing
      - `user_agent` (text) - Browser user agent
      - `attestation_text` (text) - The full text of what was attested
      - `signed_at` (timestamptz) - Timestamp of signature (immutable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `training_attestations` table
    - Users can view their own attestations
    - Users can insert their own attestations (one time only)
    - Admins can view all attestations
    - Attestations cannot be updated or deleted (immutable)

  3. Indexes
    - Index on user_id for fast lookups
    - Index on signed_at for chronological queries
*/

-- Create training_attestations table
CREATE TABLE IF NOT EXISTS training_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  signature_data text NOT NULL,
  ip_address text,
  user_agent text,
  attestation_text text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE training_attestations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_attestations_user_id ON training_attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_training_attestations_signed_at ON training_attestations(signed_at DESC);

-- Policy: Users can view their own attestations
CREATE POLICY "Users can view own attestations"
  ON training_attestations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all attestations
CREATE POLICY "Admins can view all attestations"
  ON training_attestations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Users can insert their own attestation (only if they don't have one already)
CREATE POLICY "Users can insert own attestation once"
  ON training_attestations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM training_attestations
      WHERE training_attestations.user_id = auth.uid()
    )
  );

-- NO UPDATE POLICY - Attestations are immutable
-- NO DELETE POLICY - Attestations cannot be deleted
