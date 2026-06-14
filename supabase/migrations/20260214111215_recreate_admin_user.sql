/*
  # Recréer l'utilisateur administrateur

  1. Suppression
    - Supprime l'utilisateur existant
  
  2. Création
    - Crée un nouvel utilisateur admin avec les identifiants :
      - Email: jerome.bouba@lotier-immobilier.com
      - Mot de passe: jb2BSPORT$
  
  Note: Cette migration crée un utilisateur de test pour la démonstration.
*/

DO $$
BEGIN
  -- Supprimer l'utilisateur existant
  DELETE FROM auth.users WHERE email = 'jerome.bouba@lotier-immobilier.com';

  -- Créer un nouvel utilisateur avec le bon mot de passe
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_sent_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jerome.bouba@lotier-immobilier.com',
    crypt('jb2BSPORT$', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    now()
  );

END $$;
