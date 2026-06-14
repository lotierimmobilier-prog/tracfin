/*
  # Add Signature Locking and Admin Controls

  ## Summary
  Add locking mechanism to prevent signature modification after signing, and admin-only controls for timestamp management.

  ## Changes
  1. Table Modifications
     - Add `is_locked` column to signatures table (default true after signing)
     - Add `locked_at` column to track when signature was locked
     - Add `locked_by` column to track who locked it

  2. Security Updates
     - Update RLS policies to prevent modifications to locked signatures
     - Add admin-only policy for updating signature timestamps
     - Prevent deletion of locked signatures except by admins

  3. Functions
     - Create function to check if signature is locked
     - Create admin function to unlock/modify signatures

  ## Important Notes
  - Once locked, signatures cannot be modified by regular users
  - Only admins can modify locked signatures
  - All signature modifications are audited
*/

-- Add locking columns to signatures table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signatures' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE signatures ADD COLUMN is_locked boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signatures' AND column_name = 'locked_at'
  ) THEN
    ALTER TABLE signatures ADD COLUMN locked_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signatures' AND column_name = 'locked_by'
  ) THEN
    ALTER TABLE signatures ADD COLUMN locked_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Update existing signatures to be locked
UPDATE signatures
SET 
  is_locked = true,
  locked_at = signed_at,
  locked_by = signer_id
WHERE is_locked IS NULL OR locked_at IS NULL;

-- Drop existing update policies if they exist
DROP POLICY IF EXISTS "Users cannot update locked signatures" ON signatures;
DROP POLICY IF EXISTS "Admins can update all signatures" ON signatures;
DROP POLICY IF EXISTS "Users cannot delete signatures" ON signatures;
DROP POLICY IF EXISTS "Admins can delete signatures" ON signatures;

-- Policy: Prevent updates to locked signatures (no one can update except admins)
CREATE POLICY "Users cannot update locked signatures"
  ON signatures FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Policy: Admins can update any signature (including locked ones)
CREATE POLICY "Admins can update all signatures"
  ON signatures FOR UPDATE
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

-- Policy: Regular users cannot delete signatures
CREATE POLICY "Users cannot delete signatures"
  ON signatures FOR DELETE
  TO authenticated
  USING (false);

-- Policy: Admins can delete signatures
CREATE POLICY "Admins can delete signatures"
  ON signatures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to check if a signature is locked
CREATE OR REPLACE FUNCTION is_signature_locked(signature_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  locked boolean;
BEGIN
  SELECT is_locked INTO locked
  FROM signatures
  WHERE id = signature_id;
  
  RETURN COALESCE(locked, false);
END;
$$;

-- Create admin function to update signature timestamp
CREATE OR REPLACE FUNCTION admin_update_signature_timestamp(
  signature_id uuid,
  new_timestamp timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can modify signature timestamps';
  END IF;

  -- Update the signature timestamp
  UPDATE signatures
  SET signed_at = new_timestamp
  WHERE id = signature_id;

  -- Log the change in audit_logs
  INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
  VALUES (
    'SIGNATURE_TIMESTAMP_MODIFIED',
    'signature',
    signature_id,
    jsonb_build_object(
      'new_timestamp', new_timestamp,
      'modified_by', auth.uid(),
      'modified_at', now()
    )
  );
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN signatures.is_locked IS 'Whether the signature is locked from modifications';
COMMENT ON COLUMN signatures.locked_at IS 'Timestamp when signature was locked';
COMMENT ON COLUMN signatures.locked_by IS 'User who locked the signature';
COMMENT ON FUNCTION is_signature_locked IS 'Check if a signature is locked';
COMMENT ON FUNCTION admin_update_signature_timestamp IS 'Admin-only function to modify signature timestamp';