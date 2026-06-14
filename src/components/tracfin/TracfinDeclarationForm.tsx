import { useState, FormEvent, useEffect } from 'react';
import { X, AlertTriangle, Check, PenTool } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SignatureCanvas } from '../clients/SignatureCanvas';
import type { Database } from '../../types/database';

type Client = Database['public']['Tables']['clients']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

interface Props {
  clientId?: string;
  transactionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TracfinDeclarationForm({ clientId, transactionId, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>(clientId || '');
  const [selectedTransaction, setSelectedTransaction] = useState<string>(transactionId || '');
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    operation_nature: '',
    operation_amount: '',
    operation_date: '',
    payment_method: '',
    payment_origin: '',
    payment_destination: '',
    funds_origin: '',
    property_address: '',
    property_type: '',
    property_price: '',
    suspicion_reason: '',
    facts_observed: '',
    inconsistencies: '',
    unusual_elements: '',
    refused_documents: false,
    large_cash_payment: false,
    income_inconsistency: false,
    complex_legal_structure: false,
    unusual_urgency: false,
    unknown_third_party: false,
    foreign_account_used: false,
    agency_name: 'Lotier Immobilier',
    agency_address: '',
    agency_siret: '',
    agency_professional_card: '',
    declarant_name: '',
    declarant_function: '',
    declarant_email: '',
    suspicion_detection_date: '',
  });

  useEffect(() => {
    loadClients();
    loadAgencySettings();
    loadUserData();
    if (transactionId) {
      loadTransactionData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      loadTransactions(selectedClient);
    }
  }, [selectedClient]);

  const loadTransactionData = async () => {
    if (!transactionId) return;

    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (transaction) {
      setSelectedClient(transaction.client_id);
      setSelectedTransaction(transactionId);

      const operationNatureMap: Record<string, string> = {
        'sale': 'vente',
        'purchase': 'achat',
        'rental': 'location'
      };

      setFormData(prev => ({
        ...prev,
        operation_nature: operationNatureMap[transaction.transaction_type] || 'autre',
        operation_amount: transaction.transaction_amount.toString(),
        operation_date: transaction.transaction_date || '',
        property_address: transaction.property_address || '',
        property_type: '',
        property_price: transaction.transaction_amount.toString(),
      }));
    }
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    setClients(data || []);
  };

  const loadAgencySettings = async () => {
    const { data } = await supabase
      .from('agency_settings')
      .select('*')
      .maybeSingle();

    if (data) {
      setFormData(prev => ({
        ...prev,
        agency_name: data.agency_name || 'Lotier Immobilier',
        agency_address: data.agency_address || '',
        agency_siret: data.agency_siret || '',
        agency_professional_card: data.agency_professional_card || '',
      }));
    }
  };

