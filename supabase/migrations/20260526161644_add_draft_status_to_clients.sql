/*
  # Add draft status to clients

  1. Changes
    - Add `is_draft` boolean column to `clients` table (default false)
    - Clients created via auto-save start as drafts (is_draft = true)
    - On final submission the flag is set to false

  2. Notes
    - Existing clients default to false (not drafts)
    - Draft clients are shown with an "En cours..." indicator on the client list
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_draft boolean NOT NULL DEFAULT false;
  END IF;
END $$;
