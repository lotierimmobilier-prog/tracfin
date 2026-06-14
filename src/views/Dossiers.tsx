import { useEffect, useState } from 'react';
import { FolderCheck, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type ComplianceDossier = Database['public']['Tables']['compliance_dossiers']['Row'];

export function Dossiers() {
  const [dossiers, setDossiers] = useState<ComplianceDossier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDossiers();
  }, []);

  const loadDossiers = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_dossiers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDossiers(data || []);
    } catch (error) {
      console.error('Error loading dossiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
      complete: { label: 'Complet', color: 'bg-green-100 text-green-700' },
      archived: { label: 'Archivé', color: 'bg-blue-100 text-blue-700' },
    };
    const statusConfig = config[status as keyof typeof config] || config.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = {
      standard: { label: 'Standard', color: 'bg-blue-100 text-blue-700' },
      enhanced: { label: 'Renforcé', color: 'bg-orange-100 text-orange-700' },
      suspicious: { label: 'Suspect', color: 'bg-red-100 text-red-700' },
    };
    const typeConfig = config[type as keyof typeof config] || config.standard;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeConfig.color}`}>
        {typeConfig.label}
      </span>
    );
  };

  const ChecklistItem = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-slate-400" />
      )}
      <span className={`text-sm ${checked ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dossiers de conformité</h1>
        <p className="text-slate-600 mt-1">Gestion et suivi des dossiers TRACFIN</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900">{dossiers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Complets</p>
          <p className="text-2xl font-bold text-green-600">
            {dossiers.filter(d => d.status === 'complete').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">En cours</p>
          <p className="text-2xl font-bold text-orange-600">
            {dossiers.filter(d => d.status === 'draft').length}
          </p>
        </div>
      </div>

      {dossiers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FolderCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun dossier</h3>
          <p className="text-slate-600">Les dossiers de conformité s'afficheront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dossiers.map((dossier) => {
            const completionRate =
              [
                dossier.kyc_verified,
                dossier.risk_assessed,
                dossier.documents_complete,
                dossier.beneficial_owners_verified,
              ].filter(Boolean).length / 4;

            return (
              <div key={dossier.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        Dossier {dossier.id.slice(0, 8)}
                      </h3>
                      {getTypeBadge(dossier.dossier_type)}
                      {getStatusBadge(dossier.status)}
                    </div>
                    <p className="text-sm text-slate-500">
                      Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Complété</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round(completionRate * 100)}%
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${completionRate * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ChecklistItem checked={dossier.kyc_verified} label="KYC vérifié" />
                  <ChecklistItem checked={dossier.risk_assessed} label="Risque évalué" />
                  <ChecklistItem checked={dossier.documents_complete} label="Documents complets" />
                  <ChecklistItem
                    checked={dossier.beneficial_owners_verified}
                    label="Bénéficiaires vérifiés"
                  />
                </div>

                {dossier.verification_date && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Vérifié le {new Date(dossier.verification_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}

                {dossier.archived_date && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Archivé le {new Date(dossier.archived_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
