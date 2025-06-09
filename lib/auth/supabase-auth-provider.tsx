'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithGitHub: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug logging
  console.log('🔧 AuthProvider initialized with:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
  });

  useEffect(() => {
    let mounted = true;

    // Get initial session with multiple fallback strategies
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        
        // Strategy 1: Try getSession first
        let { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📋 Initial session result:', { 
          session: session ? 'Found' : 'None', 
          error: error ? error.message : 'None',
          user: session?.user ? { 
            id: session.user.id, 
            email: session.user.email 
          } : 'None'
        });

        // Strategy 2: If no session, try getUser as fallback
        if (!session && !error) {
          console.log('🔄 No session found, trying getUser fallback...');
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (user && !userError) {
            console.log('✅ Found user via getUser fallback:', user.email);
            // Create a minimal session object for consistency
            session = {
              access_token: 'fallback',
              refresh_token: 'fallback',
              expires_in: 3600,
              token_type: 'bearer',
              user
            } as any;
          }
        }

        if (mounted) {
          if (session?.user) {
            console.log('✅ User authenticated:', session.user.email);
            setSession(session);
            setUser(session.user);
          } else {
            console.log('❌ No authenticated user found');
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', { event, user: session?.user?.email || 'None' });
        
        if (mounted) {
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Debug current state
  console.log('🔑 Auth token updated:', user ? user.email : 'None');

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('❌ Sign in error:', error.message);
    } else {
      console.log('✅ Sign in initiated for:', email);
    }
    
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

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 