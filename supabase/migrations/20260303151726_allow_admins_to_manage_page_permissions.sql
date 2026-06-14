/*
  # Allow Admins to Manage Page Permissions

  1. Changes
    - Keep read access for all authenticated users
    - Allow admins to insert, update, and delete page permissions
    
  2. Security
    - All authenticated users can read page permissions (needed for UI)
    - Only admins can modify page permissions
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Service role can insert page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Service role can update page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Service role can delete page permissions" ON page_permissions;

-- Admins can insert page permissions
CREATE POLICY "Admins can insert page permissions"
  ON page_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update page permissions
CREATE POLICY "Admins can update page permissions"
  ON page_permissions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete page permissions
CREATE POLICY "Admins can delete page permissions"
  ON page_permissions FOR DELETE
  TO authenticated
  USING (is_admin());

-- Service role can still do everything (for edge functions)
CREATE POLICY "Service role can manage page permissions"
  ON page_permissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
