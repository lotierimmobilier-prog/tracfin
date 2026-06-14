/*
  # Isolation stricte des clients par agent

  1. Modifications des politiques RLS
    - Chaque agent ne voit QUE ses propres clients (agent_id = auth.uid())
    - Seul le rôle 'admin' peut voir tous les clients
    - Les compliance officers ne voient QUE leurs propres clients aussi
  
  2. Règles strictes
    - SELECT : agent_id = auth.uid() OU role = 'admin'
    - UPDATE : agent_id = auth.uid() OU role = 'admin'
    - DELETE : role = 'admin' uniquement
    - INSERT : attribution automatique de agent_id
  
  3. Important
    - Un admin connecté en tant qu'agent ne voit que ses clients d'agent
    - Seul le compte avec role='admin' voit tous les clients
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Agents view own clients, admins view all" ON clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;
DROP POLICY IF EXISTS "Agents update own clients, admins update all" ON clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON clients;

-- Créer une nouvelle fonction pour vérifier si l'utilisateur est admin (par rôle uniquement)
CREATE OR REPLACE FUNCTION is_admin_role()
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
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$;

-- Politique SELECT : uniquement ses propres clients OU admin
CREATE POLICY "Agents view own clients only, admins view all"
  ON clients FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR 
    created_by = auth.uid() OR 
    is_admin_role()
  );

-- Politique INSERT : tout utilisateur authentifié peut créer
CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    (agent_id IS NULL OR agent_id = auth.uid()) AND
    (created_by IS NULL OR created_by = auth.uid())
  );

-- Politique UPDATE : uniquement ses propres clients OU admin
CREATE POLICY "Agents update own clients only, admins update all"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid() OR 
    created_by = auth.uid() OR 
    is_admin_role()
  )
  WITH CHECK (
    agent_id = auth.uid() OR 
    created_by = auth.uid() OR 
    is_admin_role()
  );

-- Politique DELETE : uniquement admin
CREATE POLICY "Only admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- Mettre à jour les politiques pour beneficial_owners
DROP POLICY IF EXISTS "Users can view beneficial owners of accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Users can create beneficial owners for accessible clients" ON beneficial_owners;
DROP POLICY IF EXISTS "Users can update beneficial owners of accessible clients" ON beneficial_owners;

CREATE POLICY "Agents view own beneficial owners, admins view all"
  ON beneficial_owners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.agent_id = auth.uid() OR clients.created_by = auth.uid() OR is_admin_role())
    )
  );

CREATE POLICY "Agents create beneficial owners for own clients"
  ON beneficial_owners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.agent_id = auth.uid() OR clients.created_by = auth.uid() OR is_admin_role())
    )
  );

CREATE POLICY "Agents update own beneficial owners, admins update all"
  ON beneficial_owners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.agent_id = auth.uid() OR clients.created_by = auth.uid() OR is_admin_role())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = beneficial_owners.client_id
      AND (clients.agent_id = auth.uid() OR clients.created_by = auth.uid() OR is_admin_role())
    )
  );

-- Mettre à jour les politiques pour transactions
DROP POLICY IF EXISTS "Users can view transactions based on role" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions based on role" ON transactions;
DROP POLICY IF EXISTS "Compliance officers and admins can delete transactions" ON transactions;

CREATE POLICY "Agents view own transactions, admins view all"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = transactions.client_id
      AND (clients.agent_id = auth.uid() OR clients.created_by = auth.uid() OR is_admin_role())
    )
  );

CREATE POLICY "Agents create transactions for own clients"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = transactions.client_id
      AND (clients.agent_id = auth.uid() OR clients.created_by = auth.uid() OR is_admin_role())
    )
  );

CREATE POLICY "Agents update own transactions, admins update all"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = transactions.client_id
      AND (clients.agent_id = auth.uid() OR clients.created_by = auth.uid() OR is_admin_role())
    )
  );

CREATE POLICY "Only admins can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (is_admin_role());