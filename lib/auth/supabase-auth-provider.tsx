'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  console.log('🔧 AuthProvider initialized with:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
  });

  // Track session changes to detect multiple logins
  const handleSessionChange = (newSession: Session | null, event?: string) => {
    if (!mounted) return; // Prevent hydration issues
    
    if (newSession && session && newSession.user.id !== session.user.id) {
      console.warn('⚠️ SECURITY ALERT: Multiple user sessions detected!');
      console.warn('Previous user:', session.user.email);
      console.warn('New user:', newSession.user.email);
      
      // Force sign out the previous session
      signOut();
      return;
    }
    
    setSession(newSession);
    setUser(newSession?.user ?? null);
    
    if (event) {
      console.log('🔄 Auth state changed:', event, newSession?.user?.email);
    }
    console.log('🔑 Auth token updated:', newSession?.access_token ? 'Present' : 'None');
  };

  useEffect(() => {
    // Set mounted state
    setMounted(true);
    
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          console.log('🔑 Auth token updated: Present');
        } else {
          console.log('🔑 Auth token updated: None');
        }
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        handleSessionChange(session, event);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      setMounted(false);
    };
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Signing out user:', user?.email)
    
    // Clear local state immediately
    setUser(null)
    setSession(null)
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('❌ Error signing out:', error)
    } else {
      console.log('✅ Successfully signed out')
    }
    
    // Force clear any remaining storage (additional cleanup)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('supabase-auth-token')
        localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1] + '-auth-token')
      } catch (e) {
        console.warn('Could not clear storage:', e)
      }
    }
  }

  const value = {
    user,
    session,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    resetPassword,
    signOut,
    loading,
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
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
} 