  const loadUserData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('firstname, lastname, email, role, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      const fullName = `${data.firstname || ''} ${data.lastname || ''}`.trim();
      const roleMap: Record<string, string> = {
        'admin': 'Administrateur',
        'agent': 'Agent immobilier',
        'agent_mandataire': 'Agent mandataire',
        'compliance': 'Responsable conformité'
      };

      setFormData(prev => ({
        ...prev,
        declarant_name: fullName || data.email,
        declarant_function: roleMap[data.role] || data.role,
        declarant_email: data.email,
      }));
    }
  };

  const loadTransactions = async (clientId: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSaveSignature = (signature: string) => {
    setSignatureData(signature);
    setShowSignatureCanvas(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedClient) {
        throw new Error('Sélectionnez un client');
      }

      if (!formData.operation_nature || !formData.operation_amount || !formData.operation_date) {
        throw new Error('Nature, montant et date de l\'opération sont obligatoires');
      }

      if (!formData.payment_method) {
        throw new Error('Mode de paiement obligatoire');
      }

      if (!formData.suspicion_reason || !formData.facts_observed || !formData.inconsistencies) {
        throw new Error('Motif du soupçon, faits observés et incohérences sont obligatoires');
      }

      if (!formData.agency_address || !formData.agency_siret || !formData.agency_professional_card) {
        throw new Error('Informations de l\'agence obligatoires');
      }

      if (!formData.declarant_name || !formData.declarant_function || !formData.declarant_email) {
        throw new Error('Informations du déclarant obligatoires');
      }

      if (!formData.suspicion_detection_date) {
        throw new Error('Date de détection du soupçon obligatoire');
      }

      if (!signatureData) {
        throw new Error('La signature du déclarant est obligatoire');
      }

      const declarationData = {
        client_id: selectedClient,
        transaction_id: selectedTransaction || null,
        operation_nature: formData.operation_nature,
        operation_amount: parseFloat(formData.operation_amount),
        operation_date: formData.operation_date,
        payment_method: formData.payment_method,
        payment_origin: formData.payment_origin || null,
        payment_destination: formData.payment_destination || null,
        funds_origin: formData.funds_origin || null,
        property_address: formData.property_address || null,
        property_type: formData.property_type || null,
        property_price: formData.property_price ? parseFloat(formData.property_price) : null,
        suspicion_reason: formData.suspicion_reason,
        facts_observed: formData.facts_observed,
        inconsistencies: formData.inconsistencies,
        unusual_elements: formData.unusual_elements || null,
        refused_documents: formData.refused_documents,
        large_cash_payment: formData.large_cash_payment,
        income_inconsistency: formData.income_inconsistency,
        complex_legal_structure: formData.complex_legal_structure,
        unusual_urgency: formData.unusual_urgency,
        unknown_third_party: formData.unknown_third_party,
        foreign_account_used: formData.foreign_account_used,
        agency_name: formData.agency_name,
        agency_address: formData.agency_address,
        agency_siret: formData.agency_siret,
        agency_professional_card: formData.agency_professional_card,
        declarant_name: formData.declarant_name,
        declarant_function: formData.declarant_function,
        declarant_email: formData.declarant_email,
        suspicion_detection_date: formData.suspicion_detection_date,
        declarant_signature_data: signatureData,
        declarant_signature_date: new Date().toISOString(),
        declarant_signature_agent_id: user?.id,
        status: 'draft',
        created_by: user?.id,
      };

      const { error: insertError } = await supabase
        .from('tracfin_declarations')
        .insert(declarationData);

      if (insertError) throw insertError;

      await supabase.from('audit_logs').insert({
        action: 'TRACFIN_DECLARATION_CREATED',
        entity_type: 'tracfin_declaration',
        entity_id: selectedClient,
        new_values: declarationData,
        user_id: user?.id,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la déclaration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Déclaration TRACFIN</h2>
            <p className="text-sm text-red-600 mt-1">Document confidentiel - Ne jamais informer le client</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confidentialité absolue
              </h3>
              <p className="text-sm text-red-800">
                Toute information relative à cette déclaration doit rester strictement confidentielle.
                Il est formellement interdit d'informer le client de l'existence de cette déclaration
                sous peine de sanctions pénales.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">1. Identification du client</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Client concerné *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.client_type === 'legal_entity'
                        ? client.company_name
                        : `${client.first_name} ${client.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && transactions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transaction associée (optionnel)
                  </label>
                  <select
                    value={selectedTransaction}
                    onChange={(e) => setSelectedTransaction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Aucune transaction</option>
                    {transactions.map((transaction) => (
                      <option key={transaction.id} value={transaction.id}>
                        {transaction.transaction_type} - {transaction.property_address} - {transaction.transaction_amount}€
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">2. Informations sur l'opération *</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nature de l'opération *
                  </label>
                  <select
                    name="operation_nature"
                    value={formData.operation_nature}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="vente">Vente</option>
                    <option value="achat">Achat</option>
                    <option value="location">Location</option>
                    <option value="gestion">Gestion</option>
                    <option value="paiement">Paiement</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Montant (€) *
                  </label>
                  <input
                    type="number"
                    name="operation_amount"
                    value={formData.operation_amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de l'opération *
                  </label>
                  <input
                    type="date"
                    name="operation_date"
                    value={formData.operation_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mode de paiement *
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="virement">Virement</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="crypto">Cryptomonnaie</option>
                    <option value="compte_etranger">Compte étranger</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Origine des fonds
                  </label>
                  <input
                    type="text"
                    name="payment_origin"
                    value={formData.payment_origin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Destination des fonds
                  </label>
                  <input
                    type="text"
                    name="payment_destination"
                    value={formData.payment_destination}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Origine détaillée des fonds
                </label>
                <textarea
                  name="funds_origin"
                  value={formData.funds_origin}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">3. Bien immobilier (si concerné)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Adresse du bien
                  </label>
                  <input
                    type="text"
                    name="property_address"
                    value={formData.property_address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type de bien
                  </label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Non précisé</option>
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                    <option value="local_commercial">Local commercial</option>
                    <option value="terrain">Terrain</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prix ou montant du loyer (€)
                </label>
                <input
                  type="number"
                  name="property_price"
                  value={formData.property_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-red-900">4. Motif du soupçon * (ÉLÉMENT ESSENTIEL)</h3>
              <p className="text-sm text-slate-600">Décrire précisément les faits constatés et les raisons du soupçon</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motif du soupçon *
                </label>
                <textarea
                  name="suspicion_reason"
                  value={formData.suspicion_reason}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Expliquer pourquoi cette opération paraît suspecte..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Faits observés *
                </label>
                <textarea
                  name="facts_observed"
                  value={formData.facts_observed}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Décrire les faits constatés de manière factuelle..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Incohérences observées *
                </label>
                <textarea
                  name="inconsistencies"
                  value={formData.inconsistencies}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Décrire les incohérences (revenus, montants, comportement, etc.)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Éléments inhabituels
                </label>
                <textarea
                  name="unusual_elements"
                  value={formData.unusual_elements}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Autres éléments suspects..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">5. Indicateurs de risque</h3>
              <p className="text-sm text-slate-600">Cocher tous les indicateurs qui s'appliquent</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="refused_documents"
                    checked={formData.refused_documents}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Refus de fournir les justificatifs</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="large_cash_payment"
                    checked={formData.large_cash_payment}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Paiement en espèces important</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="income_inconsistency"
                    checked={formData.income_inconsistency}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Incohérence revenus / acquisition</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="complex_legal_structure"
                    checked={formData.complex_legal_structure}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Montage juridique complexe</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="unusual_urgency"
                    checked={formData.unusual_urgency}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Urgence inhabituelle</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="unknown_third_party"
                    checked={formData.unknown_third_party}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Intervention d'un tiers non identifié</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="foreign_account_used"
                    checked={formData.foreign_account_used}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Utilisation de comptes étrangers</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">6. Informations sur l'agence déclarante *</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom de l'agence
                  </label>
                  <input
                    type="text"
                    name="agency_name"
                    value={formData.agency_name}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SIRET *
                  </label>
                  <input
                    type="text"
                    name="agency_siret"
                    value={formData.agency_siret}
                    required
                    maxLength={14}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse de l'agence *
                </label>
                <input
                  type="text"
                  name="agency_address"
                  value={formData.agency_address}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Carte professionnelle *
                </label>
                <input
                  type="text"
                  name="agency_professional_card"
                  value={formData.agency_professional_card}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">7. Déclarant *</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom du déclarant *
                  </label>
                  <input
                    type="text"
                    name="declarant_name"
                    value={formData.declarant_name}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fonction *
                  </label>
                  <input
                    type="text"
                    name="declarant_function"
                    value={formData.declarant_function}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email professionnel *
                </label>
                <input
                  type="email"
                  name="declarant_email"
                  value={formData.declarant_email}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">8. Date de détection *</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de détection du soupçon *
                </label>
                <input
                  type="date"
                  name="suspicion_detection_date"
                  value={formData.suspicion_detection_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Date à laquelle le soupçon a été détecté pour la première fois
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                9. Signature du déclarant *
              </h3>

              {signatureData ? (
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <img
                      src={signatureData}
                      alt="Signature du déclarant"
                      className="max-w-xs h-auto"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignatureCanvas(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Modifier la signature
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-700 mb-4">
                    Vous devez signer cette déclaration avant de l'enregistrer
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSignatureCanvas(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <PenTool className="w-4 h-4" />
                    Signer la déclaration
                  </button>
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
              disabled={loading || !signatureData}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Enregistrement...' : (
                <>
                  <Check className="w-5 h-5" />
                  Créer la déclaration (brouillon)
                </>
              )}
            </button>
          </div>
        </form>

        {showSignatureCanvas && (
          <SignatureCanvas
            onSave={handleSaveSignature}
            onCancel={() => setShowSignatureCanvas(false)}
          />
        )}
      </div>
    </div>
  );
}
