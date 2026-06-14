/*
  # Ajouter des politiques pour les administrateurs

  1. Modifications
    - Ajout d'une politique SELECT pour permettre aux admins de voir tous les utilisateurs
    - Ajout d'une politique DELETE pour permettre aux admins de supprimer des utilisateurs

  2. Sécurité
    - Les politiques vérifient que l'utilisateur est admin via son rôle dans la table users
*/

-- Supprimer les politiques si elles existent déjà
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Politique pour permettre aux admins de voir tous les utilisateurs
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politique pour permettre aux admins de supprimer des utilisateurs
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
