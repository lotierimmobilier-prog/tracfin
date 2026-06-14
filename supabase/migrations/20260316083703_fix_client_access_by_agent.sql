/*
  # Corriger les règles d'accès aux clients par agent

  1. Modifications des politiques RLS
    - Les agents voient uniquement leurs propres clients (via agent_id ou created_by)
    - Les admins voient tous les clients
    - Les compliance officers voient tous les clients
  
  2. Sécurité renforcée
    - Politique SELECT : agent_id = auth.uid() OU created_by = auth.uid() OU admin/compliance
    - Politique INSERT : définir automatiquement agent_id et created_by
    - Politique UPDATE : uniquement ses propres clients ou admin/compliance
    - Politique DELETE : uniquement admin

  3. Important
    - Les imports de clients attribuent automatiquement l'agent_id à l'utilisateur qui importe
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can update clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can delete clients based on role" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;

-- Politique SELECT : chaque agent voit uniquement ses clients
CREATE POLICY "Agents view own clients, admins view all"
  ON clients FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR 
    created_by = auth.uid() OR 
    is_admin_or_compliance()
  );

-- Politique INSERT : tout utilisateur authentifié peut créer des clients
CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    (agent_id IS NULL OR agent_id = auth.uid()) AND
    (created_by IS NULL OR created_by = auth.uid())
  );

-- Politique UPDATE : uniquement ses propres clients ou admin/compliance
CREATE POLICY "Agents update own clients, admins update all"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid() OR 
    created_by = auth.uid() OR 
    is_admin_or_compliance()
  )
  WITH CHECK (
    agent_id = auth.uid() OR 
    created_by = auth.uid() OR 
    is_admin_or_compliance()
  );

-- Politique DELETE : uniquement admin
CREATE POLICY "Only admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (is_admin());

-- Fonction trigger pour définir automatiquement agent_id et created_by lors de l'insertion
CREATE OR REPLACE FUNCTION set_client_agent_and_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NULL THEN
    NEW.agent_id := auth.uid();
  END IF;
  
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS set_client_agent_and_creator_trigger ON clients;

-- Créer le trigger
CREATE TRIGGER set_client_agent_and_creator_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_client_agent_and_creator();