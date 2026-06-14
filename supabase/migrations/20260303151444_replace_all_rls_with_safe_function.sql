/*
  # Replace All RLS Policies to Use Safe is_admin() Function

  1. Problem
    - All tables have policies that query the users table
    - This creates infinite recursion after the users table policies were fixed
    
  2. Solution
    - Use the is_admin() security definer function instead of querying users table
    - This breaks the circular dependency
    
  3. Security
    - Same security model, but without recursion
    - All role checks now use the safe is_admin() function
*/

-- Create helper functions for role checks
CREATE OR REPLACE FUNCTION is_compliance_officer()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'compliance_officer', false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin_or_compliance()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role IN ('admin', 'compliance_officer'), false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Fix all policies for each table

-- CLIENTS
DROP POLICY IF EXISTS "Users can view clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can update clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can delete clients based on role" ON clients;

CREATE POLICY "Users can view clients based on role"
  ON clients FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR agent_id = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can update clients based on role"
  ON clients FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR agent_id = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can delete clients based on role"
  ON clients FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin());

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can view transactions based on role" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions based on role" ON transactions;
DROP POLICY IF EXISTS "Compliance officers and admins can delete transactions" ON transactions;

CREATE POLICY "Users can view transactions based on role"
  ON transactions FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can update transactions based on role"
  ON transactions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance())
  WITH CHECK (created_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Compliance officers and admins can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (is_admin_or_compliance());

-- ALERTS
DROP POLICY IF EXISTS "Users can view alerts based on role" ON alerts;
DROP POLICY IF EXISTS "Users can update alerts based on role" ON alerts;

CREATE POLICY "Users can view alerts based on role"
  ON alerts FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can update alerts based on role"
  ON alerts FOR UPDATE
  TO authenticated
  USING (is_admin_or_compliance())
  WITH CHECK (is_admin_or_compliance());

-- COMPLIANCE_DOSSIERS
DROP POLICY IF EXISTS "Users can view dossiers based on role" ON compliance_dossiers;
DROP POLICY IF EXISTS "Users can update dossiers based on role" ON compliance_dossiers;

CREATE POLICY "Users can view dossiers based on role"
  ON compliance_dossiers FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can update dossiers based on role"
  ON compliance_dossiers FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance())
  WITH CHECK (created_by = auth.uid() OR is_admin_or_compliance());

-- RISK_ASSESSMENTS
DROP POLICY IF EXISTS "Users can view risk assessments based on role" ON risk_assessments;
DROP POLICY IF EXISTS "Users can update risk assessments based on role" ON risk_assessments;

CREATE POLICY "Users can view risk assessments based on role"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (assessed_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can update risk assessments based on role"
  ON risk_assessments FOR UPDATE
  TO authenticated
  USING (assessed_by = auth.uid() OR is_admin_or_compliance())
  WITH CHECK (assessed_by = auth.uid() OR is_admin_or_compliance());

-- DOCUMENTS
DROP POLICY IF EXISTS "Users can view documents based on role" ON documents;
DROP POLICY IF EXISTS "Users can update documents based on role" ON documents;
DROP POLICY IF EXISTS "Compliance officers and admins can delete documents" ON documents;

CREATE POLICY "Users can view documents based on role"
  ON documents FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can update documents based on role"
  ON documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR is_admin_or_compliance())
  WITH CHECK (uploaded_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Compliance officers and admins can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (is_admin_or_compliance());

-- BENEFICIAL_OWNERS
DROP POLICY IF EXISTS "Users can view beneficial owners of accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Users can create beneficial owners for accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Users can update beneficial owners of accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Compliance officers and admins can delete beneficial owners" ON beneficial_owners;

CREATE POLICY "Users can view beneficial owners of accessible clients"
  ON beneficial_owners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR is_admin_or_compliance())
    )
  );

CREATE POLICY "Users can create beneficial owners for accessible clients"
  ON beneficial_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR is_admin_or_compliance())
    )
  );

CREATE POLICY "Users can update beneficial owners of accessible clients"
  ON beneficial_owners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR is_admin_or_compliance())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR is_admin_or_compliance())
    )
  );

CREATE POLICY "Compliance officers and admins can delete beneficial owners"
  ON beneficial_owners FOR DELETE
  TO authenticated
  USING (is_admin_or_compliance());

-- TRACFIN_DECLARATIONS
DROP POLICY IF EXISTS "Users can view declarations based on role" ON tracfin_declarations;
DROP POLICY IF EXISTS "Compliance officers and admins can create declarations" ON tracfin_declarations;
DROP POLICY IF EXISTS "Compliance officers and admins can update declarations" ON tracfin_declarations;

CREATE POLICY "Users can view declarations based on role"
  ON tracfin_declarations FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Compliance officers and admins can create declarations"
  ON tracfin_declarations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_compliance());

CREATE POLICY "Compliance officers and admins can update declarations"
  ON tracfin_declarations FOR UPDATE
  TO authenticated
  USING (is_admin_or_compliance())
  WITH CHECK (is_admin_or_compliance());

-- TRACFIN_INTERNAL_REGISTER
DROP POLICY IF EXISTS "Users can view register based on role" ON tracfin_internal_register;
DROP POLICY IF EXISTS "Users can update register based on role" ON tracfin_internal_register;

CREATE POLICY "Users can view register based on role"
  ON tracfin_internal_register FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Users can update register based on role"
  ON tracfin_internal_register FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_compliance())
  WITH CHECK (created_by = auth.uid() OR is_admin_or_compliance());

-- SIGNATURES
DROP POLICY IF EXISTS "Users can update unlocked signatures or admins can update all" ON signatures;
DROP POLICY IF EXISTS "Only admins can delete signatures" ON signatures;

CREATE POLICY "Users can update unlocked signatures or admins can update all"
  ON signatures FOR UPDATE
  TO authenticated
  USING ((signer_id = auth.uid() AND is_locked = false) OR is_admin())
  WITH CHECK ((signer_id = auth.uid() AND is_locked = false) OR is_admin());

CREATE POLICY "Only admins can delete signatures"
  ON signatures FOR DELETE
  TO authenticated
  USING (is_admin());

-- SUSPICION_REPORTS
DROP POLICY IF EXISTS "Users can view own or admin can view all suspicion reports" ON suspicion_reports;
DROP POLICY IF EXISTS "Admins can update suspicion reports" ON suspicion_reports;

CREATE POLICY "Users can view own or admin can view all suspicion reports"
  ON suspicion_reports FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid() OR is_admin_or_compliance());

CREATE POLICY "Admins can update suspicion reports"
  ON suspicion_reports FOR UPDATE
  TO authenticated
  USING (is_admin_or_compliance());

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Users can view audit logs based on role" ON audit_logs;

CREATE POLICY "Users can view audit logs based on role"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- AGENCY_SETTINGS
DROP POLICY IF EXISTS "Admin users can update agency settings" ON agency_settings;

CREATE POLICY "Admin users can update agency settings"
  ON agency_settings FOR UPDATE
  TO authenticated
  USING (is_admin());
