/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes for foreign keys on:
      - agency_settings.updated_by
      - signatures.locked_by
      - suspicion_reports.reported_by
      - suspicion_reports.reviewed_by
    
  2. RLS Policy Optimization
    - Replace auth.uid() with (SELECT auth.uid()) in all policies
    - This prevents re-evaluation for each row, improving query performance
    
  3. Security Fixes
    - Remove duplicate permissive policies
    - Fix audit_logs INSERT policy that allows unrestricted access
    - Fix function search paths to be immutable
    
  4. Policy Consolidation
    - Merge duplicate policies into single policies with proper conditions
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_agency_settings_updated_by ON agency_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_signatures_locked_by ON signatures(locked_by);
CREATE INDEX IF NOT EXISTS idx_suspicion_reports_reported_by ON suspicion_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_suspicion_reports_reviewed_by ON suspicion_reports(reviewed_by);

-- Drop existing policies that need to be replaced
DROP POLICY IF EXISTS "Admins can insert page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Admins can update page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Admins can delete page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can view own signatures" ON signatures;
DROP POLICY IF EXISTS "Users can view signatures for their documents" ON signatures;
DROP POLICY IF EXISTS "Authenticated users can create signatures" ON signatures;
DROP POLICY IF EXISTS "Admins can update all signatures" ON signatures;
DROP POLICY IF EXISTS "Users cannot update locked signatures" ON signatures;
DROP POLICY IF EXISTS "Admins can delete signatures" ON signatures;
DROP POLICY IF EXISTS "Users cannot delete signatures" ON signatures;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can create suspicion reports" ON suspicion_reports;
DROP POLICY IF EXISTS "Users can view own suspicion reports" ON suspicion_reports;
DROP POLICY IF EXISTS "Admins can update suspicion reports" ON suspicion_reports;
DROP POLICY IF EXISTS "Users can view clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can update clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can delete clients based on role" ON clients;
DROP POLICY IF EXISTS "Admin users can update agency settings" ON agency_settings;

-- Recreate page_permissions policies with optimized auth checks
CREATE POLICY "Admins can insert page permissions"
  ON page_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update page permissions"
  ON page_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete page permissions"
  ON page_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Recreate users policies with optimized auth checks (merged duplicates)
CREATE POLICY "Users can view profiles based on role"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update profiles based on role"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Recreate signatures policies (merged duplicates)
CREATE POLICY "Users can view signatures"
  ON signatures FOR SELECT
  TO authenticated
  USING (
    signer_id = (SELECT auth.uid())
    OR entity_type IN ('client', 'tracfin_declaration')
  );

CREATE POLICY "Authenticated users can create signatures"
  ON signatures FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update unlocked signatures or admins can update all"
  ON signatures FOR UPDATE
  TO authenticated
  USING (
    (signer_id = (SELECT auth.uid()) AND is_locked = false)
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    (signer_id = (SELECT auth.uid()) AND is_locked = false)
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete signatures"
  ON signatures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Recreate audit_logs policies (merged and fixed)
CREATE POLICY "Users can view audit logs based on role"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Recreate suspicion_reports policies
CREATE POLICY "Users can create suspicion reports"
  ON suspicion_reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = (SELECT auth.uid()));

CREATE POLICY "Users can view own or admin can view all suspicion reports"
  ON suspicion_reports FOR SELECT
  TO authenticated
  USING (
    reported_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'compliance_officer')
    )
  );

CREATE POLICY "Admins can update suspicion reports"
  ON suspicion_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'compliance_officer')
    )
  );

-- Recreate clients policies
CREATE POLICY "Users can view clients based on role"
  ON clients FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR agent_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'compliance_officer')
    )
  );

CREATE POLICY "Users can update clients based on role"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR agent_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'compliance_officer')
    )
  );

CREATE POLICY "Users can delete clients based on role"
  ON clients FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Recreate agency_settings policy
CREATE POLICY "Admin users can update agency settings"
  ON agency_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Fix function search paths to be immutable
DROP FUNCTION IF EXISTS is_signature_locked(uuid) CASCADE;
CREATE FUNCTION is_signature_locked(signature_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM signatures 
    WHERE id = signature_id 
    AND is_locked = true
  );
END;
$$;

DROP FUNCTION IF EXISTS admin_update_signature_timestamp(uuid, timestamptz) CASCADE;
CREATE FUNCTION admin_update_signature_timestamp(
  signature_id uuid,
  new_timestamp timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_role text;
BEGIN
  SELECT role INTO current_user_role
  FROM users
  WHERE id = auth.uid();

  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update signature timestamps';
  END IF;

  UPDATE signatures
  SET signed_at = new_timestamp
  WHERE id = signature_id;
END;
$$;

DROP FUNCTION IF EXISTS log_client_changes() CASCADE;
CREATE FUNCTION log_client_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'CREATE',
      'client',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'UPDATE',
      'client',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'DELETE',
      'client',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS audit_client_changes ON clients;
CREATE TRIGGER audit_client_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_client_changes();
