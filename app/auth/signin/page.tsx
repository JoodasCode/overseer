'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/supabase-auth-provider';
import { ModernAuthForm } from '@/components/auth/modern-auth-form';
import { Loader2, CheckCircle } from 'lucide-react';

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  // Check if user was just logged out
  const loggedOut = searchParams?.get('logged_out') === 'true';
  const loginError = searchParams?.get('error');

  useEffect(() => {
    // Show logout success message briefly
    if (loggedOut && !user) {
      setShowLogoutSuccess(true);
      // Clear the URL parameter after showing message
      const timer = setTimeout(() => {
        setShowLogoutSuccess(false);
        // Clean up the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('logged_out');
        window.history.replaceState({}, '', url.toString());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loggedOut, user]);

  useEffect(() => {
    // Only redirect if we have a user and we're not loading
    if (user && !loading && !loggedOut) {
      router.push('/dashboard');
    }
  }, [user, loading, router, loggedOut]);

  const handleAuthSuccess = () => {
    router.push('/dashboard');
  };

  // Show loading only when actually loading auth state (not when logged out)
  if (loading && !loggedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading AGENTS OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AGENTS OS
          </h1>
          <p className="text-muted-foreground">
            Manage your AI agent team
          </p>
        </div>

        {/* Logout Success Message */}
        {showLogoutSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Successfully logged out</p>
            </div>
          </div>
        )}

        {/* Login Error Message */}
        {loginError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {loginError === 'logout_failed' 
                ? 'Logout encountered an error, but you have been signed out.'
                : 'An error occurred during authentication.'
              }
            </p>
          </div>
        )}
        
        <ModernAuthForm 
          defaultTab="signin" 
          onSuccess={handleAuthSuccess}
        />
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button 
              onClick={() => router.push('/auth/signup')}
              className="text-primary hover:underline font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 