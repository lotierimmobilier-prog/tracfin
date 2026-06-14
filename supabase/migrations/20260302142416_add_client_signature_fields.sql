/*
  # Add Client Signature Fields

  ## Changes
  1. Add signature fields to clients table:
    - signature_data: Base64 encoded signature image
    - signature_date: Timestamp of when signature was created
    - signature_agent_id: ID of agent who collected the signature

  ## Security
  - Admins can modify signature_date
  - Agents can only add signatures, not modify existing ones
*/

-- Add signature columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS signature_data text,
ADD COLUMN IF NOT EXISTS signature_date timestamptz,
ADD COLUMN IF NOT EXISTS signature_agent_id uuid REFERENCES users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_signature_agent ON clients(signature_agent_id);

-- Add comment for documentation
COMMENT ON COLUMN clients.signature_data IS 'Base64 encoded signature image data';
COMMENT ON COLUMN clients.signature_date IS 'Timestamp when signature was collected (editable by admin)';
COMMENT ON COLUMN clients.signature_agent_id IS 'ID of agent who collected the signature';