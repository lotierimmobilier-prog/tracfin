import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import { X, AlertCircle, ChevronRight, ChevronLeft, Check, Save, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/database';
import { IdentityStep } from './steps/IdentityStep';
import { AddressStep } from './steps/AddressStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { LegalEntityStep } from './steps/LegalEntityStep';
import { BeneficialOwnersStep } from './steps/BeneficialOwnersStep';

type Client = Database['public']['Tables']['clients']['Row'];

interface BeneficialOwner {
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  address: string;
  id_document_type: string;
  id_document_number: string;
  ownership_percentage: string;
  is_pep: boolean;
  pep_details: string;
}

interface ClientFormProps {
  client?: Client;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  client_type: 'individual' | 'legal_entity';
  client_role: 'vendeur' | 'acquereur' | 'bailleur' | 'locataire' | 'caution' | '';
  first_name: string;
  last_name: string;
  company_name: string;
  legal_form: string;
  siren: string;
  siret: string;
  legal_representative_name: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  id_document_type: string;
  id_document_number: string;
  id_document_issue_date: string;
  id_document_expiry: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  profession: string;
  annual_income: string;
  income_source: string;
  is_pep: boolean;
  pep_details: string;
  doubt_level: 'none' | 'low' | 'medium' | 'high';
}

interface Documents {
  idCardRecto: File | null;
  idCardVerso: File | null;
  proofAddress: File | null;
  kbis: File | null;
  statuts: File | null;
  proofIncome: File | null;
}

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function MultiStepClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>([]);
  const [documents, setDocuments] = useState<Documents>({
    idCardRecto: null,
    idCardVerso: null,
    proofAddress: null,
    kbis: null,
    statuts: null,
    proofIncome: null,
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  // draftId holds the Supabase id of the draft record created on first auto-save
  const draftIdRef = useRef<string | null>(client?.id || null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const [formData, setFormData] = useState<FormData>({
    client_type: 'individual',
    client_role: '',
    first_name: '',
    last_name: '',
    company_name: '',
    legal_form: '',
    siren: '',
    siret: '',
    legal_representative_name: '',
    birth_date: '',
    birth_place: '',
    nationality: 'France',
    id_document_type: 'carte_identite',
    id_document_number: '',
    id_document_issue_date: '',
    id_document_expiry: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    phone: '',
    email: '',
    profession: '',
    annual_income: '',
    income_source: '',
    is_pep: false,
    pep_details: '',
    doubt_level: 'none',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        client_type: client.client_type,
        client_role: (client.client_role as FormData['client_role']) || '',
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        company_name: client.company_name || '',
        legal_form: client.legal_form || '',
        siren: client.siren || '',
        siret: client.siret || '',
        legal_representative_name: client.legal_representative_name || '',
        birth_date: client.birth_date || '',
        birth_place: client.birth_place || '',
        nationality: client.nationality || 'France',
        id_document_type: client.id_document_type || 'carte_identite',
        id_document_number: client.id_document_number || '',
        id_document_issue_date: client.id_document_issue_date || '',
        id_document_expiry: client.id_document_expiry || '',
        address: client.address || '',
        city: client.city || '',
        postal_code: client.postal_code || '',
        country: client.country || 'France',
        phone: client.phone || '',
        email: client.email || '',
        profession: client.profession || '',
        annual_income: client.annual_income?.toString() || '',
        income_source: client.income_source || '',
        is_pep: client.is_pep || false,
        pep_details: client.pep_details || '',
        doubt_level: client.doubt_level || 'none',
      });
    }
  }, [client]);

  const buildClientPayload = useCallback((isDraft: boolean) => {
    return {
      client_type: formData.client_type,
      client_role: formData.client_role || null,
      first_name: formData.client_type === 'individual' ? formData.first_name : null,
      last_name: formData.client_type === 'individual' ? formData.last_name : null,
      company_name: formData.client_type === 'legal_entity' ? formData.company_name : null,
      legal_form: formData.client_type === 'legal_entity' ? formData.legal_form : null,
      siren: formData.client_type === 'legal_entity' ? formData.siren : null,
      siret: formData.client_type === 'legal_entity' ? formData.siret : null,
      legal_representative_name: formData.client_type === 'legal_entity' ? formData.legal_representative_name : null,
      birth_date: formData.birth_date || null,
      birth_place: formData.birth_place || null,
      nationality: formData.nationality,
      id_document_type: formData.id_document_type,
      id_document_number: formData.id_document_number,
      id_document_issue_date: formData.id_document_issue_date || null,
      id_document_expiry: formData.id_document_expiry || null,
      address: formData.address || null,
      city: formData.city || null,
      postal_code: formData.postal_code || null,
      country: formData.country,
      phone: formData.phone || null,
      email: formData.email || null,
      profession: formData.profession || null,
      annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
      income_source: formData.income_source || null,
      is_pep: formData.is_pep,
      pep_details: formData.is_pep ? formData.pep_details : null,
      risk_level: client?.risk_level || 'low',
      doubt_level: formData.doubt_level,
      status: client?.status || 'active',
      is_draft: isDraft,
    };
  }, [formData, client]);

  const performAutoSave = useCallback(async () => {
    // Only auto-save for new clients (not editing existing confirmed ones)
    if (client && !(client as any).is_draft) return;

    setAutoSaveStatus('saving');
    try {
      const payload = buildClientPayload(true);

      if (draftIdRef.current) {
        const { error: updateError } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', draftIdRef.current);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('clients')
          .insert({ ...payload, created_by: user?.id, agent_id: user?.id })
          .select('id')
          .single();
        if (insertError) throw insertError;
        draftIdRef.current = data.id;
      }

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [buildClientPayload, client, user?.id]);

  // Debounced auto-save whenever formData changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(performAutoSave, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, performAutoSave]);

  const totalSteps = formData.client_type === 'legal_entity' ? 5 : 3;

  const steps = formData.client_type === 'legal_entity'
    ? [
        { number: 1, name: 'Type et identité', completed: currentStep > 1 },
        { number: 2, name: 'Information société', completed: currentStep > 2 },
        { number: 3, name: 'Bénéficiaires effectifs', completed: currentStep > 3 },
        { number: 4, name: 'Coordonnées', completed: currentStep > 4 },
        { number: 5, name: 'Documents', completed: currentStep > 5 },
      ]
    : [
        { number: 1, name: 'Identité', completed: currentStep > 1 },
        { number: 2, name: 'Coordonnées', completed: currentStep > 2 },
        { number: 3, name: 'Documents', completed: currentStep > 3 },
      ];

  const uploadDocument = async (file: File, clientId: string, documentType: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${documentType}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Erreur upload: ${uploadError.message}`);
    }

    return fileName;
  };

  const validateStep = (): boolean => {
    setError(null);

    if (currentStep === 1) {
      if (formData.client_type === 'individual') {
        if (!formData.first_name || !formData.last_name || !formData.birth_date || !formData.birth_place) {
          setError('Prénom, nom, date et lieu de naissance sont obligatoires');
          return false;
        }
        if (!formData.nationality || !formData.profession) {
          setError('Nationalité et profession sont obligatoires');
          return false;
        }
      } else {
        if (!formData.company_name) {
          setError('Le nom de la société est obligatoire');
          return false;
        }
      }
    }

    if (currentStep === 2 && formData.client_type === 'legal_entity') {
      if (!formData.legal_form || !formData.siren || !formData.siret) {
        setError('Forme juridique, SIREN et SIRET sont obligatoires');
        return false;
      }
      if (!formData.legal_representative_name) {
        setError('Identité du représentant légal est obligatoire');
        return false;
      }
    }

    if (currentStep === 3 && formData.client_type === 'legal_entity') {
      if (beneficialOwners.length === 0) {
        setError('Au moins un bénéficiaire effectif est requis');
        return false;
      }
      const invalidOwners = beneficialOwners.filter(
        owner => !owner.first_name || !owner.last_name || !owner.ownership_percentage || !owner.birth_place || !owner.nationality
      );
      if (invalidOwners.length > 0) {
        setError('Tous les bénéficiaires effectifs doivent avoir un prénom, nom, lieu de naissance, nationalité et pourcentage');
        return false;
      }
    }

    const addressStep = formData.client_type === 'legal_entity' ? 4 : 2;
    if (currentStep === addressStep) {
      if (!formData.address || !formData.city || !formData.postal_code) {
        setError('Adresse complète obligatoire');
        return false;
      }
    }

    const documentsStep = formData.client_type === 'legal_entity' ? 5 : 3;
    if (currentStep === documentsStep) {
      if (!documents.idCardRecto && !client) {
        setError('Le recto de la pièce d\'identité est obligatoire');
        return false;
      }
      if (!documents.idCardVerso && !client) {
        setError('Le verso de la pièce d\'identité est obligatoire');
        return false;
      }
      if (!formData.id_document_number || !formData.id_document_issue_date) {
        setError('Numéro et date de délivrance de la pièce d\'identité sont obligatoires');
        return false;
      }
      if (formData.client_type === 'legal_entity') {
        if (!documents.kbis && !client) {
          setError('Le Kbis est obligatoire pour une personne morale');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateStep()) {
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel any pending auto-save
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    try {
      const clientData = {
        ...buildClientPayload(false),
        is_draft: false,
      };

      let updatedClient;
      const targetId = draftIdRef.current || client?.id;

      if (targetId) {
        const { data, error: clientError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', targetId)
          .select()
          .single();

        if (clientError) throw clientError;
        updatedClient = data;
      } else {
        const { data, error: clientError } = await supabase
          .from('clients')
          .insert({ ...clientData, created_by: user?.id, agent_id: user?.id })
          .select()
          .single();

        if (clientError) throw clientError;
        updatedClient = data;
      }

      if (formData.client_type === 'legal_entity' && beneficialOwners.length > 0 && !client) {
        const ownersData = beneficialOwners.map(owner => ({
          client_id: updatedClient.id,
          first_name: owner.first_name,
          last_name: owner.last_name,
          birth_date: owner.birth_date || null,
          birth_place: owner.birth_place || null,
          nationality: owner.nationality,
          address: owner.address || null,
          id_document_type: owner.id_document_type || null,
          id_document_number: owner.id_document_number || null,
          ownership_percentage: parseFloat(owner.ownership_percentage),
          is_pep: owner.is_pep,
          pep_details: owner.is_pep ? owner.pep_details : null,
        }));

        const { error: ownersError } = await supabase
          .from('beneficial_owners')
          .insert(ownersData);

        if (ownersError) {
          console.error('Erreur bénéficiaires effectifs:', ownersError);
        }
      }

      const documentUploads: Array<{ file: File; type: string; docType: string }> = [];

      if (documents.idCardRecto) documentUploads.push({ file: documents.idCardRecto, type: 'id_card_recto', docType: 'id_card' });
      if (documents.idCardVerso) documentUploads.push({ file: documents.idCardVerso, type: 'id_card_verso', docType: 'id_card' });
      if (documents.proofAddress) documentUploads.push({ file: documents.proofAddress, type: 'proof_address', docType: 'proof_address' });
      if (documents.kbis) documentUploads.push({ file: documents.kbis, type: 'kbis', docType: 'kbis' });
      if (documents.statuts) documentUploads.push({ file: documents.statuts, type: 'statuts', docType: 'statuts' });
      if (documents.proofIncome) documentUploads.push({ file: documents.proofIncome, type: 'proof_income', docType: 'proof_income' });

      for (const upload of documentUploads) {
        try {
          const filePath = await uploadDocument(upload.file, updatedClient.id, upload.type);
          await supabase.from('documents').insert({
            client_id: updatedClient.id,
            document_type: upload.docType as any,
            file_name: upload.file.name,
            file_path: filePath,
            file_size: upload.file.size,
            mime_type: upload.file.type,
            uploaded_by: user?.id,
          });
        } catch (uploadError) {
          console.error('Erreur upload:', uploadError);
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du client');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (formData.client_type === 'legal_entity') {
      switch (currentStep) {
        case 1:
          return <IdentityStep formData={formData} setFormData={setFormData} />;
        case 2:
          return <LegalEntityStep formData={formData} setFormData={setFormData} />;
        case 3:
          return <BeneficialOwnersStep owners={beneficialOwners} setOwners={setBeneficialOwners} />;
        case 4:
          return <AddressStep formData={formData} setFormData={setFormData} />;
        case 5:
          return <DocumentsStep formData={formData} setFormData={setFormData} documents={documents} setDocuments={setDocuments} isLegalEntity={true} />;
        default:
          return null;
      }
    } else {
      switch (currentStep) {
        case 1:
          return <IdentityStep formData={formData} setFormData={setFormData} />;
        case 2:
          return <AddressStep formData={formData} setFormData={setFormData} />;
        case 3:
          return <DocumentsStep formData={formData} setFormData={setFormData} documents={documents} setDocuments={setDocuments} isLegalEntity={false} />;
        default:
          return null;
      }
    }
  };

  const renderAutoSaveIndicator = () => {
    if (client && !(client as any).is_draft) return null;

    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Sauvegarde...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Save className="w-3 h-3" />
            Brouillon sauvegardé
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3 h-3" />
            Erreur de sauvegarde
          </div>
        );
      default:
        if (draftIdRef.current) {
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              Brouillon en cours
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {client ? 'Modifier le client' : 'Nouveau client KYC'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-slate-600">Étape {currentStep} sur {totalSteps}</p>
              {renderAutoSaveIndicator()}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                      step.completed
                        ? 'bg-green-100 text-green-700'
                        : currentStep === step.number
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step.completed ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <span className="text-xs text-slate-600 mt-2 text-center max-w-[100px]">
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step.completed ? 'bg-green-200' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {renderStep()}
          </div>

          <div className="flex gap-3 p-6 border-t border-slate-200 flex-shrink-0">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
            <div className="flex-1" />
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enregistrement...' : client ? 'Modifier' : 'Créer le client'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
