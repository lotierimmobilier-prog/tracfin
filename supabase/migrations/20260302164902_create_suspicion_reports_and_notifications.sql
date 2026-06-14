/*
  # Create Suspicion Reports and Notifications System

  1. New Tables
    - `suspicion_reports`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `reported_by` (uuid, foreign key to users)
      - `reason` (text, reason for suspicion)
      - `status` (text, pending/reviewed/escalated)
      - `severity` (text, low/medium/high)
      - `reviewed_by` (uuid, foreign key to users, nullable)
      - `reviewed_at` (timestamptz, nullable)
      - `notes` (text, nullable, admin notes)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `suspicion_reports` table
    - Agents can create reports
    - Agents can read their own reports
    - Admins can read all reports and update status
*/

CREATE TABLE IF NOT EXISTS suspicion_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'escalated', 'dismissed')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE suspicion_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create suspicion reports"
  ON suspicion_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view own suspicion reports"
  ON suspicion_reports
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reported_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update suspicion reports"
  ON suspicion_reports
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

CREATE INDEX IF NOT EXISTS idx_suspicion_reports_client_id ON suspicion_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_suspicion_reports_status ON suspicion_reports(status);
CREATE INDEX IF NOT EXISTS idx_suspicion_reports_created_at ON suspicion_reports(created_at DESC);
