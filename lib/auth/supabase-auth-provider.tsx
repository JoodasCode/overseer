'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  clearAppState: () => void;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signInWithGitHub: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  clearAppState: () => {},
});

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 🧹 CRITICAL: Clear all app state when user changes
  const clearAppState = () => {
    console.log('🧹 Clearing app state for user switch');
    
    // Client instances are now handled by singleton pattern
    
    // Clear localStorage caches
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('chat-') || 
        key.startsWith('agents-') || 
        key.startsWith('messages-') ||
        key.startsWith('supabase-')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.startsWith('chat-') || 
        key.startsWith('agents-') || 
        key.startsWith('messages-')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('✅ App state cleared:', { localStorageKeys: keysToRemove.length, sessionStorageKeys: sessionKeysToRemove.length });
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      console.log('🔐 Initial session loaded:', { hasSession: !!session, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      console.log('🔄 Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
      
      // Clear state on sign out or user change
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out - clearing state');
        clearAppState();
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('👋 User signed in:', { userId: session.user.id, email: session.user.email });
        // Clear state to prevent cross-user contamination
        clearAppState();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed for user:', session?.user?.id);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithGitHub,
      resetPassword,
      signOut,
      clearAppState
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