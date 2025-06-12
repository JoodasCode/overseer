'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-provider';
import { createClient } from '@/lib/supabase/client';

export interface UserPlan {
  subscription_plan: 'FREE' | 'PRO' | 'TEAM';
  tokens_used: number;
  token_quota: number;
  tokens_remaining: number;
  reset_period: string;
  last_reset: string;
  billing_email?: string;
  auto_renew?: boolean;
}

export function useUserPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPlan = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch user tokens and billing info
      const [tokensResult, billingResult] = await Promise.all([
        supabase
          .from('user_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_billing')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      if (tokensResult.error && tokensResult.error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch token data: ${tokensResult.error.message}`);
      }

      if (billingResult.error && billingResult.error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch billing data: ${billingResult.error.message}`);
      }

      // If no records exist, user needs plan initialization
      if (!tokensResult.data || !billingResult.data) {
        console.log('🔄 User plan not found, triggering initialization...');
        
        // Call the init endpoint
        const response = await fetch('/api/auth/init-user-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to initialize user plan');
        }

        // Retry fetching after initialization
        const [retryTokens, retryBilling] = await Promise.all([
          supabase
            .from('user_tokens')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('user_billing')
            .select('*')
            .eq('user_id', user.id)
            .single()
        ]);

        if (retryTokens.error || retryBilling.error) {
          throw new Error('Failed to fetch plan after initialization');
        }

        const userPlan: UserPlan = {
          subscription_plan: retryTokens.data.subscription_plan || 'FREE',
          tokens_used: retryTokens.data.tokens_used || 0,
          token_quota: retryTokens.data.token_quota || 20,
          tokens_remaining: (retryTokens.data.token_quota || 20) - (retryTokens.data.tokens_used || 0),
          reset_period: retryTokens.data.reset_period || 'monthly',
          last_reset: retryTokens.data.last_reset,
          billing_email: retryBilling.data.billing_email,
          auto_renew: retryBilling.data.auto_renew
        };

        setPlan(userPlan);
        return;
      }

      // Construct plan object from existing data
      const userPlan: UserPlan = {
        subscription_plan: tokensResult.data.subscription_plan || 'FREE',
        tokens_used: tokensResult.data.tokens_used || 0,
        token_quota: tokensResult.data.token_quota || 20,
        tokens_remaining: (tokensResult.data.token_quota || 20) - (tokensResult.data.tokens_used || 0),
        reset_period: tokensResult.data.reset_period || 'monthly',
        last_reset: tokensResult.data.last_reset,
        billing_email: billingResult.data?.billing_email,
        auto_renew: billingResult.data?.auto_renew
      };

      setPlan(userPlan);

    } catch (err) {
      console.error('❌ Error fetching user plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user plan');
    } finally {
      setLoading(false);
    }
  };

  const refreshPlan = () => {
    fetchUserPlan();
  };

  useEffect(() => {
    fetchUserPlan();
  }, [user?.id]);

  return {
    plan,
    loading,
    error,
    refreshPlan
  };
} 