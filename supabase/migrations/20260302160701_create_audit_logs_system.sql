/*
  # Create Audit Logs System
  
  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - User who performed the action
      - `action` (text) - Type of action (create, update, delete)
      - `entity_type` (text) - Type of entity (client, transaction, etc.)
      - `entity_id` (uuid) - ID of the affected entity
      - `entity_name` (text) - Name/description of the entity for display
      - `old_data` (jsonb) - Previous state (for updates/deletes)
      - `new_data` (jsonb) - New state (for creates/updates)
      - `created_at` (timestamptz) - When the action occurred
      
  2. Security
    - Enable RLS on `audit_logs` table
    - Only admins can read audit logs
    - System can insert audit logs (via triggers)
    
  3. Triggers
    - Auto-log client creation, updates, and deletions
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to log client changes
CREATE OR REPLACE FUNCTION log_client_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, old_data)
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
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, old_data, new_data)
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
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, new_data)
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

-- Create trigger for client changes
DROP TRIGGER IF EXISTS audit_client_changes ON clients;
CREATE TRIGGER audit_client_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_client_changes();

-- Add delete policy for clients (users can delete their own clients)
CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());