import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';

export interface ManagedAgent {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  slogan: string | null;
  bio: string | null;
  company: string | null;
  license_number: string | null;
  brokerage_name: string | null;
  brokerage_address: string | null;
  brokerage_phone: string | null;
  brokerage_email: string | null;
  brokerage_logo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActiveAgentContextValue {
  managedAgents: ManagedAgent[];
  activeAgentId: string | null;
  activeAgent: ManagedAgent | null;
  setActiveAgentId: (id: string | null) => void;
  isAssistantMode: boolean;
  loading: boolean;
  refetchAgents: () => Promise<void>;
}

const STORAGE_KEY = 'homefolio_active_agent';

export const ActiveAgentContext = createContext<ActiveAgentContextValue>({
  managedAgents: [],
  activeAgentId: null,
  activeAgent: null,
  setActiveAgentId: () => {},
  isAssistantMode: false,
  loading: true,
  refetchAgents: async () => {},
});

export function ActiveAgentProvider({ children }: { children: ReactNode }) {
  const { tier, subscribed } = useSubscription();
  const isAssistantTier = tier === 'assistant' && subscribed;

  const [managedAgents, setManagedAgents] = useState<ManagedAgent[]>([]);
  const [activeAgentId, setActiveAgentIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setActiveAgentId = useCallback((id: string | null) => {
    setActiveAgentIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const refetchAgents = useCallback(async () => {
    if (!isAssistantTier) {
      setManagedAgents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('managed_agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching managed agents:', error);
        setManagedAgents([]);
      } else {
        setManagedAgents(data || []);
        // If the stored activeAgentId no longer exists, clear it
        if (activeAgentId && data && !data.find(a => a.id === activeAgentId)) {
          setActiveAgentId(null);
        }
      }
    } catch (err) {
      console.error('Error fetching managed agents:', err);
      setManagedAgents([]);
    } finally {
      setLoading(false);
    }
  }, [isAssistantTier, activeAgentId, setActiveAgentId]);

  useEffect(() => {
    refetchAgents();
  }, [refetchAgents]);

  const activeAgent = activeAgentId
    ? managedAgents.find(a => a.id === activeAgentId) || null
    : null;

  const isAssistantMode = isAssistantTier && managedAgents.length > 0;

  return (
    <ActiveAgentContext.Provider
      value={{
        managedAgents,
        activeAgentId,
        activeAgent,
        setActiveAgentId,
        isAssistantMode,
        loading,
        refetchAgents,
      }}
    >
      {children}
    </ActiveAgentContext.Provider>
  );
}
