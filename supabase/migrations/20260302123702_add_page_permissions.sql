/*
  # Add page permissions system

  1. New Tables
    - `page_permissions`
      - `id` (uuid, primary key)
      - `role` (text) - user role (agent, compliance_officer, admin)
      - `page_slug` (text) - page identifier
      - `can_access` (boolean) - whether the role can access the page
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `page_permissions` table
    - Add policy for authenticated users to read permissions
    - Add policy for admins to manage permissions

  3. Default Permissions
    - Insert default permissions for all roles and pages
*/

-- Create page_permissions table
CREATE TABLE IF NOT EXISTS page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('agent', 'compliance_officer', 'admin')),
  page_slug text NOT NULL,
  can_access boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, page_slug)
);

-- Enable RLS
ALTER TABLE page_permissions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read permissions
CREATE POLICY "Users can read page permissions"
  ON page_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to manage permissions
CREATE POLICY "Admins can insert page permissions"
  ON page_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update page permissions"
  ON page_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete page permissions"
  ON page_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default permissions
INSERT INTO page_permissions (role, page_slug, can_access)
VALUES
  -- Admin has access to everything
  ('admin', 'dashboard', true),
  ('admin', 'clients', true),
  ('admin', 'transactions', true),
  ('admin', 'risk-assessments', true),
  ('admin', 'alerts', true),
  ('admin', 'dossiers', true),
  ('admin', 'archive', true),
  ('admin', 'users', true),
  ('admin', 'guide', true),
  
  -- Compliance Officer
  ('compliance_officer', 'dashboard', true),
  ('compliance_officer', 'clients', true),
  ('compliance_officer', 'transactions', true),
  ('compliance_officer', 'risk-assessments', true),
  ('compliance_officer', 'alerts', true),
  ('compliance_officer', 'dossiers', true),
  ('compliance_officer', 'archive', true),
  ('compliance_officer', 'users', false),
  ('compliance_officer', 'guide', true),
  
  -- Agent (limited access)
  ('agent', 'dashboard', true),
  ('agent', 'clients', true),
  ('agent', 'transactions', true),
  ('agent', 'risk-assessments', false),
  ('agent', 'alerts', false),
  ('agent', 'dossiers', false),
  ('agent', 'archive', false),
  ('agent', 'users', false),
  ('agent', 'guide', true)
ON CONFLICT (role, page_slug) DO NOTHING;