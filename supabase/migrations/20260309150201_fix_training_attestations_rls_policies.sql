/*
  # Fix training attestations RLS policies to prevent infinite recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create simplified policies without subqueries to users table
    - Use a security definer function to check admin role safely

  2. Security
    - Users can still view and insert their own attestations
    - Admins can view all attestations via a safe function
    - No modifications or deletions allowed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own attestations" ON training_attestations;
DROP POLICY IF EXISTS "Admins can view all attestations" ON training_attestations;
DROP POLICY IF EXISTS "Users can insert own attestation once" ON training_attestations;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Policy: Users can view their own attestations
CREATE POLICY "Users can view own attestations"
  ON training_attestations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all attestations (using safe function)
CREATE POLICY "Admins can view all attestations"
  ON training_attestations
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Policy: Users can insert their own attestation (simplified check)
CREATE POLICY "Users can insert own attestation"
  ON training_attestations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- NO UPDATE POLICY - Attestations are immutable
-- NO DELETE POLICY - Attestations cannot be deleted
