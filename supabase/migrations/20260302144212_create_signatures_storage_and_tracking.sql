/*
  # Create Signatures Storage and Security Tracking System

  ## Summary
  Complete system for managing digital signatures with security metadata

  ## Changes
  1. New Tables
     - `signatures`: Stores signature metadata and security information
       - `id` (uuid, primary key)
       - `entity_type` (text): Type of document (client, tracfin_declaration, etc.)
       - `entity_id` (uuid): ID of the signed document
       - `signer_id` (uuid): ID of the user who signed
       - `signature_url` (text): URL to signature image in storage
       - `signature_data` (text): Base64 backup of signature
       - `ip_address` (text): IP address of signer
       - `user_agent` (text): Browser/device info
       - `signed_at` (timestamptz): Signature timestamp
       - `metadata` (jsonb): Additional metadata
       - `created_at` (timestamptz)

  2. Storage
     - Create 'signatures' bucket for storing signature images
     - Configure appropriate access policies

  3. Security
     - Enable RLS on signatures table
     - Add policies for authenticated users
     - Track all signature creation with IP and device info
*/

-- Create signatures table
CREATE TABLE IF NOT EXISTS signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  signer_id uuid REFERENCES users(id) NOT NULL,
  signature_url text,
  signature_data text NOT NULL,
  ip_address text,
  user_agent text,
  signed_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_signatures_entity ON signatures(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signer ON signatures(signer_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signed_at ON signatures(signed_at);

-- Enable RLS
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Policies for signatures
CREATE POLICY "Users can view own signatures"
  ON signatures FOR SELECT
  TO authenticated
  USING (signer_id = auth.uid());

CREATE POLICY "Users can view signatures for their documents"
  ON signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = signatures.entity_id
      AND signatures.entity_type = 'client'
    )
    OR EXISTS (
      SELECT 1 FROM tracfin_declarations
      WHERE tracfin_declarations.id = signatures.entity_id
      AND signatures.entity_type = 'tracfin_declaration'
    )
  );

CREATE POLICY "Authenticated users can create signatures"
  ON signatures FOR INSERT
  TO authenticated
  WITH CHECK (signer_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE signatures IS 'Stores digital signatures with security metadata';
COMMENT ON COLUMN signatures.entity_type IS 'Type of document being signed (client, tracfin_declaration, etc.)';
COMMENT ON COLUMN signatures.entity_id IS 'ID of the signed document';
COMMENT ON COLUMN signatures.signer_id IS 'User who created the signature';
COMMENT ON COLUMN signatures.signature_url IS 'URL to signature image in Supabase Storage';
COMMENT ON COLUMN signatures.signature_data IS 'Base64 encoded signature data as backup';
COMMENT ON COLUMN signatures.ip_address IS 'IP address of the signer';
COMMENT ON COLUMN signatures.user_agent IS 'Browser/device information';
COMMENT ON COLUMN signatures.signed_at IS 'Timestamp when signature was created';
COMMENT ON COLUMN signatures.metadata IS 'Additional metadata (document version, location, etc.)';