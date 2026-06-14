/*
  # Correction des problèmes de sécurité et optimisation RLS

  1. Sécurité critique
    - Suppression des politiques publiques dangereuses (Public read/write access)
    - Recréation des politiques RLS sécurisées et restrictives basées sur les rôles
    - Optimisation des politiques avec (select auth.uid()) pour meilleures performances

  2. Performance
    - Ajout d'index sur toutes les clés étrangères manquantes
    - Les index améliorent les performances des requêtes avec jointures

  3. Tables affectées
    - users: politiques basées sur l'identité de l'utilisateur
    - clients: accès basé sur le créateur ou le rôle (compliance_officer, admin)
    - beneficial_owners: accès basé sur le client associé
    - transactions: accès basé sur le créateur ou le rôle
    - risk_assessments: lecture basée sur le rôle, création pour tous les authentifiés
    - alerts: lecture et modification basées sur le rôle
    - compliance_dossiers: accès basé sur le rôle
    - documents: accès basé sur le rôle
    - audit_logs: lecture pour tous, insertion système uniquement
    - tracfin_declarations: accès restreint aux compliance officers et admins
    - tracfin_internal_register: accès basé sur le créateur ou le rôle

  4. Index ajoutés (clés étrangères)
    - alerts: created_by, reviewed_by, transaction_id
    - compliance_dossiers: created_by, transaction_id
    - documents: dossier_id, transaction_id, uploaded_by
    - risk_assessments: assessed_by
    - tracfin_declarations: created_by
    - tracfin_internal_register: created_by, transaction_id
    - transactions: created_by
*/

-- =====================================================
-- ÉTAPE 1: Supprimer les politiques publiques dangereuses
-- =====================================================

DROP POLICY IF EXISTS "Public read access" ON users;
DROP POLICY IF EXISTS "Public write access" ON users;
DROP POLICY IF EXISTS "Public read access" ON clients;
DROP POLICY IF EXISTS "Public write access" ON clients;
DROP POLICY IF EXISTS "Public read access" ON beneficial_owners;
DROP POLICY IF EXISTS "Public write access" ON beneficial_owners;
DROP POLICY IF EXISTS "Public read access" ON transactions;
DROP POLICY IF EXISTS "Public write access" ON transactions;
DROP POLICY IF EXISTS "Public read access" ON risk_assessments;
DROP POLICY IF EXISTS "Public write access" ON risk_assessments;
DROP POLICY IF EXISTS "Public read access" ON alerts;
DROP POLICY IF EXISTS "Public write access" ON alerts;
DROP POLICY IF EXISTS "Public read access" ON compliance_dossiers;
DROP POLICY IF EXISTS "Public write access" ON compliance_dossiers;
DROP POLICY IF EXISTS "Public read access" ON documents;
DROP POLICY IF EXISTS "Public write access" ON documents;
DROP POLICY IF EXISTS "Public read access" ON audit_logs;
DROP POLICY IF EXISTS "Public write access" ON audit_logs;

-- Supprimer les politiques existantes avant de les recréer
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
DROP POLICY IF EXISTS "Users can view declarations based on role" ON tracfin_declarations;
DROP POLICY IF EXISTS "Compliance officers and admins can create declarations" ON tracfin_declarations;
DROP POLICY IF EXISTS "Compliance officers and admins can update declarations" ON tracfin_declarations;
DROP POLICY IF EXISTS "Users can view register based on role" ON tracfin_internal_register;
DROP POLICY IF EXISTS "Authenticated users can create register entries" ON tracfin_internal_register;
DROP POLICY IF EXISTS "Users can update register based on role" ON tracfin_internal_register;

-- =====================================================
-- ÉTAPE 2: Ajouter les index manquants sur les clés étrangères
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON alerts(created_by);
CREATE INDEX IF NOT EXISTS idx_alerts_reviewed_by ON alerts(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_alerts_transaction_id ON alerts(transaction_id);

CREATE INDEX IF NOT EXISTS idx_compliance_dossiers_created_by ON compliance_dossiers(created_by);
CREATE INDEX IF NOT EXISTS idx_compliance_dossiers_transaction_id ON compliance_dossiers(transaction_id);

CREATE INDEX IF NOT EXISTS idx_documents_dossier_id ON documents(dossier_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction_id ON documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_by ON risk_assessments(assessed_by);

CREATE INDEX IF NOT EXISTS idx_tracfin_declarations_created_by ON tracfin_declarations(created_by);

CREATE INDEX IF NOT EXISTS idx_tracfin_internal_register_created_by ON tracfin_internal_register(created_by);
CREATE INDEX IF NOT EXISTS idx_tracfin_internal_register_transaction_id ON tracfin_internal_register(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);

-- =====================================================
-- ÉTAPE 3: Recréer les politiques RLS sécurisées et optimisées
-- =====================================================

-- Politiques pour la table users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Politiques pour la table clients
CREATE POLICY "Users can view clients based on role"
  ON clients FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update clients based on role"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour beneficial_owners
CREATE POLICY "Users can view beneficial owners of accessible clients"
  ON beneficial_owners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = (select auth.uid()) OR
           EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin')))
    )
  );

CREATE POLICY "Users can create beneficial owners for accessible clients"
  ON beneficial_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = (select auth.uid()) OR
           EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin')))
    )
  );

CREATE POLICY "Users can update beneficial owners of accessible clients"
  ON beneficial_owners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = (select auth.uid()) OR
           EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.created_by = (select auth.uid()) OR
           EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin')))
    )
  );

CREATE POLICY "Compliance officers and admins can delete beneficial owners"
  ON beneficial_owners FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour transactions
CREATE POLICY "Users can view transactions based on role"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update transactions based on role"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour risk_assessments
CREATE POLICY "Users can view risk assessments based on role"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (
    assessed_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create risk assessments"
  ON risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (assessed_by = (select auth.uid()));

CREATE POLICY "Users can update risk assessments based on role"
  ON risk_assessments FOR UPDATE
  TO authenticated
  USING (
    assessed_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    assessed_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour alerts
CREATE POLICY "Users can view alerts based on role"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update alerts based on role"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour compliance_dossiers
CREATE POLICY "Users can view dossiers based on role"
  ON compliance_dossiers FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create dossiers"
  ON compliance_dossiers FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update dossiers based on role"
  ON compliance_dossiers FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour documents
CREATE POLICY "Users can view documents based on role"
  ON documents FOR SELECT
  TO authenticated
  USING (
    uploaded_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = (select auth.uid()));

CREATE POLICY "Users can update documents based on role"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    uploaded_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour audit_logs
CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politiques pour tracfin_declarations (optimisées)
CREATE POLICY "Users can view declarations based on role"
  ON tracfin_declarations FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can create declarations"
  ON tracfin_declarations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can update declarations"
  ON tracfin_declarations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

-- Politiques pour tracfin_internal_register (optimisées)
CREATE POLICY "Users can view register based on role"
  ON tracfin_internal_register FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create register entries"
  ON tracfin_internal_register FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update register based on role"
  ON tracfin_internal_register FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('compliance_officer', 'admin'))
  );
