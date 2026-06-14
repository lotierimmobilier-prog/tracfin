/*
  # Add phone column to public.users table

  1. Modifications
    - Add phone column to public.users table (if not exists)

  2. Notes
    - This ensures the phone column exists in the public schema
    - Column is nullable to allow existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;
END $$;
