import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Plus, Building2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type RiskAssessment = Database['public']['Tables']['risk_assessments']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface AssessmentWithClient extends RiskAssessment {
  client?: Client;
}

export function RiskAssessments() {
  const [assessments, setAssessments] = useState<AssessmentWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState({
    income_coherence_score: 0,
    funds_origin_score: 0,
    third_party_score: 0,
    legal_structure_score: 0,
    geographic_risk_score: 0,
    payment_method_score: 0,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assessmentsData, clientsData] = await Promise.all([
        supabase
          .from('risk_assessments')
          .select('*')
          .order('assessed_at', { ascending: false }),
        supabase
          .from('clients')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      ]);

      if (assessmentsData.error) throw assessmentsData.error;
      if (clientsData.error) throw clientsData.error;

      const clientsMap = new Map(clientsData.data?.map(c => [c.id, c]) || []);

      const enrichedAssessments = (assessmentsData.data || []).map(assessment => ({
        ...assessment,
        client: assessment.client_id ? clientsMap.get(assessment.client_id) : undefined
      }));

      setAssessments(enrichedAssessments);
      setClients(clientsData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert('Veuillez sélectionner un client');
      return;
    }

    try {
      const total_score =
        formData.income_coherence_score +
        formData.funds_origin_score +
        formData.third_party_score +
        formData.legal_structure_score +
        formData.geographic_risk_score +
        formData.payment_method_score;

      let risk_level: 'low' | 'medium' | 'high' = 'low';
      if (total_score >= 40) risk_level = 'high';
      else if (total_score >= 20) risk_level = 'medium';

      const { error } = await supabase
        .from('risk_assessments')
        .insert({
          client_id: selectedClientId,
          assessment_type: 'client',
          income_coherence_score: formData.income_coherence_score,
          funds_origin_score: formData.funds_origin_score,
          third_party_score: formData.third_party_score,
          legal_structure_score: formData.legal_structure_score,
          geographic_risk_score: formData.geographic_risk_score,
          payment_method_score: formData.payment_method_score,
          total_score,
          risk_level,
          notes: formData.notes || null,
        });

      if (error) throw error;

      await supabase
        .from('clients')
        .update({ risk_level })
        .eq('id', selectedClientId);

      setShowForm(false);
      setSelectedClientId('');
      setFormData({
        income_coherence_score: 0,
        funds_origin_score: 0,
        third_party_score: 0,
        legal_structure_score: 0,
        geographic_risk_score: 0,
        payment_method_score: 0,
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Erreur lors de la création de l\'évaluation');
    }
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: 'Faible', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      medium: { label: 'Moyen', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
      high: { label: 'Élevé', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    };
    const riskConfig = config[risk as keyof typeof config] || config.low;
    const Icon = riskConfig.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${riskConfig.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{riskConfig.label}</span>
      </div>
    );
  };

  const getClientName = (client?: Client) => {
    if (!client) return 'Client inconnu';
    return client.client_type === 'legal_entity'
      ? client.company_name
      : `${client.first_name} ${client.last_name}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <>
      {showForm && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Nouvelle évaluation de risque</h2>
              <p className="text-slate-600 mt-1">Évaluez le risque d'un client</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {getClientName(client)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cohérence des revenus (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.income_coherence_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, income_coherence_score: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Origine des fonds (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.funds_origin_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, funds_origin_score: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Présence de tiers (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.third_party_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, third_party_score: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Structure juridique (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.legal_structure_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, legal_structure_score: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Risque géographique (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.geographic_risk_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, geographic_risk_score: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Moyen de paiement (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.payment_method_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method_score: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
                >
                  Créer l'évaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Évaluations de risque</h1>
            <p className="text-slate-600 mt-1">Cartographie et scoring automatique des risques</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-5 h-5" />
            Nouvelle évaluation
          </button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 rounded-lg p-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Risque faible</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {assessments.filter(a => a.risk_level === 'low').length}
          </p>
          <p className="text-sm text-slate-600 mt-1">évaluations</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 rounded-lg p-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Risque moyen</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {assessments.filter(a => a.risk_level === 'medium').length}
          </p>
          <p className="text-sm text-slate-600 mt-1">évaluations</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Risque élevé</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {assessments.filter(a => a.risk_level === 'high').length}
          </p>
          <p className="text-sm text-slate-600 mt-1">évaluations</p>
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune évaluation</h3>
          <p className="text-slate-600 mb-6">Commencez par créer votre première évaluation de risque</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-5 h-5" />
            Créer une évaluation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {assessment.client && (
                      <div className="flex items-center gap-2">
                        <div className={`${assessment.client.client_type === 'legal_entity' ? 'bg-blue-100' : 'bg-slate-100'} rounded-full p-1.5`}>
                          {assessment.client.client_type === 'legal_entity' ? (
                            <Building2 className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {getClientName(assessment.client)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {assessment.assessment_type === 'client' ? 'Évaluation client' : 'Évaluation transaction'}
                    </span>
                    {getRiskBadge(assessment.risk_level)}
                  </div>
                  <p className="text-sm text-slate-500">
                    Évalué le {new Date(assessment.assessed_at).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(assessment.assessed_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Score total</p>
                  <p className="text-3xl font-bold text-slate-900">{assessment.total_score}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Cohérence revenus</p>
                  <p className="text-lg font-semibold text-slate-900">{assessment.income_coherence_score}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Origine des fonds</p>
                  <p className="text-lg font-semibold text-slate-900">{assessment.funds_origin_score}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Présence tiers</p>
                  <p className="text-lg font-semibold text-slate-900">{assessment.third_party_score}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Structure juridique</p>
                  <p className="text-lg font-semibold text-slate-900">{assessment.legal_structure_score}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Risque géographique</p>
                  <p className="text-lg font-semibold text-slate-900">{assessment.geographic_risk_score}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Moyen de paiement</p>
                  <p className="text-lg font-semibold text-slate-900">{assessment.payment_method_score}</p>
                </div>
              </div>

              {assessment.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Notes</p>
                  <p className="text-sm text-blue-700">{assessment.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
