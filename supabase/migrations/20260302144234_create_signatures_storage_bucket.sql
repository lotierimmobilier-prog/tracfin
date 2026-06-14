/*
  # Create Signatures Storage Bucket

  ## Summary
  Creates a storage bucket for signature images with appropriate security policies

  ## Changes
  1. Storage Bucket
     - Create 'signatures' bucket for storing signature PNG files
     - Private bucket (not publicly accessible)
  
  2. Storage Policies
     - Authenticated users can upload their own signatures
     - Users can view signatures for documents they have access to
*/

-- Create signatures storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload signatures
CREATE POLICY "Users can upload own signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own signatures
CREATE POLICY "Users can view own signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own signatures
CREATE POLICY "Users can update own signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own signatures
CREATE POLICY "Users can delete own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);