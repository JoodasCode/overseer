'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-provider';
import { AuthModal } from './auth-modal';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && hasMounted) {
      setShowAuthModal(true);
    } else if (user) {
      setShowAuthModal(false);
    }
  }, [user, loading, hasMounted]);

  if (loading || !hasMounted) {
    return (
      fallback || (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#9bbc0f] mx-auto" />
            <p className="font-pixel text-[#9bbc0f] text-sm">LOADING...</p>
          </div>
        </div>
      )
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#9bbc0f] mx-auto animate-pulse" />
            <h1 className="font-pixel text-[#9bbc0f] text-xl">OVERSEER</h1>
            <p className="font-pixel text-[#9bbc0f]/80 text-sm">Please sign in to continue</p>
          </div>
        </div>
        {hasMounted && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
          />
        )}
      </>
    );
  }

  return <>{children}</>;
} 