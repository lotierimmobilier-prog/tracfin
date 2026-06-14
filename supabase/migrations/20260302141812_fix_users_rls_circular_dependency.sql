/*
  # Fix Circular Dependency in Users Table RLS

  ## Problem
  The current RLS policies create a circular dependency:
  - To read the users table, we check if the user is admin
  - To check if user is admin, we need to read the users table
  - This causes infinite recursion and 500 errors

  ## Solution
  1. Create a helper function that uses SECURITY DEFINER to bypass RLS
  2. Update policies to use this function instead of subqueries
  3. Ensure users can always read their own profile
  4. Admins can read all profiles

  ## Changes
  - Drop existing problematic policies
  - Create get_user_role() helper function
  - Create new optimized policies without circular dependencies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create helper function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'agent');
END;
$$;

-- Policy: Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Policy: Admins can insert new users
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');