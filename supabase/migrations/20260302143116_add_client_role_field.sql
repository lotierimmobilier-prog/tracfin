/*
  # Add Client Role Field

  ## Changes
  1. Add client_role column to clients table
     - Possible values: 'vendeur', 'acquereur', 'bailleur', 'locataire', 'caution'
     - Used to specify the client's role in transaction or rental

  ## Purpose
  This field allows agents to specify whether a client is:
  - Transaction: vendeur (seller) or acquéreur (buyer)
  - Location: bailleur (landlord), locataire (tenant), or caution (guarantor)
*/

-- Add client_role column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS client_role text CHECK (client_role IN ('vendeur', 'acquereur', 'bailleur', 'locataire', 'caution'));

-- Add comment for documentation
COMMENT ON COLUMN clients.client_role IS 'Role of client: vendeur (seller), acquereur (buyer), bailleur (landlord), locataire (tenant), or caution (guarantor)';