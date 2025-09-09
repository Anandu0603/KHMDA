import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAsAdmin: (email: string, password: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔄 Initial session check:', session?.user?.email || 'No user');
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user', 'Session:', session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    console.log('🔍 Checking admin status for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record found

      console.log('📊 Admin query result:', { data, error });

      if (error) {
        console.error('❌ Admin check error:', error);
        setIsAdmin(false);
      } else {
        const adminStatus = !!data;
        console.log('🛡️ Setting admin status:', adminStatus);
        setIsAdmin(adminStatus);
      }
    } catch (err) {
      console.error('❌ Admin check exception:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const signInAsAdmin = async (email: string, password: string) => {
    console.log('🔐 Attempting admin sign in for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📋 Sign in result:', { user: data.user?.email, error: error?.message });

      if (error) {
        return { error: error.message };
      }

      // The auth state change listener will handle the admin check
      return {};
    } catch (err) {
      console.error('❌ Sign in exception:', err);
      return { error: 'Login failed' };
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    signOut,
    signInAsAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
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