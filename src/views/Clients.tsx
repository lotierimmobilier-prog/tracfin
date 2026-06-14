import { useEffect, useState } from 'react';
import { Plus, Search, AlertCircle, Building2, User as UserIcon, Upload, Clock, ArrowDownUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { MultiStepClientForm } from '../components/clients/MultiStepClientForm';
import { ClientDetails } from '../components/clients/ClientDetails';
import { ClientActions } from '../components/clients/ClientActions';
import { SignatureModal } from '../components/clients/SignatureModal';
import { ClientImportModal } from '../components/clients/ClientImportModal';
import { ExportImportModal } from '../components/clients/ExportImportModal';

type Client = Database['public']['Tables']['clients']['Row'];

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null);
  const [clientToSign, setClientToSign] = useState<Client | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          creator:created_by(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      const { data: signaturesData, error: signaturesError } = await supabase
        .from('signatures')
        .select('entity_id, is_locked')
        .eq('entity_type', 'client_kyc');

      if (signaturesError) throw signaturesError;

      const signaturesMap = new Map(
        signaturesData?.map(sig => [sig.entity_id, sig.is_locked]) || []
      );

      const enrichedClients = (clientsData || []).map(client => ({
        ...client,
        is_signed: signaturesMap.has(client.id) && signaturesMap.get(client.id)
      }));

      setClients(enrichedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      client.company_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('view');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('edit');
  };

  const handleSignClient = (client: Client) => {
    const isSigned = (client as any).is_signed;

    if (isSigned) {
      setSelectedClient(client);
      setViewMode('view');
    } else {
      setClientToSign(client);
    }
  };

  const handleSignatureSuccess = async () => {
    await loadClients();

    if (clientToSign) {
      setSelectedClient(clientToSign);
      setViewMode('view');
      setClientToSign(null);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    const clientName = client.client_type === 'legal_entity'
      ? client.company_name
      : `${client.first_name} ${client.last_name}`;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client "${clientName}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      alert('Client supprimé avec succès');
      await loadClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      alert(`Erreur lors de la suppression du client:\n\n${errorMessage}`);
    }
  };

  const closeModals = () => {
    setSelectedClient(null);
    setViewMode(null);
    setShowForm(false);
    setClientToSign(null);
    setShowImport(false);
    setShowExportImport(false);
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: 'Faible', color: 'bg-green-100 text-green-700' },
      medium: { label: 'Moyen', color: 'bg-orange-100 text-orange-700' },
      high: { label: 'Élevé', color: 'bg-red-100 text-red-700' },
    };
    const riskConfig = config[risk as keyof typeof config] || config.low;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskConfig.color}`}>
        {riskConfig.label}
      </span>
    );
  };

  const getDoubtBadge = (doubt: string) => {
    const config = {
      none: { label: 'Aucun doute', color: 'bg-green-600', textColor: 'text-green-900', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
      low: { label: 'Doute faible', color: 'bg-lime-600', textColor: 'text-lime-900', bgColor: 'bg-lime-50', borderColor: 'border-lime-200' },
      medium: { label: 'Doute moyen', color: 'bg-orange-600', textColor: 'text-orange-900', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
      high: { label: 'Doute élevé', color: 'bg-red-600', textColor: 'text-red-900', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    };
    const doubtConfig = config[doubt as keyof typeof config] || config.none;
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${doubtConfig.bgColor} ${doubtConfig.borderColor}`}>
        <div className={`w-3 h-3 rounded-full ${doubtConfig.color}`}></div>
        <span className={`text-xs font-medium ${doubtConfig.textColor}`}>
          {doubtConfig.label}
        </span>
      </div>
    );
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
      {showExportImport && (
        <ExportImportModal
          onClose={closeModals}
          onImportSuccess={() => { closeModals(); loadClients(); }}
        />
      )}

      {showImport && (
        <ClientImportModal
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            loadClients();
          }}
        />
      )}

      {clientToSign && (
        <SignatureModal
          clientName={
            clientToSign.client_type === 'legal_entity'
              ? clientToSign.company_name || ''
              : `${clientToSign.first_name} ${clientToSign.last_name}`
          }
          clientId={clientToSign.id}
          onClose={() => setClientToSign(null)}
          onSuccess={handleSignatureSuccess}
        />
      )}

      {showForm && !selectedClient && (
        <MultiStepClientForm
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            loadClients();
          }}
        />
      )}

      {selectedClient && viewMode === 'view' && (
        <ClientDetails
          client={selectedClient}
          onClose={closeModals}
          onUpdate={loadClients}
        />
      )}

      {selectedClient && viewMode === 'edit' && (
        <MultiStepClientForm
          client={selectedClient}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            loadClients();
          }}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients (KYC)</h1>
          <p className="text-slate-600 mt-1">Gestion des fiches clients et vérifications d'identité</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportImport(true)}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition border border-slate-300"
          >
            <ArrowDownUp className="w-5 h-5" />
            Export / Import
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition border border-slate-300"
          >
            <Upload className="w-5 h-5" />
            Importer
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-5 h-5" />
            Nouveau client
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un client par nom, prénom, société ou email..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <UserIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun client trouvé</h3>
          <p className="text-slate-600 mb-6">
            {searchTerm ? 'Aucun client ne correspond à votre recherche' : 'Commencez par créer votre premier client'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              <Plus className="w-5 h-5" />
              Créer un client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${client.client_type === 'legal_entity' ? 'bg-blue-100' : 'bg-slate-100'} rounded-full p-2`}>
                    {client.client_type === 'legal_entity' ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {client.client_type === 'legal_entity'
                        ? client.company_name
                        : `${client.first_name} ${client.last_name}`}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {client.client_type === 'legal_entity' ? 'Personne morale' : 'Personne physique'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(client as any).is_draft && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-full">
                      <Clock className="w-3 h-3" />
                      En cours...
                    </span>
                  )}
                  {getRiskBadge(client.risk_level)}
                  <ClientActions
                    client={client}
                    onView={() => handleViewClient(client)}
                    onEdit={() => handleEditClient(client)}
                    onSign={() => handleSignClient(client)}
                    onDelete={() => handleDeleteClient(client)}
                    isSigned={(client as any).is_signed}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {client.email && (
                  <p className="text-slate-600">
                    <span className="font-medium">Email:</span> {client.email}
                  </p>
                )}
                {client.phone && (
                  <p className="text-slate-600">
                    <span className="font-medium">Téléphone:</span> {client.phone}
                  </p>
                )}
                {client.city && (
                  <p className="text-slate-600">
                    <span className="font-medium">Ville:</span> {client.city}
                  </p>
                )}
              </div>

              {client.doubt_level && (
                <div className="mt-4">
                  {getDoubtBadge(client.doubt_level)}
                </div>
              )}

              {client.is_pep && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700">Personne Politiquement Exposée (PPE)</span>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                <div className="flex items-center justify-between mb-1">
                  <span>Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
                  <span className={`px-2 py-1 rounded ${client.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {client.status === 'active' ? 'Actif' : 'Archivé'}
                  </span>
                </div>
                {(client as any).creator && (
                  <div className="text-slate-500">
                    <span className="font-medium">Agent :</span> {(client as any).creator.first_name} {(client as any).creator.last_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
