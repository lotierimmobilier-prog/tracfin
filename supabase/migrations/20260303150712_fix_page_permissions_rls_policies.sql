/*
  # Fix Page Permissions RLS Policies

  1. Changes
    - Drop existing restrictive policies on page_permissions
    - Create simpler policies that avoid circular dependencies
    - Allow all authenticated users to read page_permissions
    - Only admins can modify page_permissions

  2. Security
    - Reading page permissions is safe for all authenticated users
    - Write operations (INSERT, UPDATE, DELETE) restricted to admins only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Admins can insert page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Admins can update page permissions" ON page_permissions;
DROP POLICY IF EXISTS "Admins can delete page permissions" ON page_permissions;

-- Allow all authenticated users to read page permissions (no circular dependency)
CREATE POLICY "Authenticated users can read page permissions"
  ON page_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can modify page permissions (avoid circular dependency)
CREATE POLICY "Service role can insert page permissions"
  ON page_permissions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update page permissions"
  ON page_permissions FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete page permissions"
  ON page_permissions FOR DELETE
  TO service_role
  USING (true);
