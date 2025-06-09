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

  // Debug logging for Phase 1B
  console.log('🛡️ ProtectedRoute state:', {
    user: user ? user.email : 'None',
    loading,
    hasMounted,
    showAuthModal
  });

  useEffect(() => {
    setHasMounted(true);
    console.log('🛡️ ProtectedRoute mounted');
  }, []);

  useEffect(() => {
    console.log('🛡️ ProtectedRoute auth effect:', { user: !!user, loading, hasMounted });
    if (!loading && !user && hasMounted) {
      console.log('🛡️ Should show AuthModal');
      setShowAuthModal(true);
    } else if (user) {
      console.log('🛡️ User present, hiding AuthModal');
      setShowAuthModal(false);
    }
  }, [user, loading, hasMounted]);

  // Show loading state while auth is resolving or component hasn't mounted
  if (loading || !hasMounted) {
    console.log('🛡️ Showing loading state');
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#9bbc0f] mx-auto animate-pulse" />
          <h1 className="font-pixel text-[#9bbc0f] text-xl">OVERSEER</h1>
          <p className="font-pixel text-[#9bbc0f]/80 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated - show the protected content
  if (user) {
    console.log('🛡️ User authenticated, showing protected content');
    return <>{children}</>;
  }

  // User is not authenticated - show auth modal
  console.log('🛡️ User not authenticated, showing auth prompt');
  return (
    <>
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#9bbc0f] mx-auto animate-pulse" />
          <h1 className="font-pixel text-[#9bbc0f] text-xl">OVERSEER</h1>
          <p className="font-pixel text-[#9bbc0f]/80 text-sm">Please sign in to continue</p>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          console.log('🛡️ AuthModal close attempted');
          setShowAuthModal(false);
        }}
        defaultTab="signin"
      />
    </>
  );
} 