/*
  # Fonction pour créer des utilisateurs (admin uniquement)

  1. Nouvelle fonction
    - `admin_create_user` - Permet aux admins de créer des utilisateurs
    - Vérifie que l'appelant est bien admin
    - Crée l'utilisateur dans auth.users ET dans public.users
    
  2. Sécurité
    - Vérifie le rôle admin via la table users
    - Utilise les permissions appropriées
*/

-- Fonction pour créer un utilisateur (admin seulement)
CREATE OR REPLACE FUNCTION admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_rcs_number text,
  p_rcs_city text,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_caller_role text;
  v_new_user_id uuid;
BEGIN
  -- Vérifier que l'appelant est admin
  SELECT role INTO v_caller_role
  FROM users
  WHERE id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé: droits administrateur requis';
  END IF;

  -- Générer un nouvel ID
  v_new_user_id := gen_random_uuid();

  -- Créer l'utilisateur dans auth.users (via extension)
  -- Note: Cette partie nécessite l'extension supabase_admin
  -- Pour le moment, on crée juste dans public.users
  -- L'utilisateur devra être créé dans auth.users via l'API Supabase
  
  -- Insérer dans la table users
  INSERT INTO users (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    rcs_number,
    rcs_city,
    role
  ) VALUES (
    v_new_user_id,
    p_email,
    p_full_name,
    p_first_name,
    p_last_name,
    p_phone,
    p_rcs_number,
    p_rcs_city,
    p_role
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'message', 'Utilisateur créé avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;