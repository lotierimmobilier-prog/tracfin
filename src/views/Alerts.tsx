import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Alert = Database['public']['Tables']['alerts']['Row'];

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'under_review' | 'closed'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);

  const getSeverityConfig = (severity: string) => {
    const config = {
      low: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertTriangle },
      medium: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
      high: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
      critical: { color: 'bg-red-600 text-white border-red-700', icon: AlertTriangle },
    };
    return config[severity as keyof typeof config] || config.medium;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      open: { label: 'Ouvert', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
      under_review: { label: 'En cours', color: 'bg-orange-100 text-orange-700', icon: Clock },
      closed: { label: 'Clôturé', color: 'bg-slate-100 text-slate-600', icon: XCircle },
      reported: { label: 'Déclaré', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    };
    const statusConfig = config[status as keyof typeof config] || config.open;
    const Icon = statusConfig.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{statusConfig.label}</span>
      </div>
    );
  };

  const getAlertTypeLabel = (type: string) => {
    const labels = {
      suspicious_activity: 'Activité suspecte',
      enhanced_vigilance: 'Vigilance renforcée',
      pep_detected: 'PPE détectée',
      inconsistent_income: 'Revenus incohérents',
      unusual_payment: 'Paiement atypique',
    };
    return labels[type as keyof typeof labels] || type;
  };

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
        <h1 className="text-3xl font-bold text-slate-900">Alertes TRACFIN</h1>
        <p className="text-slate-600 mt-1">Gestion des signalements et activités suspectes</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'open', label: 'Ouvertes' },
          { key: 'under_review', label: 'En cours' },
          { key: 'closed', label: 'Clôturées' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === item.key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900">{alerts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Ouvertes</p>
          <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.status === 'open').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">En cours</p>
          <p className="text-2xl font-bold text-orange-600">{alerts.filter(a => a.status === 'under_review').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Déclarées</p>
          <p className="text-2xl font-bold text-green-600">{alerts.filter(a => a.status === 'reported').length}</p>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune alerte</h3>
          <p className="text-slate-600">
            {filter === 'all' ? 'Aucune alerte enregistrée' : `Aucune alerte ${filter === 'open' ? 'ouverte' : filter === 'under_review' ? 'en cours' : 'clôturée'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const Icon = severityConfig.icon;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 ${severityConfig.color.includes('bg-red-600') ? 'border-red-600' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`${severityConfig.color} rounded-lg p-3 border`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {getAlertTypeLabel(alert.alert_type)}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${severityConfig.color}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-3">{alert.description}</p>
                      <p className="text-sm text-slate-500">
                        Créée le {new Date(alert.created_at).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(alert.created_at).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(alert.status)}
                </div>

                {alert.internal_decision && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-slate-900 mb-1">Décision interne</p>
                    <p className="text-sm text-slate-700">{alert.internal_decision}</p>
                    {alert.decision_date && (
                      <p className="text-xs text-slate-500 mt-2">
                        Décidé le {new Date(alert.decision_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
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
