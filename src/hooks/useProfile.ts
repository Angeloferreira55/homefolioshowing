import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
  slogan: string | null;
  bio: string | null;
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
  // MLS credentials
  mls_api_key: string | null;
  mls_api_secret: string | null;
  mls_board_id: string | null;
  mls_provider: string | null;
  // Team fields
  role: string | null;
  team_id: string | null;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
  slogan?: string;
  bio?: string;
  license_number?: string;
  brokerage_name?: string;
  brokerage_address?: string;
  brokerage_phone?: string;
  brokerage_email?: string;
  brokerage_logo_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  website_url?: string;
  // MLS credentials
  mls_api_key?: string;
  mls_api_secret?: string;
  mls_board_id?: string;
  mls_provider?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || signal?.aborted) {
        if (!signal?.aborted) setLoading(false);
        return;
      }

      // Use maybeSingle() so it doesn't throw when profile doesn't exist yet
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (signal?.aborted) return;

      if (queryError) throw queryError;

      if (data) {
        setProfile(data as unknown as Profile);
      } else {
        // Profile doesn't exist yet - create a minimal one with user email
        setProfile({
          id: '',
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          phone: null,
          company: null,
          avatar_url: null,
          slogan: null,
          bio: null,
          license_number: null,
          brokerage_name: null,
          brokerage_address: null,
          brokerage_phone: null,
          brokerage_email: null,
          brokerage_logo_url: null,
          linkedin_url: null,
          instagram_url: null,
          facebook_url: null,
          twitter_url: null,
          youtube_url: null,
          website_url: null,
          mls_api_key: null,
          mls_api_secret: null,
          mls_board_id: null,
          mls_provider: null,
          role: null,
          team_id: null,
        });
      }
    } catch (err: any) {
      if (signal?.aborted) return;
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const updateProfile = async (updates: ProfileUpdate) => {
    // Don't send empty updates
    const keys = Object.keys(updates).filter(k => updates[k as keyof ProfileUpdate] !== undefined);
    if (keys.length === 0) {
      toast.info('No changes to save');
      return true;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated!');
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File, type: 'avatar' | 'logo'): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchProfile(abortController.signal);
    return () => abortController.abort();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    saving,
    updateProfile,
    uploadImage,
    refetch: () => fetchProfile(),
  };
}
