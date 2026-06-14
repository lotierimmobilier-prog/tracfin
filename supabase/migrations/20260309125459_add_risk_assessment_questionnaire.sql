/*
  # Ajout du questionnaire d'évaluation du risque LCB-FT

  1. Nouvelles tables
    - `transaction_risk_answers`
      - Stocke les réponses au questionnaire d'évaluation du risque pour chaque transaction
      - `id` (uuid, clé primaire)
      - `transaction_id` (uuid, clé étrangère vers transactions)
      - `question_code` (text) - Code de la question (Q1, Q2, etc.)
      - `answer` (boolean) - Réponse (true = facteur de risque présent)
      - `created_at` (timestamp)

  2. Modifications
    - Ajout de la colonne `risk_score` à la table `transactions`
      - Type : INTEGER
      - Nombre de réponses positives (facteurs de risque)
      - Valeur par défaut : 0
    - Ajout de la colonne `auto_alert_sent` à la table `transactions`
      - Type : BOOLEAN
      - Indique si une alerte automatique a été envoyée à l'admin
      - Valeur par défaut : false

  3. Sécurité
    - RLS activé sur la table transaction_risk_answers
    - Politiques pour lecture/écriture par utilisateurs authentifiés

  4. Objectif
    - Permettre l'évaluation structurée du risque via un questionnaire de 10 questions
    - Déclenchement automatique d'une notification admin si score >= 3
    - Traçabilité complète des évaluations de risque
*/

-- Création de la table transaction_risk_answers
CREATE TABLE IF NOT EXISTS transaction_risk_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  question_code text NOT NULL,
  answer boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(transaction_id, question_code)
);

-- Ajout de la colonne risk_score à transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'risk_score'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN risk_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Ajout de la colonne auto_alert_sent à transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'auto_alert_sent'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN auto_alert_sent BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_transaction_risk_answers_transaction_id 
ON transaction_risk_answers(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_risk_score 
ON transactions(risk_score);

-- Activation de RLS sur transaction_risk_answers
ALTER TABLE transaction_risk_answers ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : utilisateurs authentifiés peuvent voir toutes les réponses
CREATE POLICY "Authenticated users can view risk answers"
  ON transaction_risk_answers
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique d'insertion : utilisateurs authentifiés peuvent créer des réponses
CREATE POLICY "Authenticated users can create risk answers"
  ON transaction_risk_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique de mise à jour : utilisateurs authentifiés peuvent modifier les réponses
CREATE POLICY "Authenticated users can update risk answers"
  ON transaction_risk_answers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique de suppression : utilisateurs authentifiés peuvent supprimer les réponses
CREATE POLICY "Authenticated users can delete risk answers"
  ON transaction_risk_answers
  FOR DELETE
  TO authenticated
  USING (true);

-- Commentaires pour documentation
COMMENT ON TABLE transaction_risk_answers IS 'Réponses au questionnaire d''évaluation du risque LCB-FT par transaction';
COMMENT ON COLUMN transactions.risk_score IS 'Score de risque (nombre de facteurs de risque identifiés via le questionnaire)';
COMMENT ON COLUMN transactions.auto_alert_sent IS 'Indique si une notification automatique a été envoyée à l''admin pour risque élevé (score >= 3)';
