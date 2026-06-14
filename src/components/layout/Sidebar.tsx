import { Shield, Users, FileText, AlertTriangle, BarChart3, FolderCheck, Archive, BookOpen, UserCog, Settings, Trash2, PenTool, Clock, FileBarChart, Bell, GraduationCap, Ligature as FileSignature } from 'lucide-react';
import { useLocation } from '../navigation/Router';
import { useAuth } from '../../contexts/AuthContext';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { useState } from 'react';

export function Sidebar() {
  const { currentView, setView } = useLocation();
  const { isAdmin, profile } = useAuth();
  const { canAccessPage, loading } = usePagePermissions();
  const [isClearing, setIsClearing] = useState(false);

  console.log('🎨 Sidebar render - profile:', profile, 'loading:', loading);

  const handleClearCache = async () => {
    if (!confirm('Voulez-vous vraiment vider le cache ? Cette action rechargera la page.')) {
      return;
    }

    setIsClearing(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      setIsClearing(false);
      alert('Erreur lors du vidage du cache');
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Tableau de bord' },
    { id: 'tutorial', icon: GraduationCap, label: 'Tutoriel complet' },
    { id: 'guide', icon: BookOpen, label: 'Guide TRACFIN' },
    { id: 'clients', icon: Users, label: 'Clients (KYC)' },
    { id: 'transactions', icon: FileText, label: 'Transactions' },
    { id: 'risk-assessments', icon: Shield, label: 'Évaluations risque' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alertes TRACFIN' },
    { id: 'tracfin-declarations', icon: FileSignature, label: 'Déclarations TRACFIN' },
    { id: 'dossiers', icon: FolderCheck, label: 'Dossiers conformité' },
    { id: 'archive', icon: Archive, label: 'Archives' },
  ];

  const adminItems = [
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'reports', icon: FileBarChart, label: 'Rapports Clients' },
    { id: 'users', icon: UserCog, label: 'Utilisateurs' },
    { id: 'permissions', icon: Settings, label: 'Permissions' },
    { id: 'audit-logs', icon: Clock, label: 'Journaux d\'Audit' },
    { id: 'signature-demo', icon: PenTool, label: 'Signature (Démo)' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-lg">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col items-center">
          <img
            src="/Logo-lotier.png"
            alt="Lotier"
            className="h-16 w-auto mb-3"
          />
          <h1 className="font-bold text-lg text-slate-900">TRACFIN Manager</h1>
          <p className="text-xs text-slate-500 mt-1">by Lotier</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Chargement des permissions...
          </div>
        ) : (
          menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const hasAccess = canAccessPage(item.id);

            console.log(`🔍 Menu item ${item.id}: hasAccess=${hasAccess}`);

            if (!hasAccess) return null;

            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })
        )}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <div className="h-px bg-slate-200"></div>
              <p className="text-xs text-slate-500 font-semibold mt-3 px-4 uppercase tracking-wide">Administration</p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          title="Vider le cache et recharger"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isClearing ? 'Vidage...' : 'Vider le cache'}</span>
        </button>
        <div className="text-xs text-slate-500 text-center bg-slate-50 rounded-lg py-2">
          <p>Conforme aux</p>
          <p className="font-semibold text-slate-700">obligations TRACFIN</p>
        </div>
      </div>
    </aside>
  );
}
