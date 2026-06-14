export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          rcs_number: string | null
          rcs_city: string | null
          role: 'agent' | 'compliance_officer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          rcs_number?: string | null
          rcs_city?: string | null
          role?: 'agent' | 'compliance_officer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          rcs_number?: string | null
          rcs_city?: string | null
          role?: 'agent' | 'compliance_officer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          client_type: 'individual' | 'legal_entity'
          client_role: 'vendeur' | 'acquereur' | 'bailleur' | 'locataire' | 'caution' | null
          first_name: string | null
          last_name: string | null
          company_name: string | null
          birth_date: string | null
          birth_place: string | null
          nationality: string | null
          id_document_type: string | null
          id_document_number: string | null
          id_document_expiry: string | null
          id_document_issue_date: string | null
          legal_form: string | null
          siren: string | null
          siret: string | null
          legal_representative_name: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string | null
          phone: string | null
          email: string | null
          profession: string | null
          annual_income: number | null
          income_source: string | null
          is_pep: boolean
          pep_details: string | null
          risk_level: 'low' | 'medium' | 'high'
          doubt_level: 'none' | 'low' | 'medium' | 'high'
          status: 'active' | 'archived'
          created_by: string | null
          signature_data: string | null
          signature_date: string | null
          signature_agent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_type: 'individual' | 'legal_entity'
          client_role?: 'vendeur' | 'acquereur' | 'bailleur' | 'locataire' | 'caution' | null
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          nationality?: string | null
          id_document_type?: string | null
          id_document_number?: string | null
          id_document_expiry?: string | null
          id_document_issue_date?: string | null
          legal_form?: string | null
          siren?: string | null
          siret?: string | null
          legal_representative_name?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          profession?: string | null
          annual_income?: number | null
          income_source?: string | null
          is_pep?: boolean
          pep_details?: string | null
          risk_level?: 'low' | 'medium' | 'high'
          doubt_level?: 'none' | 'low' | 'medium' | 'high'
          status?: 'active' | 'archived'
          created_by?: string | null
          signature_data?: string | null
          signature_date?: string | null
          signature_agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_type?: 'individual' | 'legal_entity'
          client_role?: 'vendeur' | 'acquereur' | 'bailleur' | 'locataire' | 'caution' | null
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          nationality?: string | null
          id_document_type?: string | null
          id_document_number?: string | null
          id_document_expiry?: string | null
          id_document_issue_date?: string | null
          legal_form?: string | null
          siren?: string | null
          siret?: string | null
          legal_representative_name?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          profession?: string | null
          annual_income?: number | null
          income_source?: string | null
          is_pep?: boolean
          pep_details?: string | null
          risk_level?: 'low' | 'medium' | 'high'
          doubt_level?: 'none' | 'low' | 'medium' | 'high'
          status?: 'active' | 'archived'
          created_by?: string | null
          signature_data?: string | null
          signature_date?: string | null
          signature_agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      beneficial_owners: {
        Row: {
          id: string
          client_id: string
          first_name: string
          last_name: string
          birth_date: string | null
          birth_place: string | null
          nationality: string | null
          address: string | null
          id_document_type: string | null
          id_document_number: string | null
          ownership_percentage: number | null
          is_pep: boolean
          pep_details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          first_name: string
          last_name: string
          birth_date?: string | null
          birth_place?: string | null
          nationality?: string | null
          address?: string | null
          id_document_type?: string | null
          id_document_number?: string | null
          ownership_percentage?: number | null
          is_pep?: boolean
          pep_details?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          first_name?: string
          last_name?: string
          birth_date?: string | null
          birth_place?: string | null
          nationality?: string | null
          address?: string | null
          id_document_type?: string | null
          id_document_number?: string | null
          ownership_percentage?: number | null
          is_pep?: boolean
          pep_details?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          client_id: string
          transaction_type: 'sale' | 'purchase' | 'rental'
          property_address: string
          property_city: string | null
          property_postal_code: string | null
          property_type: string | null
          transaction_amount: number
          payment_method: string | null
          payment_origin: string | null
          payment_destination: string | null
          has_third_party: boolean
          third_party_details: string | null
          unusual_urgency: boolean
          suspicion_detected_date: string | null
          transaction_date: string | null
          status: 'in_progress' | 'completed' | 'cancelled'
          risk_level: 'low' | 'medium' | 'high'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          transaction_type: 'sale' | 'purchase' | 'rental'
          property_address: string
          property_city?: string | null
          property_postal_code?: string | null
          property_type?: string | null
          transaction_amount: number
          payment_method?: string | null
          payment_origin?: string | null
          payment_destination?: string | null
          has_third_party?: boolean
          third_party_details?: string | null
          unusual_urgency?: boolean
          suspicion_detected_date?: string | null
          transaction_date?: string | null
          status?: 'in_progress' | 'completed' | 'cancelled'
          risk_level?: 'low' | 'medium' | 'high'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          transaction_type?: 'sale' | 'purchase' | 'rental'
          property_address?: string
          property_city?: string | null
          property_postal_code?: string | null
          property_type?: string | null
          transaction_amount?: number
          payment_method?: string | null
          payment_origin?: string | null
          payment_destination?: string | null
          has_third_party?: boolean
          third_party_details?: string | null
          unusual_urgency?: boolean
          suspicion_detected_date?: string | null
          transaction_date?: string | null
          status?: 'in_progress' | 'completed' | 'cancelled'
          risk_level?: 'low' | 'medium' | 'high'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      risk_assessments: {
        Row: {
          id: string
          client_id: string | null
          transaction_id: string | null
          assessment_type: 'client' | 'transaction'
          income_coherence_score: number
          funds_origin_score: number
          third_party_score: number
          legal_structure_score: number
          geographic_risk_score: number
          payment_method_score: number
          total_score: number
          risk_level: 'low' | 'medium' | 'high'
          notes: string | null
          assessed_by: string | null
          assessed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          transaction_id?: string | null
          assessment_type: 'client' | 'transaction'
          income_coherence_score?: number
          funds_origin_score?: number
          third_party_score?: number
          legal_structure_score?: number
          geographic_risk_score?: number
          payment_method_score?: number
          total_score?: number
          risk_level?: 'low' | 'medium' | 'high'
          notes?: string | null
          assessed_by?: string | null
          assessed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          transaction_id?: string | null
          assessment_type?: 'client' | 'transaction'
          income_coherence_score?: number
          funds_origin_score?: number
          third_party_score?: number
          legal_structure_score?: number
          geographic_risk_score?: number
          payment_method_score?: number
          total_score?: number
          risk_level?: 'low' | 'medium' | 'high'
          notes?: string | null
          assessed_by?: string | null
          assessed_at?: string
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          client_id: string | null
          transaction_id: string | null
          alert_type: 'suspicious_activity' | 'enhanced_vigilance' | 'pep_detected' | 'inconsistent_income' | 'unusual_payment'
          severity: 'low' | 'medium' | 'high' | 'critical'
          description: string
          status: 'open' | 'under_review' | 'closed' | 'reported'
          internal_decision: string | null
          decision_date: string | null
          created_by: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          transaction_id?: string | null
          alert_type: 'suspicious_activity' | 'enhanced_vigilance' | 'pep_detected' | 'inconsistent_income' | 'unusual_payment'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          description: string
          status?: 'open' | 'under_review' | 'closed' | 'reported'
          internal_decision?: string | null
          decision_date?: string | null
          created_by?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          transaction_id?: string | null
          alert_type?: 'suspicious_activity' | 'enhanced_vigilance' | 'pep_detected' | 'inconsistent_income' | 'unusual_payment'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          description?: string
          status?: 'open' | 'under_review' | 'closed' | 'reported'
          internal_decision?: string | null
          decision_date?: string | null
          created_by?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      compliance_dossiers: {
        Row: {
          id: string
          transaction_id: string | null
          client_id: string
          dossier_type: 'standard' | 'enhanced' | 'suspicious'
          status: 'draft' | 'complete' | 'archived'
          kyc_verified: boolean
          risk_assessed: boolean
          documents_complete: boolean
          beneficial_owners_verified: boolean
          verification_date: string | null
          archived_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_id?: string | null
          client_id: string
          dossier_type?: 'standard' | 'enhanced' | 'suspicious'
          status?: 'draft' | 'complete' | 'archived'
          kyc_verified?: boolean
          risk_assessed?: boolean
          documents_complete?: boolean
          beneficial_owners_verified?: boolean
          verification_date?: string | null
          archived_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string | null
          client_id?: string
          dossier_type?: 'standard' | 'enhanced' | 'suspicious'
          status?: 'draft' | 'complete' | 'archived'
          kyc_verified?: boolean
          risk_assessed?: boolean
          documents_complete?: boolean
          beneficial_owners_verified?: boolean
          verification_date?: string | null
          archived_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          client_id: string | null
          transaction_id: string | null
          dossier_id: string | null
          document_type: 'id_card' | 'proof_address' | 'proof_income' | 'company_registration' | 'kbis' | 'statuts' | 'bank_statement' | 'contract' | 'power_of_attorney' | 'beneficial_owner_declaration' | 'other'
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          uploaded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          transaction_id?: string | null
          dossier_id?: string | null
          document_type: 'id_card' | 'proof_address' | 'proof_income' | 'company_registration' | 'kbis' | 'statuts' | 'bank_statement' | 'contract' | 'power_of_attorney' | 'beneficial_owner_declaration' | 'other'
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          transaction_id?: string | null
          dossier_id?: string | null
          document_type?: 'id_card' | 'proof_address' | 'proof_income' | 'company_registration' | 'kbis' | 'statuts' | 'bank_statement' | 'contract' | 'power_of_attorney' | 'beneficial_owner_declaration' | 'other'
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string
          created_at?: string
        }
      }
      tracfin_declarations: {
        Row: {
          id: string
          client_id: string
          transaction_id: string | null
          operation_nature: string
          operation_amount: number
          operation_date: string
          payment_method: string
          payment_origin: string | null
          payment_destination: string | null
          funds_origin: string | null
          property_address: string | null
          property_type: string | null
          property_price: number | null
          suspicion_reason: string
          facts_observed: string
          inconsistencies: string
          unusual_elements: string | null
          refused_documents: boolean
          large_cash_payment: boolean
          income_inconsistency: boolean
          complex_legal_structure: boolean
          unusual_urgency: boolean
          unknown_third_party: boolean
          foreign_account_used: boolean
          agency_name: string
          agency_address: string
          agency_siret: string
          agency_professional_card: string
          declarant_name: string
          declarant_function: string
          declarant_email: string
          suspicion_detection_date: string
          declaration_date: string
          status: 'draft' | 'submitted' | 'acknowledged'
          internal_decision: string | null
          decision_date: string | null
          created_by: string | null
          declarant_signature_data: string | null
          declarant_signature_date: string | null
          declarant_signature_agent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          transaction_id?: string | null
          operation_nature: string
          operation_amount: number
          operation_date: string
          payment_method: string
          payment_origin?: string | null
          payment_destination?: string | null
          funds_origin?: string | null
          property_address?: string | null
          property_type?: string | null
          property_price?: number | null
          suspicion_reason: string
          facts_observed: string
          inconsistencies: string
          unusual_elements?: string | null
          refused_documents?: boolean
          large_cash_payment?: boolean
          income_inconsistency?: boolean
          complex_legal_structure?: boolean
          unusual_urgency?: boolean
          unknown_third_party?: boolean
          foreign_account_used?: boolean
          agency_name?: string
          agency_address: string
          agency_siret: string
          agency_professional_card: string
          declarant_name: string
          declarant_function: string
          declarant_email: string
          suspicion_detection_date: string
          declaration_date?: string
          status?: 'draft' | 'submitted' | 'acknowledged'
          internal_decision?: string | null
          decision_date?: string | null
          created_by?: string | null
          declarant_signature_data?: string | null
          declarant_signature_date?: string | null
          declarant_signature_agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          transaction_id?: string | null
          operation_nature?: string
          operation_amount?: number
          operation_date?: string
          payment_method?: string
          payment_origin?: string | null
          payment_destination?: string | null
          funds_origin?: string | null
          property_address?: string | null
          property_type?: string | null
          property_price?: number | null
          suspicion_reason?: string
          facts_observed?: string
          inconsistencies?: string
          unusual_elements?: string | null
          refused_documents?: boolean
          large_cash_payment?: boolean
          income_inconsistency?: boolean
          complex_legal_structure?: boolean
          unusual_urgency?: boolean
          unknown_third_party?: boolean
          foreign_account_used?: boolean
          agency_name?: string
          agency_address?: string
          agency_siret?: string
          agency_professional_card?: string
          declarant_name?: string
          declarant_function?: string
          declarant_email?: string
          suspicion_detection_date?: string
          declaration_date?: string
          status?: 'draft' | 'submitted' | 'acknowledged'
          internal_decision?: string | null
          decision_date?: string | null
          created_by?: string | null
          declarant_signature_data?: string | null
          declarant_signature_date?: string | null
          declarant_signature_agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      signatures: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          signer_id: string
          signature_url: string | null
          signature_data: string
          ip_address: string | null
          user_agent: string | null
          signed_at: string
          metadata: Json
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          signer_id: string
          signature_url?: string | null
          signature_data: string
          ip_address?: string | null
          user_agent?: string | null
          signed_at?: string
          metadata?: Json
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          signer_id?: string
          signature_url?: string | null
          signature_data?: string
          ip_address?: string | null
          user_agent?: string | null
          signed_at?: string
          metadata?: Json
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
        }
      }
      tracfin_internal_register: {
        Row: {
          id: string
          client_id: string
          transaction_id: string | null
          verification_date: string
          verification_type: string
          risk_level: 'low' | 'medium' | 'high'
          decision: string
          decision_reason: string | null
          collaborator_name: string
          collaborator_function: string
          documents_received: string[] | null
          kyc_complete: boolean
          beneficial_owner_verified: boolean
          funds_origin_verified: boolean
          comments: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          transaction_id?: string | null
          verification_date?: string
          verification_type: string
          risk_level?: 'low' | 'medium' | 'high'
          decision: string
          decision_reason?: string | null
          collaborator_name: string
          collaborator_function: string
          documents_received?: string[] | null
          kyc_complete?: boolean
          beneficial_owner_verified?: boolean
          funds_origin_verified?: boolean
          comments?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          transaction_id?: string | null
          verification_date?: string
          verification_type?: string
          risk_level?: 'low' | 'medium' | 'high'
          decision?: string
          decision_reason?: string | null
          collaborator_name?: string
          collaborator_function?: string
          documents_received?: string[] | null
          kyc_complete?: boolean
          beneficial_owner_verified?: boolean
          funds_origin_verified?: boolean
          comments?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}
