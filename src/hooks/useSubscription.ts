import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'starter' | 'pro' | 'team';

interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
  isTrial: boolean;
  loading: boolean;
  error: string | null;
}

// Price IDs for checkout
export const PRICE_IDS = {
  pro: {
    monthly: 'price_1SypiGGny8WPy9rqHPf37JT8',
    yearly: 'price_1SypiZGny8WPy9rqwlNEXlso',
  },
  team: {
    monthly: 'price_1SypipGny8WPy9rqbWEZZuKU',
    yearly: 'price_1Sypj4Gny8WPy9rqW7raQeaH',
  },
} as const;

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    tier: 'starter',
    subscriptionEnd: null,
    isTrial: false,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({
          subscribed: false,
          tier: 'starter',
          subscriptionEnd: null,
          isTrial: false,
          loading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return;
      }

      setState({
        subscribed: data.subscribed,
        tier: data.tier as SubscriptionTier,
        subscriptionEnd: data.subscription_end,
        isTrial: data.is_trial ?? false,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }));
    }
  }, []);

  const createCheckout = useCallback(async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      throw err;
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      throw err;
    }
  }, []);

  const redeemBetaCode = useCallback(async (code: string) => {
    const { data, error } = await supabase.rpc('redeem_beta_code', { p_code: code });
    if (error) throw error;
    const result = data as unknown as { success: boolean; error?: string; trial_ends_at?: string; tier?: string };
    if (!result.success) {
      throw new Error(result.error || 'Failed to redeem code');
    }
    // Refresh subscription state
    await checkSubscription();
    return result;
  }, [checkSubscription]);

  useEffect(() => {
    checkSubscription();

    const interval = setInterval(checkSubscription, 60000);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    redeemBetaCode,
  };
}
