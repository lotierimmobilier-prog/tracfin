/*
  # Ajout des champs TRACFIN obligatoires

  1. Modifications de la table clients
    - Ajout champs personne morale: forme juridique, SIREN, SIRET, représentant légal
    - Ajout champ date de délivrance pour pièce d'identité
    - Ajout champs déclarant (agence)

  2. Modifications de la table beneficial_owners
    - Ajout lieu de naissance
    - Ajout adresse
    - Ajout pièce d'identité

  3. Modifications de la table transactions
    - Ajout type de bien immobilier
    - Ajout prix/loyer
    - Ajout destination des fonds
    - Ajout date de détection du soupçon
    - Ajout urgence inhabituelle

  4. Nouvelle table: tracfin_declarations
    - Stocke les déclarations TRACFIN avec tous les champs obligatoires
    - Motif du soupçon détaillé
    - Date de détection et de déclaration
    - Statut de la déclaration

  5. Modifications de la table documents
    - Ajout de nouveaux types de documents (Kbis, statuts, justificatifs, etc.)

  6. Security
    - Politiques RLS pour la nouvelle table tracfin_declarations
*/

-- Ajouter les colonnes manquantes pour les clients (personnes morales)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'legal_form') THEN
    ALTER TABLE clients ADD COLUMN legal_form text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'siren') THEN
    ALTER TABLE clients ADD COLUMN siren text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'siret') THEN
    ALTER TABLE clients ADD COLUMN siret text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'legal_representative_name') THEN
    ALTER TABLE clients ADD COLUMN legal_representative_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'id_document_issue_date') THEN
    ALTER TABLE clients ADD COLUMN id_document_issue_date date;
  END IF;
END $$;

-- Ajouter les colonnes manquantes pour les bénéficiaires effectifs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficial_owners' AND column_name = 'birth_place') THEN
    ALTER TABLE beneficial_owners ADD COLUMN birth_place text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficial_owners' AND column_name = 'address') THEN
    ALTER TABLE beneficial_owners ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficial_owners' AND column_name = 'id_document_type') THEN
    ALTER TABLE beneficial_owners ADD COLUMN id_document_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficial_owners' AND column_name = 'id_document_number') THEN
    ALTER TABLE beneficial_owners ADD COLUMN id_document_number text;
  END IF;
END $$;

-- Ajouter les colonnes manquantes pour les transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'property_type') THEN
    ALTER TABLE transactions ADD COLUMN property_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_destination') THEN
    ALTER TABLE transactions ADD COLUMN payment_destination text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'unusual_urgency') THEN
    ALTER TABLE transactions ADD COLUMN unusual_urgency boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'suspicion_detected_date') THEN
    ALTER TABLE transactions ADD COLUMN suspicion_detected_date date;
  END IF;
END $$;

-- Créer la table des déclarations TRACFIN
CREATE TABLE IF NOT EXISTS tracfin_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Informations sur l'opération suspecte
  operation_nature text NOT NULL,
  operation_amount numeric(12,2) NOT NULL,
  operation_date date NOT NULL,
  payment_method text NOT NULL,
  payment_origin text,
  payment_destination text,
  funds_origin text,
  
  -- Bien immobilier concerné
  property_address text,
  property_type text,
  property_price numeric(12,2),
  
  -- Motif du soupçon (OBLIGATOIRE ET DÉTAILLÉ)
  suspicion_reason text NOT NULL,
  facts_observed text NOT NULL,
  inconsistencies text NOT NULL,
  unusual_elements text,
  
  -- Indicateurs de risque
  refused_documents boolean DEFAULT false,
  large_cash_payment boolean DEFAULT false,
  income_inconsistency boolean DEFAULT false,
  complex_legal_structure boolean DEFAULT false,
  unusual_urgency boolean DEFAULT false,
  unknown_third_party boolean DEFAULT false,
  foreign_account_used boolean DEFAULT false,
  
  -- Informations sur le déclarant (agence)
  agency_name text NOT NULL DEFAULT 'Lotier Immobilier',
  agency_address text NOT NULL,
  agency_siret text NOT NULL,
  agency_professional_card text NOT NULL,
  declarant_name text NOT NULL,
  declarant_function text NOT NULL,
  declarant_email text NOT NULL,
  
  -- Dates importantes
  suspicion_detection_date date NOT NULL,
  declaration_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Statut et suivi
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
  internal_decision text,
  decision_date date,
  
  -- Métadonnées
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les déclarations TRACFIN
CREATE INDEX IF NOT EXISTS idx_tracfin_declarations_client_id ON tracfin_declarations(client_id);
CREATE INDEX IF NOT EXISTS idx_tracfin_declarations_transaction_id ON tracfin_declarations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tracfin_declarations_status ON tracfin_declarations(status);
CREATE INDEX IF NOT EXISTS idx_tracfin_declarations_declaration_date ON tracfin_declarations(declaration_date);

-- Créer la table de registre interne TRACFIN
CREATE TABLE IF NOT EXISTS tracfin_internal_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Date et type de vérification
  verification_date date NOT NULL DEFAULT CURRENT_DATE,
  verification_type text NOT NULL,
  
  -- Niveau de risque évalué
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Décision prise
  decision text NOT NULL,
  decision_reason text,
  
  -- Collaborateur responsable
  collaborator_name text NOT NULL,
  collaborator_function text NOT NULL,
  
  -- Documents reçus
  documents_received text[],
  kyc_complete boolean DEFAULT false,
  beneficial_owner_verified boolean DEFAULT false,
  funds_origin_verified boolean DEFAULT false,
  
  -- Commentaires
  comments text,
  
  -- Métadonnées
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour le registre interne
CREATE INDEX IF NOT EXISTS idx_tracfin_register_client_id ON tracfin_internal_register(client_id);
CREATE INDEX IF NOT EXISTS idx_tracfin_register_verification_date ON tracfin_internal_register(verification_date);
CREATE INDEX IF NOT EXISTS idx_tracfin_register_risk_level ON tracfin_internal_register(risk_level);

-- Mettre à jour les types de documents autorisés
DO $$
BEGIN
  -- Drop la contrainte existante
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
  
  -- Ajouter la nouvelle contrainte avec plus de types
  ALTER TABLE documents ADD CONSTRAINT documents_document_type_check 
    CHECK (document_type IN (
      'id_card',
      'proof_address', 
      'proof_income',
      'company_registration',
      'kbis',
      'statuts',
      'bank_statement',
      'contract',
      'power_of_attorney',
      'beneficial_owner_declaration',
      'other'
    ));
END $$;

-- Enable RLS sur les nouvelles tables
ALTER TABLE tracfin_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracfin_internal_register ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour tracfin_declarations
CREATE POLICY "Users can view declarations based on role"
  ON tracfin_declarations FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can create declarations"
  ON tracfin_declarations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Compliance officers and admins can update declarations"
  ON tracfin_declarations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

-- RLS Policies pour tracfin_internal_register
CREATE POLICY "Users can view register based on role"
  ON tracfin_internal_register FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );

CREATE POLICY "Authenticated users can create register entries"
  ON tracfin_internal_register FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update register based on role"
  ON tracfin_internal_register FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('compliance_officer', 'admin'))
  );
