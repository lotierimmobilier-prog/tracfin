import { useEffect, useState } from 'react';
import { Bell, Flag, CheckCircle, XCircle, AlertTriangle, Eye, User as UserIcon, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type SuspicionReport = Database['public']['Tables']['suspicion_reports']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface ReportWithDetails extends SuspicionReport {
  client?: Client;
  reporter_email?: string;
  reviewer_email?: string;
}

export function Notifications() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    loadReports();
  }, [isAdmin, filter]);

  const loadReports = async () => {
    try {
      let query = supabase
        .from('suspicion_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        if (filter === 'pending') {
          query = query.eq('status', 'pending');
        } else {
          query = query.in('status', ['reviewed', 'escalated', 'dismissed']);
        }
      }

      const { data: reportsData, error: reportsError } = await query;
      if (reportsError) throw reportsError;

      const clientIds = [...new Set(reportsData?.map(r => r.client_id))];
      const userIds = [
        ...new Set([
          ...(reportsData?.map(r => r.reported_by) || []),
          ...(reportsData?.map(r => r.reviewed_by).filter(Boolean) || []),
        ])
      ];

      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientIds);

      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const clientsMap = new Map(clients?.map(c => [c.id, c]));
      const usersMap = new Map(users?.map(u => [u.id, u.email]));

      const enrichedReports = (reportsData || []).map(report => ({
        ...report,
        client: clientsMap.get(report.client_id),
        reporter_email: usersMap.get(report.reported_by),
        reviewer_email: report.reviewed_by ? usersMap.get(report.reviewed_by) : undefined,
      }));

      setReports(enrichedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('suspicion_reports')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          notes: adminNotes || null,
        })
        .eq('id', reportId);

      if (error) throw error;

      alert('Statut mis à jour avec succès');
      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      low: { label: 'Faible', color: 'bg-yellow-100 text-yellow-700' },
      medium: { label: 'Moyen', color: 'bg-orange-100 text-orange-700' },
      high: { label: 'Élevé', color: 'bg-red-100 text-red-700' },
    };
    const severityConfig = config[severity as keyof typeof config] || config.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig.color}`}>
        {severityConfig.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', color: 'bg-blue-100 text-blue-700', icon: Bell },
      reviewed: { label: 'Traité', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      escalated: { label: 'Escaladé', color: 'bg-purple-100 text-purple-700', icon: AlertTriangle },
      dismissed: { label: 'Rejeté', color: 'bg-slate-100 text-slate-700', icon: XCircle },
    };
    const statusConfig = config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Accès refusé</h2>
          <p className="text-slate-600">Seuls les administrateurs peuvent accéder aux notifications.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications et Déclarations</h1>
          <p className="text-slate-600 mt-1">Gérez les déclarations de doute des agents</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="font-semibold">{pendingCount} déclaration{pendingCount > 1 ? 's' : ''} en attente</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('reviewed')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'reviewed'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Traités
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Tous
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Aucune déclaration trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-6 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`${report.client?.client_type === 'legal_entity' ? 'bg-blue-100' : 'bg-slate-100'} rounded-full p-2`}>
                        {report.client?.client_type === 'legal_entity' ? (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {report.client?.client_type === 'legal_entity'
                            ? report.client?.company_name
                            : `${report.client?.first_name} ${report.client?.last_name}`}
                        </h3>
                        <p className="text-sm text-slate-600">
                          Déclaré par {report.reporter_email} le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-700 mb-3 line-clamp-2">{report.reason}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      {getSeverityBadge(report.severity)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(report);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Détails de la déclaration</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Client concerné</h4>
                <p className="text-slate-900">
                  {selectedReport.client?.client_type === 'legal_entity'
                    ? selectedReport.client?.company_name
                    : `${selectedReport.client?.first_name} ${selectedReport.client?.last_name}`}
                </p>
                {selectedReport.client?.email && (
                  <p className="text-sm text-slate-600 mt-1">{selectedReport.client.email}</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Motif de la déclaration</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedReport.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Gravité</h4>
                  {getSeverityBadge(selectedReport.severity)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Statut</h4>
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Déclaré par</h4>
                <p className="text-slate-700">{selectedReport.reporter_email}</p>
                <p className="text-sm text-slate-600">Le {new Date(selectedReport.created_at).toLocaleString('fr-FR')}</p>
              </div>
              {selectedReport.reviewed_at && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Traité par</h4>
                  <p className="text-slate-700">{selectedReport.reviewer_email}</p>
                  <p className="text-sm text-slate-600">Le {new Date(selectedReport.reviewed_at).toLocaleString('fr-FR')}</p>
                </div>
              )}
              {selectedReport.notes && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Notes de l'administrateur</h4>
                  <p className="text-blue-800 whitespace-pre-wrap">{selectedReport.notes}</p>
                </div>
              )}
              {selectedReport.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ajouter des notes (optionnel)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Vos notes concernant cette déclaration..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>
              )}
            </div>
            {selectedReport.status === 'pending' && (
              <div className="flex gap-3 p-6 border-t border-slate-200">
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                >
                  Rejeter
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'reviewed')}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Marquer comme traité
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'escalated')}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Escalader
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
