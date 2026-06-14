/*
  # Add Doubt Level to Clients
  
  1. Schema Changes
    - Add `doubt_level` column to clients table
    - 4 levels: none, low, medium, high
    - Default value: none
    
  2. Details
    - none = Aucun doute (green)
    - low = Doute faible (yellow-green)
    - medium = Doute moyen (orange)
    - high = Doute élevé (red)
*/

-- Add doubt_level column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'doubt_level'
  ) THEN
    ALTER TABLE clients ADD COLUMN doubt_level text DEFAULT 'none' 
    CHECK (doubt_level IN ('none', 'low', 'medium', 'high'));
  END IF;
END $$;
