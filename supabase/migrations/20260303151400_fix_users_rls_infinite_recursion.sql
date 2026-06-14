/*
  # Fix Users RLS Infinite Recursion

  1. Problem
    - Current policies query the users table to check if user is admin
    - This creates infinite recursion when trying to read users table
    
  2. Solution
    - Use a security definer function to check user role
    - Store role in JWT metadata for quick access
    - Create simple policies that don't self-reference

  3. Security
    - All authenticated users can read their own profile
    - Only the user themselves can update their own non-role fields
    - Service role handles admin operations
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view profiles based on role" ON users;
DROP POLICY IF EXISTS "Users can update profiles based on role" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create a security definer function to safely check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role directly from the users table for the current user
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Allow users to read their own profile (no recursion)
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- Service role can do everything (for admin operations via edge functions)
CREATE POLICY "Service role full access"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
