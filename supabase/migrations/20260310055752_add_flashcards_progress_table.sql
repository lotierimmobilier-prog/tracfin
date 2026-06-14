/*
  # Ajouter le suivi de progression des flashcards

  1. Nouvelle table
    - `flashcards_progress`
      - `user_id` (uuid, foreign key vers auth.users)
      - `card_index` (integer, index de la carte)
      - `studied_at` (timestamptz, date de dernière étude)
      - Clé primaire composite sur (user_id, card_index)
  
  2. Sécurité
    - Activer RLS sur la table
    - Autoriser les utilisateurs à gérer uniquement leur propre progression
*/

-- Créer la table de progression des flashcards
CREATE TABLE IF NOT EXISTS flashcards_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_index integer NOT NULL,
  studied_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, card_index)
);

-- Activer RLS
ALTER TABLE flashcards_progress ENABLE ROW LEVEL SECURITY;

-- Politique pour lire sa propre progression
CREATE POLICY "Users can read own flashcards progress"
  ON flashcards_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique pour insérer sa propre progression
CREATE POLICY "Users can insert own flashcards progress"
  ON flashcards_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique pour mettre à jour sa propre progression
CREATE POLICY "Users can update own flashcards progress"
  ON flashcards_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_flashcards_progress_user_id 
  ON flashcards_progress(user_id);