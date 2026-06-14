-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS on storage.objects (if not already enabled)
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public uploads to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update in documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from documents bucket" ON storage.objects;

-- Create new policies for public access (demo mode)
CREATE POLICY "Allow public uploads to documents bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public read from documents bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

CREATE POLICY "Allow public update in documents bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public delete from documents bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'documents');