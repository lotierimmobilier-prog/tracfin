/*
  # Créer le profil utilisateur admin

  1. Modifications
    - Insère le profil admin dans la table users avec le rôle 'admin'
    - Utilise l'ID de l'utilisateur auth existant

  Note: Cette migration crée le profil manquant pour l'utilisateur administrateur.
*/

INSERT INTO public.users (id, email, full_name, role)
SELECT 
  id,
  email,
  'Administrateur',
  'admin'
FROM auth.users
WHERE email = 'jerome.bouba@lotier-immobilier.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Administrateur';
