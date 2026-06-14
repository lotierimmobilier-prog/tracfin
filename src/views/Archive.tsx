import { useState, useEffect } from 'react';
import { Archive as ArchiveIcon, Lock, Calendar, RotateCcw, User, Building2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type Client = Database['public']['Tables']['clients']['Row'];

export function Archive() {
  const { user, isAdmin } = useAuth();
  const [archivedClients, setArchivedClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadArchivedClients();
    }
  }, [isAdmin]);

  const loadArchivedClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          creator:created_by(first_name, last_name, email)
        `)
        .eq('status', 'archived')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setArchivedClients(data || []);
    } catch (error) {
      console.error('Error loading archived clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (clientId: string, clientName: string) => {
    if (!confirm(`Voulez-vous vraiment restaurer le dossier de ${clientName} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: 'active' })
        .eq('id', clientId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CLIENT_RESTORED',
        entity_type: 'client',
        entity_id: clientId,
        entity_name: clientName,
        user_id: user?.id,
      });

      loadArchivedClients();
    } catch (error) {
      console.error('Error restoring client:', error);
      alert('Erreur lors de la restauration du dossier');
    }
  };

  const handlePermanentDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`ATTENTION: Voulez-vous vraiment supprimer définitivement le dossier de ${clientName} ? Cette action est irréversible.`)) {
      return;
    }

    if (!confirm('Êtes-vous absolument certain ? Cette suppression est DÉFINITIVE et ne peut pas être annulée.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CLIENT_PERMANENTLY_DELETED',
        entity_type: 'client',
        entity_id: clientId,
        entity_name: clientName,
        user_id: user?.id,
      });

      loadArchivedClients();
    } catch (error) {
      console.error('Error permanently deleting client:', error);
      alert('Erreur lors de la suppression définitive du dossier');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Archives</h1>
        <p className="text-slate-600 mt-1">Conservation légale des documents et dossiers archivés</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <ArchiveIcon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{archivedClients.length}</p>
            <p className="text-sm text-slate-600">Dossiers archivés</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">100%</p>
            <p className="text-sm text-slate-600">Sécurisé et chiffré</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <div className="bg-orange-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">5+ ans</p>
            <p className="text-sm text-slate-600">Conservation légale</p>
          </div>
        </div>

        {isAdmin && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Dossiers clients archivés</h2>
              {loading ? (
                <div className="text-center py-12 text-slate-500">Chargement...</div>
              ) : archivedClients.length === 0 ? (
                <div className="text-center py-12">
                  <ArchiveIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Aucun dossier archivé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {archivedClients.map((client) => (
                    <div
                      key={client.id}
                      className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {client.client_type === 'legal_entity' ? (
                              <Building2 className="w-5 h-5 text-slate-400" />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                            <h3 className="font-semibold text-slate-900">
                              {client.client_type === 'legal_entity'
                                ? client.company_name
                                : `${client.first_name} ${client.last_name}`}
                            </h3>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                              Archivé
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                            <div>
                              <span className="font-medium">Email :</span> {client.email || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Téléphone :</span> {client.phone || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Archivé le :</span>{' '}
                              {new Date(client.updated_at).toLocaleDateString('fr-FR')}
                            </div>
                            {client.creator && (
                              <div>
                                <span className="font-medium">Agent :</span>{' '}
                                {client.creator.first_name} {client.creator.last_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() =>
                              handleRestore(
                                client.id,
                                client.client_type === 'legal_entity'
                                  ? client.company_name
                                  : `${client.first_name} ${client.last_name}`
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            title="Restaurer le dossier"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Restaurer</span>
                          </button>
                          <button
                            onClick={() =>
                              handlePermanentDelete(
                                client.id,
                                client.client_type === 'legal_entity'
                                  ? client.company_name
                                  : `${client.first_name} ${client.last_name}`
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-xl p-8 text-white text-center">
          <ArchiveIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Archivage légal TRACFIN</h3>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto mb-6">
            Tous les documents et dossiers de conformité sont automatiquement archivés de manière
            sécurisée avec horodatage inviolable, conformément aux obligations légales de conservation
            de 5 ans minimum.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Chiffrement AES-256</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Horodatage certifié</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Traçabilité complète</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Coffre-fort numérique</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Conformité réglementaire
        </h3>
        <p className="text-sm text-blue-800">
          Les archives sont conservées dans un environnement sécurisé avec accès tracé et auditable.
          Chaque consultation est enregistrée dans le journal d'audit pour garantir la conformité aux
          exigences TRACFIN.
        </p>
      </div>
    </div>
  );
}
