import { useEffect, useState } from 'react';
import { Settings, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PagePermission {
  id: string;
  role: string;
  page_slug: string;
  can_access: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  clients: 'Clients (KYC)',
  transactions: 'Transactions',
  'risk-assessments': 'Évaluations risque',
  alerts: 'Alertes TRACFIN',
  dossiers: 'Dossiers conformité',
  archive: 'Archives',
  users: 'Utilisateurs',
  guide: 'Guide TRACFIN',
};

const ROLE_LABELS: Record<string, string> = {
  agent: 'Agent Commercial',
  compliance_officer: 'Responsable Conformité',
  admin: 'Administrateur',
};

export function Permissions() {
  const { isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadPermissions();
    }
  }, [isAdmin]);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('page_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('page_slug', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setError('Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (permissionId: string, currentAccess: boolean) => {
    try {
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('page_permissions')
        .update({ can_access: !currentAccess })
        .eq('id', permissionId);

      if (error) throw error;

      setSuccess('Permission mise à jour avec succès');
      loadPermissions();
    } catch (error: any) {
      console.error('Error updating permission:', error);
      setError(error.message || 'Erreur lors de la mise à jour de la permission');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès refusé</h2>
          <p className="text-slate-600">Vous devez être administrateur pour accéder à cette page.</p>
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

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.role]) {
      acc[perm.role] = [];
    }
    acc[perm.role].push(perm);
    return acc;
  }, {} as Record<string, PagePermission[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des permissions</h1>
          <p className="text-slate-600 mt-1">Configurer l'accès aux pages par rôle</p>
        </div>
        <Settings className="w-8 h-8 text-slate-400" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([role, perms]) => (
          <div key={role} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{ROLE_LABELS[role] || role}</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perms.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {PAGE_LABELS[perm.page_slug] || perm.page_slug}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{perm.page_slug}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePermission(perm.id, perm.can_access)}
                      disabled={role === 'admin'}
                      className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        perm.can_access ? 'bg-green-600' : 'bg-slate-300'
                      } ${role === 'admin' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          perm.can_access ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
              {role === 'admin' && (
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Les administrateurs ont toujours accès à toutes les pages
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
