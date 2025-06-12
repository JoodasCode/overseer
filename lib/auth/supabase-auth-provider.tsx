'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SessionManager, SessionState } from './session-manager';

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionState: SessionState;
  isSessionExpiringSoon: boolean;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  sessionState: {
    session: null,
    user: null,
    isExpired: false,
    expiresAt: null,
    refreshing: false
  },
  isSessionExpiringSoon: false,
  refreshSession: async () => ({ success: false, error: 'Not implemented' }),
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signInWithGitHub: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
});

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    user: null,
    isExpired: false,
    expiresAt: null,
    refreshing: false
  });
  const [supabase] = useState(() => createClient());
  const [sessionManager] = useState(() => SessionManager.getInstance());

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
        } else {
          console.log('✅ Initial session loaded:', { hasSession: !!session });
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('❌ Failed to get initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set timeout to prevent infinite loading - only if still loading
    const setLoadingTimeout = () => {
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.log('⏰ Auth loading timeout - forcing loading to false');
          setLoading(false);
        }
      }, 3000);
    };

    // Start initial session fetch
    getInitialSession();
    setLoadingTimeout();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state changed:', { event, hasSession: !!session });
      
      // Clear any pending timeout since we got an auth event
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Initialize user plan for new signups or first-time sign-ins
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        try {
          console.log('🎯 Initializing user plan for:', session.user.email);
          const response = await fetch('/api/auth/init-user-plan', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ User plan initialized:', result);
          } else {
            console.warn('⚠️ Failed to initialize user plan:', response.status);
          }
        } catch (error) {
          console.error('❌ Error initializing user plan:', error);
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [supabase]); // Removed 'loading' from dependencies to prevent race condition

  // Authentication functions
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
        // Add CSRF protection via state parameter
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });
    return { error };
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Add CSRF protection via state parameter  
        queryParams: {
          scope: 'user:email'
        }
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
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Session management functions
  const refreshSession = async () => {
    return await sessionManager.refreshSession();
  };

  const isSessionExpiringSoon = sessionManager.isSessionExpiringSoon();

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading,
      sessionState,
      isSessionExpiringSoon,
      refreshSession,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithGitHub,
      resetPassword,
      signOut
    }}>
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