import { useState, useEffect } from 'react';
import { X, Building, MapPin, Euro, Calendar, Users, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { sendRiskAlertNotification } from '../../lib/riskNotificationService';
import { RiskQuestionnaire, RISK_QUESTIONS } from './RiskQuestionnaire';
import type { Database } from '../../types/database';

type Client = Database['public']['Tables']['clients']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

interface TransactionFormProps {
  transaction?: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionForm({ transaction, onClose, onSuccess }: TransactionFormProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRiskHelp, setShowRiskHelp] = useState(false);
  const [riskAnswers, setRiskAnswers] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    client_id: transaction?.client_id || '',
    transaction_type: (transaction?.transaction_type || 'sale') as const,
    property_address: transaction?.property_address || '',
    property_city: transaction?.property_city || '',
    property_postal_code: transaction?.property_postal_code || '',
    transaction_amount: transaction?.transaction_amount?.toString() || '',
    payment_origin: transaction?.payment_origin || '',
    has_third_party: transaction?.has_third_party || false,
    third_party_details: transaction?.third_party_details || '',
    transaction_date: transaction?.transaction_date || '',
    risk_level: (transaction?.risk_level || 'low') as 'low' | 'medium' | 'high',
    risk_justification: transaction?.risk_justification || '',
  });

  useEffect(() => {
    loadClients();
    if (transaction) {
      loadRiskAnswers();
    } else {
      const initialAnswers: Record<string, boolean> = {};
      RISK_QUESTIONS.forEach(q => {
        initialAnswers[q.code] = false;
      });
      setRiskAnswers(initialAnswers);
    }
  }, [transaction]);

  const loadRiskAnswers = async () => {
    if (!transaction) return;

    try {
      const { data, error } = await supabase
        .from('transaction_risk_answers')
        .select('question_code, answer')
        .eq('transaction_id', transaction.id);

      if (error) throw error;

      const answersMap: Record<string, boolean> = {};
      RISK_QUESTIONS.forEach(q => {
        answersMap[q.code] = false;
      });

      if (data) {
        data.forEach(answer => {
          answersMap[answer.question_code] = answer.answer;
        });
      }

      setRiskAnswers(answersMap);
    } catch (error) {
      console.error('Error loading risk answers:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company_name, client_type')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.client_id) {
        setError('Veuillez sélectionner un client');
        return;
      }

      if (!formData.property_address) {
        setError('L\'adresse du bien est obligatoire');
        return;
      }

      if (!formData.transaction_amount || parseFloat(formData.transaction_amount) <= 0) {
        setError('Le montant doit être supérieur à 0');
        return;
      }

      const riskScore = Object.values(riskAnswers).filter(Boolean).length;
      const shouldSendAlert = riskScore >= 3 && (!transaction || !transaction.auto_alert_sent);

      const transactionData = {
        client_id: formData.client_id,
        transaction_type: formData.transaction_type,
        property_address: formData.property_address,
        property_city: formData.property_city || null,
        property_postal_code: formData.property_postal_code || null,
        transaction_amount: parseFloat(formData.transaction_amount),
        payment_origin: formData.payment_origin || null,
        has_third_party: formData.has_third_party,
        third_party_details: formData.third_party_details || null,
        transaction_date: formData.transaction_date || null,
        risk_level: formData.risk_level,
        risk_justification: formData.risk_justification || null,
        risk_score: riskScore,
        auto_alert_sent: shouldSendAlert ? true : (transaction?.auto_alert_sent || false),
      };

      let transactionId: string;

      if (transaction) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);

        if (updateError) throw updateError;
        transactionId = transaction.id;

        await supabase
          .from('transaction_risk_answers')
          .delete()
          .eq('transaction_id', transaction.id);
      } else {
        const { data: newTransaction, error: insertError } = await supabase
          .from('transactions')
          .insert({
            ...transactionData,
            created_by: user?.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        transactionId = newTransaction.id;
      }

      const riskAnswersToInsert = Object.entries(riskAnswers).map(([questionCode, answer]) => ({
        transaction_id: transactionId,
        question_code: questionCode,
        answer: answer
      }));

      const { error: answersError } = await supabase
        .from('transaction_risk_answers')
        .insert(riskAnswersToInsert);

      if (answersError) throw answersError;

      if (shouldSendAlert && user?.id) {
        try {
          await sendRiskAlertNotification(transactionId, riskScore, user.id);
        } catch (notifError) {
          console.error('Error sending risk alert notification:', notifError);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const getClientDisplayName = (client: Client) => {
    if (client.client_type === 'legal_entity' && client.company_name) {
      return client.company_name;
    }
    return `${client.first_name} ${client.last_name}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {transaction ? 'Modifier la transaction' : 'Nouvelle transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Client *
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {getClientDisplayName(client)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type de transaction *
            </label>
            <select
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="sale">Vente</option>
              <option value="purchase">Achat</option>
              <option value="rental">Location</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse du bien *
            </label>
            <input
              type="text"
              name="property_address"
              value={formData.property_address}
              onChange={handleChange}
              required
              placeholder="123 rue de la République"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Ville
              </label>
              <input
                type="text"
                name="property_city"
                value={formData.property_city}
                onChange={handleChange}
                placeholder="Paris"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Code postal
              </label>
              <input
                type="text"
                name="property_postal_code"
                value={formData.property_postal_code}
                onChange={handleChange}
                placeholder="75001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Montant de la transaction *
            </label>
            <input
              type="number"
              name="transaction_amount"
              value={formData.transaction_amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="250000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date signature de mandat
            </label>
            <input
              type="date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Origine des fonds
            </label>
            <input
              type="text"
              name="payment_origin"
              value={formData.payment_origin}
              onChange={handleChange}
              placeholder="Épargne personnelle, prêt bancaire..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="has_third_party"
                checked={formData.has_third_party}
                onChange={handleChange}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">
                Intervention d'un tiers
              </span>
            </label>
          </div>

          {formData.has_third_party && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Détails sur le tiers
              </label>
              <textarea
                name="third_party_details"
                value={formData.third_party_details}
                onChange={handleChange}
                rows={3}
                placeholder="Nom, lien avec le client, raison de l'intervention..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          )}

          <div className="border-t pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Classification du risque LCB-FT
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Conformément aux articles L561-4-1 et suivants du Code monétaire et financier
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Niveau de risque TRACFIN *
                </label>
                <button
                  type="button"
                  onClick={() => setShowRiskHelp(!showRiskHelp)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  {showRiskHelp ? 'Masquer l\'aide' : 'Voir les critères'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.risk_level === 'low'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    name="risk_level"
                    value="low"
                    checked={formData.risk_level === 'low'}
                    onChange={handleChange}
                    className="mt-1 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-slate-900">Risque faible</div>
                    <div className="text-sm text-slate-600">
                      Logement résidence principale, financement bancaire classique, montant modéré
                    </div>
                  </div>
                </label>

                <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.risk_level === 'medium'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-orange-300'
                }`}>
                  <input
                    type="radio"
                    name="risk_level"
                    value="medium"
                    checked={formData.risk_level === 'medium'}
                    onChange={handleChange}
                    className="mt-1 text-orange-600 focus:ring-orange-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-slate-900">Risque moyen</div>
                    <div className="text-sm text-slate-600">
                      Immeuble de rapport, local commercial, acquisition via SCI, absence de financement bancaire
                    </div>
                  </div>
                </label>

                <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.risk_level === 'high'
                    ? 'border-red-500 bg-red-50'
                    : 'border-slate-200 hover:border-red-300'
                }`}>
                  <input
                    type="radio"
                    name="risk_level"
                    value="high"
                    checked={formData.risk_level === 'high'}
                    onChange={handleChange}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-slate-900">Risque élevé</div>
                    <div className="text-sm text-slate-600">
                      Bien de luxe, achat/revente rapide, fonds propres importants, société étrangère, client non-résident
                    </div>
                  </div>
                </label>
              </div>

              {showRiskHelp && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
                  <h4 className="font-semibold text-slate-900 mb-3">Critères détaillés de classification</h4>

                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-green-700 mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Risque faible
                      </div>
                      <ul className="ml-4 space-y-1 text-slate-600">
                        <li>• Logements destinés à l'habitation principale</li>
                        <li>• Ventes avec financement bancaire classique</li>
                        <li>• Transactions portant sur des montants modestes</li>
                      </ul>
                    </div>

                    <div>
                      <div className="font-medium text-orange-700 mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Risque moyen
                      </div>
                      <ul className="ml-4 space-y-1 text-slate-600">
                        <li>• Immeubles de rapport</li>
                        <li>• Locaux commerciaux</li>
                        <li>• Biens détenus par SCI</li>
                        <li>• Ventes réalisées sans financement bancaire</li>
                      </ul>
                    </div>

                    <div>
                      <div className="font-medium text-red-700 mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Risque élevé
                      </div>
                      <ul className="ml-4 space-y-1 text-slate-600">
                        <li>• Biens de luxe ou de forte valeur</li>
                        <li>• Opérations rapides achat/revente</li>
                        <li>• Paiement partiel avec fonds propres importants</li>
                        <li>• Acquisition par société étrangère</li>
                        <li>• Clients non résidents</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Justification du niveau de risque (optionnel)
              </label>
              <textarea
                name="risk_justification"
                value={formData.risk_justification}
                onChange={handleChange}
                rows={3}
                placeholder="Documentez les éléments ayant conduit à cette classification du risque..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Cette justification sera conservée dans le dossier de conformité TRACFIN
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Questionnaire d'évaluation approfondie du risque
            </h3>
            <RiskQuestionnaire
              answers={riskAnswers}
              onChange={setRiskAnswers}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading
                ? (transaction ? 'Modification...' : 'Création...')
                : (transaction ? 'Modifier' : 'Créer la transaction')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
