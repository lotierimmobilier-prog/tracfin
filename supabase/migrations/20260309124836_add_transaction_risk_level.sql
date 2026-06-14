/*
  # Ajout du niveau de risque TRACFIN aux transactions

  1. Modifications
    - Ajout de la colonne `risk_level` à la table `transactions`
      - Type : TEXT avec contrainte CHECK
      - Valeurs possibles : 'low', 'medium', 'high'
      - Valeur par défaut : 'low'
      - Non null
    - Ajout de la colonne `risk_justification` pour documenter le choix du niveau de risque
      - Type : TEXT
      - Nullable (optionnel)

  2. Objectif
    - Permettre la classification du risque LCB-FT pour chaque transaction
    - Conformité avec les articles L561-4-1 et suivants du Code monétaire et financier
    - Faciliter la cartographie des risques et les contrôles TRACFIN

  3. Notes importantes
    - Risque faible : logements résidence principale, financement bancaire classique
    - Risque moyen : immeubles de rapport, locaux commerciaux, SCI, sans financement
    - Risque élevé : biens de luxe, achat/revente rapide, fonds propres importants, société étrangère, non-résidents
*/

-- Ajout de la colonne risk_level à la table transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'risk_level'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN risk_level TEXT DEFAULT 'low' NOT NULL
    CHECK (risk_level IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Ajout de la colonne risk_justification pour documenter le choix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'risk_justification'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN risk_justification TEXT;
  END IF;
END $$;

-- Ajout d'un index pour faciliter les recherches par niveau de risque
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'transactions'
      AND indexname = 'idx_transactions_risk_level'
  ) THEN
    CREATE INDEX idx_transactions_risk_level ON transactions(risk_level);
  END IF;
END $$;

-- Ajout d'un commentaire sur la colonne pour documentation
COMMENT ON COLUMN transactions.risk_level IS 'Niveau de risque TRACFIN : low (faible), medium (moyen), high (élevé) - Conformité LCB-FT articles L561-4-1 et suivants CMF';
COMMENT ON COLUMN transactions.risk_justification IS 'Justification documentée du niveau de risque attribué à la transaction';
