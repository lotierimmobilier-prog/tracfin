import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/audit';
import type { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAgent: boolean;
  isComplianceOfficer: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  exitImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const impersonationTargetId = localStorage.getItem('impersonation_target_id');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (impersonationTargetId) {
        loadProfile(impersonationTargetId);
      } else if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const impersonationTargetId = localStorage.getItem('impersonation_target_id');

        setUser(session?.user ?? null);
        if (impersonationTargetId) {
          await loadProfile(impersonationTargetId);
        } else if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('🔍 Loading profile for user ID:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('📊 Profile query result:', { data, error });

      if (error) {
        console.error('❌ Error in profile query:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Profile loaded successfully:', data.email, data.role);
      } else {
        console.warn('⚠️ No profile data found for user:', userId);
      }

      setProfile(data);
    } catch (error) {
      console.error('💥 Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Log successful login
    if (data.user) {
      await logAuditEvent(
        'login',
        'auth',
        data.user.id,
        null,
        { email, timestamp: new Date().toISOString() }
      );
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'agent',
        });

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    // Log logout before signing out
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await logAuditEvent(
        'logout',
        'auth',
        user.id,
        null,
        { timestamp: new Date().toISOString() }
      );
    }

    localStorage.removeItem('impersonation_admin_id');
    localStorage.removeItem('impersonation_target_id');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const exitImpersonation = () => {
    localStorage.removeItem('impersonation_admin_id');
    localStorage.removeItem('impersonation_target_id');
    window.location.reload();
  };

  const isImpersonating = !!localStorage.getItem('impersonation_target_id');
  const isAgent = profile?.role === 'agent';
  const isComplianceOfficer = profile?.role === 'compliance_officer';
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isAgent,
        isComplianceOfficer,
        isAdmin,
        isImpersonating,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
