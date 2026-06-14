/*
  # Allow Admins to View and Manage All Users

  1. Changes
    - Update SELECT policy to allow admins to view all users
    - Update UPDATE policy to allow admins to update all users (including roles)
    - Add INSERT and DELETE policies for admins
    
  2. Security
    - Regular users can only read and update their own profile
    - Admins can view and manage all users
    - Role changes only allowed by admins
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

-- Allow users to read own profile OR admins to read all profiles
CREATE POLICY "Users can read profiles"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin());

-- Allow users to update own profile (except role) OR admins to update any profile
CREATE POLICY "Users can update profiles"
  ON users FOR UPDATE
  TO authenticated
  USING (
    -- Own profile (cannot change role)
    (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()))
    OR
    -- Admin can update any profile
    is_admin()
  )
  WITH CHECK (
    -- Own profile (cannot change role)
    (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()))
    OR
    -- Admin can update any profile including role
    is_admin()
  );

-- Admins can insert new users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_admin());

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
