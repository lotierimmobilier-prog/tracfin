/*
  # Add Signature Fields to Tracfin Declarations

  ## Changes
  1. Add signature fields to tracfin_declarations table:
     - declarant_signature_data: Base64 encoded signature image
     - declarant_signature_date: Timestamp of when declaration was signed
     - declarant_signature_agent_id: ID of agent who signed the declaration

  ## Purpose
  Allows agents to sign Tracfin declarations with a drawing signature
  captured via mouse or touch screen, with timestamp tracking.
*/

-- Add signature columns to tracfin_declarations table
ALTER TABLE tracfin_declarations
ADD COLUMN IF NOT EXISTS declarant_signature_data text,
ADD COLUMN IF NOT EXISTS declarant_signature_date timestamptz,
ADD COLUMN IF NOT EXISTS declarant_signature_agent_id uuid REFERENCES users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tracfin_signature_agent ON tracfin_declarations(declarant_signature_agent_id);

-- Add comments for documentation
COMMENT ON COLUMN tracfin_declarations.declarant_signature_data IS 'Base64 encoded signature image data';
COMMENT ON COLUMN tracfin_declarations.declarant_signature_date IS 'Timestamp when declaration was signed';
COMMENT ON COLUMN tracfin_declarations.declarant_signature_agent_id IS 'ID of agent who signed the declaration';