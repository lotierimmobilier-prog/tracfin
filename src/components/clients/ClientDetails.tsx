import { X, User, Building2, MapPin, Phone, Mail, AlertCircle, Calendar, FileText, Download, File, PenTool, Edit3, Lock, Unlock, Flag, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SignatureCanvas } from './SignatureCanvas';
import type { Database } from '../../types/database';

type Client = Database['public']['Tables']['clients']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];
type Signature = Database['public']['Tables']['signatures']['Row'];

interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ClientDetails({ client, onClose, onUpdate }: ClientDetailsProps) {
  const { isAdmin, user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [editingSignatureDate, setEditingSignatureDate] = useState(false);
  const [signatureDate, setSignatureDate] = useState('');
  const [signature, setSignature] = useState<Signature | null>(null);
  const [loadingSignature, setLoadingSignature] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [existingReports, setExistingReports] = useState<any[]>([]);

  useEffect(() => {
    loadDocuments();
    loadSignature();
    loadReports();
  }, [client.id]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', client.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadSignature = async () => {
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .eq('entity_type', 'client_kyc')
        .eq('entity_id', client.id)
        .order('signed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSignature(data);
        setSignatureDate(data.signed_at);
      }
    } catch (error) {
      console.error('Error loading signature:', error);
    } finally {
      setLoadingSignature(false);
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('suspicion_reports')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      alert('Veuillez saisir une raison pour la déclaration de doute');
      return;
    }

    try {
      const { error } = await supabase
        .from('suspicion_reports')
        .insert({
          client_id: client.id,
          reported_by: user?.id,
          reason: reportReason,
          severity: reportSeverity,
          status: 'pending',
        });

      if (error) throw error;

      alert('Déclaration de doute envoyée au référent de l\'agence');
      setShowReportModal(false);
      setReportReason('');
      setReportSeverity('medium');
      loadReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Erreur lors de l\'envoi de la déclaration');
    }
  };

  const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      id_card: 'Pièce d\'identité',
      proof_address: 'Justificatif de domicile',
      proof_income: 'Justificatif de revenus',
      company_registration: 'Extrait Kbis',
      contract: 'Contrat',
      other: 'Autre',
    };
    return types[type] || type;
  };

  const isImage = (mimeType: string | null) => {
    return mimeType?.startsWith('image/') || false;
  };

  const handleSaveSignature = async (signatureData: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          signature_data: signatureData,
          signature_date: new Date().toISOString(),
          signature_agent_id: user?.id,
        })
        .eq('id', client.id);

      if (error) throw error;

      setShowSignatureCanvas(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleUpdateSignatureDate = async () => {
    if (!signature || !isAdmin) return;

    try {
      const { error } = await supabase.rpc('admin_update_signature_timestamp', {
        signature_id: signature.id,
        new_timestamp: signatureDate,
      });

      if (error) throw error;

      setEditingSignatureDate(false);
      loadSignature();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating signature date:', error);
      alert('Erreur lors de la modification de la date');
    }
  };

  const handleDeleteSignature = async () => {
    if (!signature || !isAdmin) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler cette signature ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('signatures')
        .delete()
        .eq('id', signature.id);

      if (deleteError) throw deleteError;

      if (signature.signature_url) {
        const filePath = signature.signature_url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('signatures')
            .remove([`client_kyc/${filePath}`]);
        }
      }

      alert('La signature a été annulée avec succès');
      loadSignature();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting signature:', error);
      alert('Erreur lors de l\'annulation de la signature');
    }
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: 'Faible', color: 'bg-green-100 text-green-700' },
      medium: { label: 'Moyen', color: 'bg-orange-100 text-orange-700' },
      high: { label: 'Élevé', color: 'bg-red-100 text-red-700' },
    };
    const riskConfig = config[risk as keyof typeof config] || config.low;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskConfig.color}`}>
        {riskConfig.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`${client.client_type === 'legal_entity' ? 'bg-blue-100' : 'bg-slate-100'} rounded-full p-3`}>
              {client.client_type === 'legal_entity' ? (
                <Building2 className="w-6 h-6 text-blue-600" />
              ) : (
                <User className="w-6 h-6 text-slate-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {client.client_type === 'legal_entity'
                  ? client.company_name
                  : `${client.first_name} ${client.last_name}`}
              </h2>
              <p className="text-slate-600">
                {client.client_type === 'legal_entity' ? 'Personne morale' : 'Personne physique'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Niveau de risque:</span>
              {getRiskBadge(client.risk_level)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Statut:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {client.status === 'active' ? 'Actif' : 'Archivé'}
              </span>
            </div>
          </div>

          {client.is_pep && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Personne Politiquement Exposée (PPE)</h3>
                  {client.pep_details && (
                    <p className="text-sm text-red-700">{client.pep_details}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {client.client_type === 'individual' && (
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Prénom</p>
                  <p className="text-slate-900 font-medium">{client.first_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nom</p>
                  <p className="text-slate-900 font-medium">{client.last_name}</p>
                </div>
                {client.birth_date && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date de naissance</p>
                    <p className="text-slate-900 font-medium">{new Date(client.birth_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {client.nationality && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Nationalité</p>
                    <p className="text-slate-900 font-medium">{client.nationality}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {client.client_type === 'legal_entity' && (
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informations société
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Raison sociale</p>
                  <p className="text-slate-900 font-medium">{client.company_name}</p>
                </div>
                {client.legal_form && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Forme juridique</p>
                    <p className="text-slate-900 font-medium">{client.legal_form}</p>
                  </div>
                )}
                {client.registration_number && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">SIREN</p>
                    <p className="text-slate-900 font-medium">{client.registration_number}</p>
                  </div>
                )}
                {client.registration_country && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pays d'immatriculation</p>
                    <p className="text-slate-900 font-medium">{client.registration_country}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adresse
            </h3>
            <div className="space-y-2">
              {client.address && <p className="text-slate-900">{client.address}</p>}
              <div className="flex gap-4">
                {client.postal_code && <span className="text-slate-900">{client.postal_code}</span>}
                {client.city && <span className="text-slate-900">{client.city}</span>}
              </div>
              {client.country && <p className="text-slate-900">{client.country}</p>}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Contact</h3>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-900">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-900">{client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {client.activity_description && (
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Activité
              </h3>
              <p className="text-slate-900">{client.activity_description}</p>
            </div>
          )}

          {client.notes && (
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Notes internes</h3>
              <p className="text-slate-900 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </h3>
            {loadingDocs ? (
              <p className="text-slate-600">Chargement des documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-slate-600">Aucun document disponible</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start gap-3">
                      {isImage(doc.mime_type) ? (
                        <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-slate-100">
                          <img
                            src={getDocumentUrl(doc.file_path)}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-24 h-24 rounded bg-slate-100 flex items-center justify-center">
                          <File className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate mb-1">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-slate-600 mb-2">
                          {getDocumentTypeLabel(doc.document_type)}
                        </p>
                        <a
                          href={getDocumentUrl(doc.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Download className="w-3 h-3" />
                          Télécharger
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Signature KYC
            </h3>
            {loadingSignature ? (
              <p className="text-slate-600">Chargement de la signature...</p>
            ) : signature ? (
              <div className="space-y-4">
                <div className="border-2 border-slate-200 rounded-lg p-4 bg-white">
                  <img
                    src={signature.signature_data}
                    alt="Signature KYC"
                    className="max-w-xs h-auto mx-auto"
                  />
                </div>
                <div className="space-y-3">
                  {signature.is_locked && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Signature verrouillée</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Date de signature:</span>
                    {editingSignatureDate && isAdmin ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          value={signatureDate ? new Date(signatureDate).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setSignatureDate(new Date(e.target.value).toISOString())}
                          className="px-2 py-1 text-sm border border-slate-300 rounded"
                        />
                        <button
                          onClick={handleUpdateSignatureDate}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => {
                            setEditingSignatureDate(false);
                            setSignatureDate(signature.signed_at);
                          }}
                          className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-slate-900">
                          {new Date(signature.signed_at).toLocaleString('fr-FR', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => setEditingSignatureDate(true)}
                            className="p-1 hover:bg-slate-200 rounded transition"
                            title="Modifier la date (Admin uniquement)"
                          >
                            <Edit3 className="w-3 h-3 text-slate-600" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleDeleteSignature}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    >
                      <Unlock className="w-4 h-4" />
                      Annuler la signature
                    </button>
                  )}
                  {signature.metadata?.signed_by_agent && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Signé par:</span>
                      <span className="text-sm text-slate-900">{signature.metadata.signed_by_agent}</span>
                    </div>
                  )}
                  {signature.ip_address && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Adresse IP:</span>
                      <span className="text-sm text-slate-900 font-mono">{signature.ip_address}</span>
                    </div>
                  )}
                  {signature.locked_at && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Verrouillée le:</span>
                      <span className="text-sm text-slate-900">
                        {new Date(signature.locked_at).toLocaleString('fr-FR', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">Aucune signature KYC enregistrée</p>
                <p className="text-sm text-slate-500 mb-4">
                  Utilisez le bouton "Signer la déclaration" depuis la liste des clients
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informations système
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Date de création</p>
                <p className="text-slate-900">{new Date(client.created_at).toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Dernière modification</p>
                <p className="text-slate-900">{new Date(client.updated_at).toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            <Flag className="w-4 h-4" />
            Déclarer un doute
          </button>
          {existingReports.length > 0 && (
            <button
              onClick={() => {
                const reports = existingReports
                  .map(r => `${new Date(r.created_at).toLocaleDateString('fr-FR')} - ${r.reason} (${r.status})`)
                  .join('\n\n');
                alert(`Déclarations existantes:\n\n${reports}`);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
            >
              <Eye className="w-4 h-4" />
              Voir les déclarations ({existingReports.length})
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            Fermer
          </button>
        </div>

        {showSignatureCanvas && (
          <SignatureCanvas
            onSave={handleSaveSignature}
            onCancel={() => setShowSignatureCanvas(false)}
          />
        )}

        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Déclaration de doute</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client concerné
                  </label>
                  <p className="text-slate-900 font-medium">
                    {client.client_type === 'legal_entity'
                      ? client.company_name
                      : `${client.first_name} ${client.last_name}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Niveau de gravité
                  </label>
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Élevé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Motif de la déclaration *
                  </label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Décrivez les raisons de votre doute concernant ce client..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">Information importante</p>
                      <p>Cette déclaration sera transmise au référent de l'agence qui pourra la consulter et prendre les mesures nécessaires.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-slate-200">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                >
                  Envoyer la déclaration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
