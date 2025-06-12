'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, X } from 'lucide-react';

export function SessionExpiryWarning() {
  const { sessionState, isSessionExpiringSoon, refreshSession } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Calculate time left until expiry
  useEffect(() => {
    if (!sessionState.expiresAt) return;

    const updateTimeLeft = () => {
      const now = Date.now();
      const timeRemaining = sessionState.expiresAt! - now;
      
      if (timeRemaining <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor(timeRemaining / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [sessionState.expiresAt]);

  // Reset dismissed state when session changes
  useEffect(() => {
    setDismissed(false);
  }, [sessionState.session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshSession();
      if (result.success) {
        setDismissed(true);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Don't show if:
  // - Session is not expiring soon
  // - User dismissed the warning
  // - No session exists
  // - Session is already expired (handled elsewhere)
  if (!isSessionExpiringSoon || dismissed || !sessionState.session || sessionState.isExpired) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-amber-200 bg-amber-50 text-amber-800">
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">Session expiring soon</p>
            <p className="text-sm text-amber-700">
              Your session will expire in {timeLeft}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              {refreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                'Extend'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:bg-amber-100 p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
} 