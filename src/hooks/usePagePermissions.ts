import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PagePermission {
  page_slug: string;
  can_access: boolean;
}

export function usePagePermissions() {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 usePagePermissions - profile:', profile);

    if (!profile?.role) {
      console.log('⚠️ No profile role found, setting loading to false');
      setLoading(false);
      return;
    }

    console.log('✅ Profile role found:', profile.role);
    loadPermissions();
  }, [profile?.role]);

  const loadPermissions = async () => {
    if (!profile?.role) return;

    try {
      console.log('📥 Loading permissions for role:', profile.role);

      const { data, error } = await supabase
        .from('page_permissions')
        .select('page_slug, can_access')
        .eq('role', profile.role);

      if (error) throw error;

      console.log('📊 Permissions data:', data);

      const permMap = new Map<string, boolean>();
      data?.forEach((perm: PagePermission) => {
        permMap.set(perm.page_slug, perm.can_access);
      });

      console.log('✅ Permissions map:', Array.from(permMap.entries()));
      setPermissions(permMap);
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAccessPage = (pageSlug: string): boolean => {
    // Les admins ont accès à toutes les pages
    if (profile?.role === 'admin') return true;

    // Pour les autres rôles, vérifier les permissions dans la table
    return permissions.get(pageSlug) ?? false;
  };

  return {
    canAccessPage,
    loading,
    permissions,
  };
}
