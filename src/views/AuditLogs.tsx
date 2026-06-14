import { useEffect, useState } from 'react';
import { Clock, User, FileText, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
  user_email?: string;
}

export function AuditLogs() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'login' | 'logout'>('all');

  useEffect(() => {
    if (!isAdmin) return;
    loadLogs();
  }, [isAdmin]);

  const loadLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      const userIds = [...new Set(logsData?.map(log => log.user_id).filter(Boolean))];

      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u.email]) || []);

      const enrichedLogs = (logsData || []).map(log => ({
        ...log,
        user_email: log.user_id ? usersMap.get(log.user_id) : 'Système'
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();

    let actionType = 'create';
    if (actionLower.includes('delete') || actionLower.includes('suppression')) {
      actionType = 'delete';
    } else if (actionLower.includes('update') || actionLower.includes('modif')) {
      actionType = 'update';
    } else if (actionLower.includes('login') || actionLower.includes('connexion')) {
      actionType = 'login';
    } else if (actionLower.includes('logout') || actionLower.includes('déconnexion')) {
      actionType = 'logout';
    }

    const config = {
      create: { label: 'Création', color: 'bg-green-100 text-green-700', icon: FileText },
      update: { label: 'Modification', color: 'bg-blue-100 text-blue-700', icon: FileText },
      delete: { label: 'Suppression', color: 'bg-red-100 text-red-700', icon: AlertCircle },
      login: { label: 'Connexion', color: 'bg-emerald-100 text-emerald-700', icon: LogIn },
      logout: { label: 'Déconnexion', color: 'bg-slate-100 text-slate-700', icon: LogOut },
    };
    const actionConfig = config[actionType as keyof typeof config] || config.create;
    const Icon = actionConfig.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${actionConfig.color}`}>
        <Icon className="w-3 h-3" />
        {actionConfig.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const filteredLogs = logs.filter(log => filter === 'all' || log.action === filter);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Accès refusé</h2>
          <p className="text-slate-600">Seuls les administrateurs peuvent accéder aux journaux d'audit.</p>
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
          <h1 className="text-2xl font-bold text-slate-900">Journaux d'Audit</h1>
          <p className="text-slate-600 mt-1">Historique de toutes les actions des utilisateurs</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Toutes ({logs.length})
        </button>
        <button
          onClick={() => setFilter('login')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'login'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Connexions ({logs.filter(l => l.action === 'login').length})
        </button>
        <button
          onClick={() => setFilter('logout')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'logout'
              ? 'bg-slate-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Déconnexions ({logs.filter(l => l.action === 'logout').length})
        </button>
        <button
          onClick={() => setFilter('create')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'create'
              ? 'bg-green-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Créations ({logs.filter(l => l.action === 'create').length})
        </button>
        <button
          onClick={() => setFilter('update')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'update'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Modifications ({logs.filter(l => l.action === 'update').length})
        </button>
        <button
          onClick={() => setFilter('delete')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'delete'
              ? 'bg-red-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Suppressions ({logs.filter(l => l.action === 'delete').length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Entité
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun journal d'audit trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{log.user_email || 'Inconnu'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{log.entity_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">{log.entity_name || 'N/A'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
