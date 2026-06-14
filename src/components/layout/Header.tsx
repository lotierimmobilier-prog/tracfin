import { Shield, LogOut, User, UserX, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  onNavigate?: (view: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const { user, profile, signOut, isImpersonating, exitImpersonation, isAdmin } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  // Debug: afficher le profil dans la console
  console.log('Header - user:', user?.id, 'profile:', profile);

  useEffect(() => {
    if (!isAdmin) return;

    const loadPendingReports = async () => {
      try {
        const { count, error } = await supabase
          .from('suspicion_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (error) throw error;
        setPendingReportsCount(count || 0);
      } catch (error) {
        console.error('Error loading pending reports:', error);
      }
    };

    loadPendingReports();

    const subscription = supabase
      .channel('suspicion_reports_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'suspicion_reports',
      }, () => {
        loadPendingReports();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isAdmin]);

  const handleLogout = async () => {
    if (!confirm('Voulez-vous vraiment vous déconnecter et vider le cache ?')) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await signOut();
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-slate-900" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">TRACFIN Manager</h1>
            <p className="text-xs text-slate-500">by Lotier</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && pendingReportsCount > 0 && (
            <button
              onClick={() => onNavigate?.('notifications')}
              className="relative flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition"
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">{pendingReportsCount}</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          )}
          {isImpersonating && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg">
              <UserX className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-medium text-amber-700">Mode impersonation</span>
              <button
                onClick={exitImpersonation}
                className="ml-2 px-2 py-1 text-xs font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-200 rounded transition"
              >
                Quitter
              </button>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {profile?.full_name || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {profile?.email || user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('profile')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Mon profil"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                title="Vider le cache et se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
