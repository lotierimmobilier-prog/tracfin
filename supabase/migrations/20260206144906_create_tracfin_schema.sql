-- TRACFIN Compliance Management System - Initial Schema
--
-- Complete database schema for real estate agency TRACFIN compliance management
-- including KYC, risk assessment, transaction tracking, alerts, and audit logging

-- Users table for role-based access control
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'compliance_officer', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients table for KYC information
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_type text NOT NULL CHECK (client_type IN ('individual', 'legal_entity')),
  first_name text,
  last_name text,
  company_name text,
  birth_date date,
  birth_place text,
  nationality text,
  id_document_type text,
  id_document_number text,
  id_document_expiry date,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  phone text,
  email text,
  profession text,
  annual_income numeric(12,2),
  income_source text,
  is_pep boolean DEFAULT false,
  pep_details text,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Beneficial owners for legal entities
CREATE TABLE IF NOT EXISTS beneficial_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  nationality text,
  ownership_percentage numeric(5,2),
  is_pep boolean DEFAULT false,
  pep_details text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Real estate transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('sale', 'purchase', 'rental')),
  property_address text NOT NULL,
  property_city text,
  property_postal_code text,
  transaction_amount numeric(12,2) NOT NULL,
  payment_method text,
  payment_origin text,
  has_third_party boolean DEFAULT false,
  third_party_details text,
  transaction_date date,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  assessment_type text NOT NULL CHECK (assessment_type IN ('client', 'transaction')),
  income_coherence_score integer DEFAULT 0,
  funds_origin_score integer DEFAULT 0,
  third_party_score integer DEFAULT 0,
  legal_structure_score integer DEFAULT 0,
  geographic_risk_score integer DEFAULT 0,
  payment_method_score integer DEFAULT 0,
  total_score integer DEFAULT 0,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  notes text,
  assessed_by uuid REFERENCES users(id),
  assessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- TRACFIN alerts
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('suspicious_activity', 'enhanced_vigilance', 'pep_detected', 'inconsistent_income', 'unusual_payment')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'closed', 'reported')),
  internal_decision text,
  decision_date timestamptz,
  created_by uuid REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance dossiers
CREATE TABLE IF NOT EXISTS compliance_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  dossier_type text DEFAULT 'standard' CHECK (dossier_type IN ('standard', 'enhanced', 'suspicious')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'archived')),
  kyc_verified boolean DEFAULT false,
  risk_assessed boolean DEFAULT false,
  documents_complete boolean DEFAULT false,
  beneficial_owners_verified boolean DEFAULT false,
  verification_date timestamptz,
  archived_date timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents storage
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  dossier_id uuid REFERENCES compliance_dossiers(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('id_card', 'proof_address', 'proof_income', 'company_registration', 'contract', 'other')),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_risk_level ON clients(risk_level);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_beneficial_owners_client_id ON beneficial_owners(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_client_id ON risk_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_transaction_id ON risk_assessments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_compliance_dossiers_client_id ON compliance_dossiers(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficial_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for clients table
CREATE POLICY "Agents can view clients they created"
  ON clients FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Agents can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update clients based on role"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies for beneficial_owners
CREATE POLICY "Users can view beneficial owners of accessible clients"
  ON beneficial_owners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin')))
    )
  );

CREATE POLICY "Users can create beneficial owners for accessible clients"
  ON beneficial_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin')))
    )
  );

CREATE POLICY "Users can update beneficial owners of accessible clients"
  ON beneficial_owners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin')))
    )
  );

CREATE POLICY "Compliance officers and admins can delete beneficial owners"
  ON beneficial_owners FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions based on role"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Agents can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update transactions based on role"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies for risk_assessments
CREATE POLICY "Users can view risk assessments based on role"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (
    assessed_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create risk assessments"
  ON risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (assessed_by = auth.uid());

CREATE POLICY "Users can update risk assessments based on role"
  ON risk_assessments FOR UPDATE
  TO authenticated
  USING (
    assessed_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    assessed_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies for alerts
CREATE POLICY "Users can view alerts based on role"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Compliance officers and admins can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies for compliance_dossiers
CREATE POLICY "Users can view dossiers based on role"
  ON compliance_dossiers FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create dossiers"
  ON compliance_dossiers FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update dossiers based on role"
  ON compliance_dossiers FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies for documents
CREATE POLICY "Users can view documents based on role"
  ON documents FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Compliance officers and admins can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies for audit_logs (read-only for all, insert by system)
CREATE POLICY "All authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);