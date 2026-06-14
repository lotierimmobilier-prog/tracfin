/*
  # Fix Audit Logs Schema Mismatch
  
  1. Schema Changes
    - Add `entity_name` column to audit_logs for better readability
    - Update the trigger function to use correct column names (old_values, new_values)
    
  2. Changes
    - Adds missing entity_name column
    - Updates log_client_changes function to match actual schema
*/

-- Add missing entity_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'entity_name'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN entity_name text;
  END IF;
END $$;

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION log_client_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, old_values)
    VALUES (
      auth.uid(),
      'delete',
      'client',
      OLD.id,
      COALESCE(OLD.company_name, OLD.first_name || ' ' || OLD.last_name),
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, old_values, new_values)
    VALUES (
      auth.uid(),
      'update',
      'client',
      NEW.id,
      COALESCE(NEW.company_name, NEW.first_name || ' ' || NEW.last_name),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, new_values)
    VALUES (
      auth.uid(),
      'create',
      'client',
      NEW.id,
      COALESCE(NEW.company_name, NEW.first_name || ' ' || NEW.last_name),
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS audit_client_changes ON clients;
CREATE TRIGGER audit_client_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_client_changes();
