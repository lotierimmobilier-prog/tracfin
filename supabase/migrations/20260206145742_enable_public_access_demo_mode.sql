-- Enable public access for demo mode (no authentication required)
-- This removes authentication requirements from RLS policies

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Agents can view clients they created" ON clients;
DROP POLICY IF EXISTS "Agents can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients based on role" ON clients;
DROP POLICY IF EXISTS "Compliance officers and admins can delete clients" ON clients;
DROP POLICY IF EXISTS "Users can view beneficial owners of accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Users can create beneficial owners for accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Users can update beneficial owners of accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Compliance officers and admins can delete beneficial owners" ON beneficial_owners;
DROP POLICY IF EXISTS "Users can view transactions based on role" ON transactions;
DROP POLICY IF EXISTS "Agents can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions based on role" ON transactions;
DROP POLICY IF EXISTS "Compliance officers and admins can delete transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view risk assessments based on role" ON risk_assessments;
DROP POLICY IF EXISTS "Authenticated users can create risk assessments" ON risk_assessments;
DROP POLICY IF EXISTS "Users can update risk assessments based on role" ON risk_assessments;
DROP POLICY IF EXISTS "Users can view alerts based on role" ON alerts;
DROP POLICY IF EXISTS "Authenticated users can create alerts" ON alerts;
DROP POLICY IF EXISTS "Compliance officers and admins can update alerts" ON alerts;
DROP POLICY IF EXISTS "Users can view dossiers based on role" ON compliance_dossiers;
DROP POLICY IF EXISTS "Authenticated users can create dossiers" ON compliance_dossiers;
DROP POLICY IF EXISTS "Users can update dossiers based on role" ON compliance_dossiers;
DROP POLICY IF EXISTS "Users can view documents based on role" ON documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON documents;
DROP POLICY IF EXISTS "Compliance officers and admins can delete documents" ON documents;
DROP POLICY IF EXISTS "All authenticated users can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- Create public access policies for all tables
CREATE POLICY "Public read access" ON users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON clients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON beneficial_owners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON beneficial_owners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON risk_assessments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON risk_assessments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON compliance_dossiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON compliance_dossiers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write access" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);