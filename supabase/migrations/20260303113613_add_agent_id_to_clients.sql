/*
  # Add agent_id field to clients table for agent-based filtering

  1. Changes
    - Add `agent_id` column to `clients` table (references users.id)
    - Set default value to created_by for existing records
    - Add index on agent_id for performance
  
  2. Security
    - Update RLS policies to enforce agent-based access control:
      - Agents can only view/update their own clients (where agent_id = auth.uid())
      - Admins can view/update all clients
      - Compliance officers can view/update all clients
*/

-- Add agent_id column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN agent_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Set agent_id to created_by for existing records
UPDATE clients SET agent_id = created_by WHERE agent_id IS NULL;

-- Create index on agent_id for performance
CREATE INDEX IF NOT EXISTS idx_clients_agent_id ON clients(agent_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can update clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP POLICY IF EXISTS "Compliance officers and admins can delete clients" ON clients;

-- Create new policies with agent-based access control

-- SELECT policy: Agents see their clients, admins/compliance see all
CREATE POLICY "Users can view clients based on role"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'compliance_officer')
    )
  );

-- UPDATE policy: Agents update their clients, admins/compliance update all
CREATE POLICY "Users can update clients based on role"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'compliance_officer')
    )
  )
  WITH CHECK (
    agent_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'compliance_officer')
    )
  );

-- DELETE policy: Agents delete their clients, admins/compliance delete all
CREATE POLICY "Users can delete clients based on role"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'compliance_officer')
    )
  );
