import { useState, useEffect } from 'react';
import { Ligature as FileSignature, Plus, Eye, Download, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TracfinDeclarationForm } from '../components/tracfin/TracfinDeclarationForm';
import type { Database } from '../types/database';

type TracfinDeclaration = Database['public']['Tables']['tracfin_declarations']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

export function TracfinDeclarations() {
  const { user, isAdmin } = useAuth();
  const [declarations, setDeclarations] = useState<TracfinDeclaration[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<TracfinDeclaration | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'transmitted'>('all');

  useEffect(() => {
    loadDeclarations();
  }, [filter]);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tracfin_declarations')
        .select(`
          *,
          creator:created_by(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: declarationsData } = await query;

      if (declarationsData && declarationsData.length > 0) {
        const clientIds = [...new Set(declarationsData.map(d => d.client_id))];
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds);

        if (clientsData) {
          const clientsMap: Record<string, Client> = {};
          clientsData.forEach(client => {
            clientsMap[client.id] = client;
          });
          setClients(clientsMap);
        }
      }

      setDeclarations(declarationsData || []);
    } catch (error) {
      console.error('Error loading declarations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700', icon: Clock },
      submitted: { label: 'Soumise', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      transmitted: { label: 'Transmise à TRACFIN', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const handleViewDeclaration = (declaration: TracfinDeclaration) => {
    setSelectedDeclaration(declaration);
  };

  const handleDeleteDeclaration = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette déclaration ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tracfin_declarations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'TRACFIN_DECLARATION_DELETED',
        entity_type: 'tracfin_declaration',
        entity_id: id,
        user_id: user?.id,
      });

      loadDeclarations();
    } catch (error) {
      console.error('Error deleting declaration:', error);
      alert('Erreur lors de la suppression de la déclaration');
    }
  };

  const handleExportPDF = (declaration: TracfinDeclaration) => {
    const client = clients[declaration.client_id];
    const clientName = client?.client_type === 'legal_entity'
      ? client.company_name
      : `${client?.first_name} ${client?.last_name}`;

    const content = `
DÉCLARATION DE SOUPÇON TRACFIN
═══════════════════════════════════════════════════════════════

CONFIDENTIEL - Ne pas divulguer au client concerné

═══════════════════════════════════════════════════════════════

1. INFORMATIONS SUR L'AGENCE DÉCLARANTE

Nom de l'agence : ${declaration.agency_name}
Adresse : ${declaration.agency_address}
SIRET : ${declaration.agency_siret}
Carte professionnelle : ${declaration.agency_professional_card}

Déclarant : ${declaration.declarant_name}
Fonction : ${declaration.declarant_function}
Email : ${declaration.declarant_email}

═══════════════════════════════════════════════════════════════

2. IDENTIFICATION DU CLIENT CONCERNÉ

Client : ${clientName}
Type : ${client?.client_type === 'legal_entity' ? 'Personne morale' : 'Personne physique'}
${client?.client_type === 'individual' ? `Nationalité : ${client.nationality || 'Non précisée'}` : ''}

═══════════════════════════════════════════════════════════════

3. INFORMATIONS SUR L'OPÉRATION

Nature de l'opération : ${declaration.operation_nature}
Montant : ${declaration.operation_amount} €
Date : ${new Date(declaration.operation_date).toLocaleDateString('fr-FR')}
Mode de paiement : ${declaration.payment_method}
${declaration.payment_origin ? `Origine des fonds : ${declaration.payment_origin}` : ''}
${declaration.payment_destination ? `Destination des fonds : ${declaration.payment_destination}` : ''}
${declaration.funds_origin ? `Origine détaillée : ${declaration.funds_origin}` : ''}

${declaration.property_address ? `\nBien immobilier :
Adresse : ${declaration.property_address}
Type : ${declaration.property_type || 'Non précisé'}
${declaration.property_price ? `Prix : ${declaration.property_price} €` : ''}` : ''}

═══════════════════════════════════════════════════════════════

4. MOTIF DU SOUPÇON

${declaration.suspicion_reason}

Faits observés :
${declaration.facts_observed}

Incohérences observées :
${declaration.inconsistencies}

${declaration.unusual_elements ? `Éléments inhabituels :
${declaration.unusual_elements}` : ''}

═══════════════════════════════════════════════════════════════

5. INDICATEURS DE RISQUE

${declaration.refused_documents ? '☑ Refus de fournir les justificatifs' : '☐ Refus de fournir les justificatifs'}
${declaration.large_cash_payment ? '☑ Paiement en espèces important' : '☐ Paiement en espèces important'}
${declaration.income_inconsistency ? '☑ Incohérence revenus / acquisition' : '☐ Incohérence revenus / acquisition'}
${declaration.complex_legal_structure ? '☑ Montage juridique complexe' : '☐ Montage juridique complexe'}
${declaration.unusual_urgency ? '☑ Urgence inhabituelle' : '☐ Urgence inhabituelle'}
${declaration.unknown_third_party ? '☑ Intervention d\'un tiers non identifié' : '☐ Intervention d\'un tiers non identifié'}
${declaration.foreign_account_used ? '☑ Utilisation de comptes étrangers' : '☐ Utilisation de comptes étrangers'}

═══════════════════════════════════════════════════════════════

6. INFORMATIONS SUR LA DÉCLARATION

Date de détection du soupçon : ${new Date(declaration.suspicion_detection_date).toLocaleDateString('fr-FR')}
Date de création de la déclaration : ${new Date(declaration.created_at).toLocaleDateString('fr-FR')}
Statut : ${declaration.status}
${declaration.transmission_date ? `Date de transmission : ${new Date(declaration.transmission_date).toLocaleDateString('fr-FR')}` : ''}

Signature du déclarant : ${declaration.declarant_signature_data ? 'Signée le ' + new Date(declaration.declarant_signature_date!).toLocaleDateString('fr-FR') : 'Non signée'}

═══════════════════════════════════════════════════════════════

Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}

RAPPEL : Cette déclaration est strictement confidentielle.
Ne jamais informer le client de son existence.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Declaration_TRACFIN_${declaration.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <FileSignature className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                Déclarations TRACFIN
              </h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">Gestion des déclarations de soupçon</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouvelle déclaration</span>
              <span className="sm:hidden">Nouvelle</span>
            </button>
          </div>

          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Confidentialité absolue obligatoire</h3>
                <p className="text-sm text-red-800">
                  Toute déclaration TRACFIN doit rester strictement confidentielle. Il est formellement interdit
                  d'informer le client concerné de l'existence d'une déclaration sous peine de sanctions pénales.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
                filter === 'draft'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Brouillons
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
                filter === 'submitted'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Soumises
            </button>
            <button
              onClick={() => setFilter('transmitted')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
                filter === 'transmitted'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Transmises
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Chargement...</div>
          ) : declarations.length === 0 ? (
            <div className="text-center py-12">
              <FileSignature className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucune déclaration trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {declarations.map((declaration) => {
                const client = clients[declaration.client_id];
                const clientName = client?.client_type === 'legal_entity'
                  ? client.company_name
                  : `${client?.first_name} ${client?.last_name}`;

                return (
                  <div
                    key={declaration.id}
                    className="border border-slate-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition"
                  >
                    {declaration.status === 'draft' && (
                      <div className="mb-3 bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-amber-800">
                          Cette déclaration est en brouillon. Veuillez la compléter pour la finaliser.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                            {clientName || 'Client inconnu'}
                          </h3>
                          {getStatusBadge(declaration.status)}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Nature :</span> {declaration.operation_nature}
                          </div>
                          <div>
                            <span className="font-medium">Montant :</span> {declaration.operation_amount.toLocaleString('fr-FR')} €
                          </div>
                          <div>
                            <span className="font-medium">Date opération :</span>{' '}
                            {new Date(declaration.operation_date).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Créée le :</span>{' '}
                            {new Date(declaration.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          {(declaration as any).creator && (
                            <div className="col-span-1 sm:col-span-2">
                              <span className="font-medium">Agent :</span> {(declaration as any).creator.first_name} {(declaration as any).creator.last_name}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-xs sm:text-sm">
                          <span className="font-medium text-slate-700">Motif :</span>
                          <p className="text-slate-600 mt-1 line-clamp-2">{declaration.suspicion_reason}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto sm:ml-4">
                        <button
                          onClick={() => handleViewDeclaration(declaration)}
                          className="flex-1 sm:flex-none p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(declaration)}
                          className="flex-1 sm:flex-none p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Exporter"
                        >
                          <Download className="w-5 h-5 mx-auto" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteDeclaration(declaration.id)}
                            className="flex-1 sm:flex-none p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <TracfinDeclarationForm
          onClose={() => setShowForm(false)}
          onSuccess={loadDeclarations}
        />
      )}

      {selectedDeclaration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Détails de la déclaration</h2>
                <button
                  onClick={() => setSelectedDeclaration(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <FileSignature className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">Document confidentiel - Ne pas divulguer</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Client concerné</h3>
                <p className="text-slate-700">
                  {clients[selectedDeclaration.client_id]?.client_type === 'legal_entity'
                    ? clients[selectedDeclaration.client_id]?.company_name
                    : `${clients[selectedDeclaration.client_id]?.first_name} ${clients[selectedDeclaration.client_id]?.last_name}`}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Opération</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nature :</span> {selectedDeclaration.operation_nature}
                  </div>
                  <div>
                    <span className="font-medium">Montant :</span> {selectedDeclaration.operation_amount.toLocaleString('fr-FR')} €
                  </div>
                  <div>
                    <span className="font-medium">Date :</span>{' '}
                    {new Date(selectedDeclaration.operation_date).toLocaleDateString('fr-FR')}
                  </div>
                  <div>
                    <span className="font-medium">Mode de paiement :</span> {selectedDeclaration.payment_method}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Motif du soupçon</h3>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                  {selectedDeclaration.suspicion_reason}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Faits observés</h3>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                  {selectedDeclaration.facts_observed}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Incohérences</h3>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                  {selectedDeclaration.inconsistencies}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Déclarant</h3>
                <div className="text-sm text-slate-700">
                  <p>{selectedDeclaration.declarant_name} - {selectedDeclaration.declarant_function}</p>
                  <p>{selectedDeclaration.declarant_email}</p>
                </div>
              </div>

              {selectedDeclaration.declarant_signature_data && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Signature</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 inline-block">
                    <img
                      src={selectedDeclaration.declarant_signature_data}
                      alt="Signature"
                      className="max-w-xs h-auto"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Signé le {new Date(selectedDeclaration.declarant_signature_date!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
