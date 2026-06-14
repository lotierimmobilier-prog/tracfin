import { useState, FormEvent, useEffect } from 'react';
import { X, Upload, AlertCircle, Building2, User as UserIcon, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BeneficialOwners } from './BeneficialOwners';
import type { Database } from '../../types/database';

type Client = Database['public']['Tables']['clients']['Row'];

interface BeneficialOwner {
  first_name: string;
  last_name: string;
  birth_date: string;
  nationality: string;
  ownership_percentage: string;
  is_pep: boolean;
  pep_details: string;
}

interface ClientFormProps {
  client?: Client;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientType, setClientType] = useState<'individual' | 'legal_entity'>(client?.client_type || 'individual');
  const [idCardRecto, setIdCardRecto] = useState<File | null>(null);
  const [idCardVerso, setIdCardVerso] = useState<File | null>(null);
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    birth_date: '',
    birth_place: '',
    nationality: 'France',
    id_document_type: 'carte_identite',
    id_document_number: '',
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
  });

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        company_name: client.company_name || '',
        birth_date: client.birth_date || '',
        birth_place: client.birth_place || '',
        nationality: client.nationality || 'France',
        id_document_type: client.id_document_type || 'carte_identite',
        id_document_number: client.id_document_number || '',
        id_document_expiry: client.id_document_expiry || '',
        address: client.address || '',
        city: client.city || '',
        postal_code: client.postal_code || '',
        country: client.country || 'France',
        phone: client.phone || '',
        email: client.email || '',
        profession: client.profession || '',
        annual_income: client.annual_income || '',
        income_source: client.income_source || '',
        is_pep: client.is_pep || false,
        pep_details: client.pep_details || '',
      });
      setClientType(client.client_type);
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Seuls les images et PDF sont acceptés');
        return;
      }
      if (side === 'recto') {
        setIdCardRecto(file);
      } else {
        setIdCardVerso(file);
      }
      setError(null);
    }
  };

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (clientType === 'individual') {
        if (!formData.first_name || !formData.last_name || !formData.birth_date) {
          throw new Error('Prénom, nom et date de naissance sont obligatoires');
        }
      } else {
        if (!formData.company_name) {
          throw new Error('Le nom de la société est obligatoire');
        }
        if (beneficialOwners.length === 0) {
          throw new Error('Au moins un bénéficiaire effectif est requis pour une personne morale');
        }
        const invalidOwners = beneficialOwners.filter(
          owner => !owner.first_name || !owner.last_name || !owner.ownership_percentage
        );
        if (invalidOwners.length > 0) {
          throw new Error('Tous les bénéficiaires effectifs doivent avoir un prénom, nom et pourcentage de participation');
        }
      }

      if (!formData.address || !formData.city || !formData.postal_code) {
        throw new Error('Adresse complète obligatoire');
      }

      if (!formData.id_document_number) {
        throw new Error('Numéro de pièce d\'identité obligatoire');
      }

      if (!client && !idCardRecto) {
        throw new Error('Le recto de la pièce d\'identité est obligatoire');
      }

      const clientData = {
        client_type: clientType,
        first_name: clientType === 'individual' ? formData.first_name : null,
        last_name: clientType === 'individual' ? formData.last_name : null,
        company_name: clientType === 'legal_entity' ? formData.company_name : null,
        birth_date: formData.birth_date || null,
        birth_place: formData.birth_place || null,
        nationality: formData.nationality,
        id_document_type: formData.id_document_type,
        id_document_number: formData.id_document_number,
        id_document_expiry: formData.id_document_expiry || null,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
        phone: formData.phone || null,
        email: formData.email || null,
        profession: formData.profession || null,
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
        income_source: formData.income_source || null,
        is_pep: formData.is_pep,
        pep_details: formData.is_pep ? formData.pep_details : null,
        risk_level: client?.risk_level || 'low',
        status: client?.status || 'active',
      };

      let updatedClient;
      if (client) {
        const { data, error: clientError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id)
          .select()
          .single();

        if (clientError) throw clientError;
        updatedClient = data;
      } else {
        const { data, error: clientError } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single();

        if (clientError) throw clientError;
        updatedClient = data;
      }

      if (clientType === 'legal_entity' && beneficialOwners.length > 0 && !client) {
        const ownersData = beneficialOwners.map(owner => ({
          client_id: updatedClient.id,
          first_name: owner.first_name,
          last_name: owner.last_name,
          birth_date: owner.birth_date || null,
          nationality: owner.nationality,
          ownership_percentage: parseFloat(owner.ownership_percentage),
          is_pep: owner.is_pep,
          pep_details: owner.is_pep ? owner.pep_details : null,
        }));

        const { error: ownersError } = await supabase
          .from('beneficial_owners')
          .insert(ownersData);

        if (ownersError) {
          console.error('Erreur lors de l\'enregistrement des bénéficiaires effectifs:', ownersError);
        }
      }

      if (idCardRecto) {
        try {
          const rectoPath = await uploadDocument(idCardRecto, updatedClient.id, 'id_card_recto');

          await supabase.from('documents').insert({
            client_id: updatedClient.id,
            document_type: 'id_card',
            file_name: `${formData.id_document_type}_recto.${idCardRecto.name.split('.').pop()}`,
            file_path: rectoPath,
            file_size: idCardRecto.size,
            mime_type: idCardRecto.type,
          });
        } catch (uploadError) {
          console.error('Erreur upload documents:', uploadError);
        }
      }

      if (idCardVerso) {
        try {
          const versoPath = await uploadDocument(idCardVerso, updatedClient.id, 'id_card_verso');

          await supabase.from('documents').insert({
            client_id: updatedClient.id,
            document_type: 'id_card',
            file_name: `${formData.id_document_type}_verso.${idCardVerso.name.split('.').pop()}`,
            file_path: versoPath,
            file_size: idCardVerso.size,
            mime_type: idCardVerso.type,
          });
        } catch (uploadError) {
          console.error('Erreur upload documents:', uploadError);
        }
      }

      await supabase.from('audit_logs').insert({
        action: client ? 'CLIENT_UPDATED' : 'CLIENT_CREATED',
        entity_type: 'client',
        entity_id: updatedClient.id,
        new_values: clientData,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erreur lors de ${client ? 'la modification' : 'la création'} du client`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-900">{client ? 'Modifier le client' : 'Nouveau client (KYC)'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4">
            <label className="block text-sm font-medium text-slate-900 mb-3">Type de client *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setClientType('individual')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                  clientType === 'individual'
                    ? 'border-slate-900 bg-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <UserIcon className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">Personne physique</p>
                  <p className="text-xs text-slate-600">Particulier</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setClientType('legal_entity')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                  clientType === 'legal_entity'
                    ? 'border-slate-900 bg-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Building2 className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">Personne morale</p>
                  <p className="text-xs text-slate-600">Société, association</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Identité
            </h3>

            {clientType === 'individual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    name="birth_place"
                    value={formData.birth_place}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de la société *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nationalité
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profession
                </label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {clientType === 'legal_entity' && (
            <BeneficialOwners
              owners={beneficialOwners}
              onChange={setBeneficialOwners}
            />
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pièce d'identité
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type de document *
                </label>
                <select
                  name="id_document_type"
                  value={formData.id_document_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="carte_identite">Carte d'identité</option>
                  <option value="passeport">Passeport</option>
                  <option value="titre_sejour">Titre de séjour</option>
                  <option value="permis_conduire">Permis de conduire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Numéro du document *
                </label>
                <input
                  type="text"
                  name="id_document_number"
                  value={formData.id_document_number}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date d'expiration
                </label>
                <input
                  type="date"
                  name="id_document_expiry"
                  value={formData.id_document_expiry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recto de la pièce d'identité *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'recto')}
                    accept="image/*,application/pdf"
                    className="hidden"
                    id="id-card-recto"
                    required
                  />
                  <label
                    htmlFor="id-card-recto"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 cursor-pointer transition"
                  >
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">
                      {idCardRecto ? idCardRecto.name : 'Choisir un fichier'}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">Image ou PDF, max 5 Mo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verso de la pièce d'identité
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'verso')}
                    accept="image/*,application/pdf"
                    className="hidden"
                    id="id-card-verso"
                  />
                  <label
                    htmlFor="id-card-verso"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 cursor-pointer transition"
                  >
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">
                      {idCardVerso ? idCardVerso.name : 'Choisir un fichier'}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">Optionnel</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Coordonnées</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adresse *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pays *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Informations financières</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Revenus annuels (€)
                </label>
                <input
                  type="number"
                  name="annual_income"
                  value={formData.annual_income}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Origine des revenus
                </label>
                <input
                  type="text"
                  name="income_source"
                  value={formData.income_source}
                  onChange={handleChange}
                  placeholder="Salaire, entreprise, patrimoine..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="is_pep"
                checked={formData.is_pep}
                onChange={handleChange}
                className="mt-1"
                id="is-pep"
              />
              <div className="flex-1">
                <label htmlFor="is-pep" className="font-medium text-red-900 cursor-pointer">
                  Personne Politiquement Exposée (PPE)
                </label>
                <p className="text-xs text-red-700 mt-1">
                  Membre du gouvernement, parlementaire, haut fonctionnaire, dirigeant d'entreprise publique
                </p>
              </div>
            </div>

            {formData.is_pep && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-red-900 mb-2">
                  Précisions sur le statut PPE *
                </label>
                <textarea
                  name="pep_details"
                  value={formData.pep_details}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Fonction exercée, organisme, période..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
            )}
          </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (client ? 'Modification...' : 'Création...') : (client ? 'Modifier le client' : 'Créer le client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
