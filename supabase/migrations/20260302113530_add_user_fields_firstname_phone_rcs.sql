/*
  # Ajout des champs prénom, téléphone et RCS à la table users

  1. Modifications
    - Ajout du champ `first_name` (prénom de l'agent)
    - Ajout du champ `phone` (numéro de téléphone)
    - Ajout du champ `rcs_number` (numéro RCS)
    - Ajout du champ `rcs_city` (lieu du RCS)
    - Séparation du champ `full_name` en `last_name` (nom de famille)
  
  2. Notes
    - Les champs sont nullable pour permettre la migration des données existantes
    - Le champ `full_name` est conservé pour la compatibilité
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rcs_number'
  ) THEN
    ALTER TABLE users ADD COLUMN rcs_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rcs_city'
  ) THEN
    ALTER TABLE users ADD COLUMN rcs_city text;
  END IF;
END $$;