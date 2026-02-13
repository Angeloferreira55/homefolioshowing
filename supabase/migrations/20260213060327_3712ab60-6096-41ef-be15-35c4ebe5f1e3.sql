-- Create managed_agents table
CREATE TABLE public.managed_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  slogan text,
  bio text,
  company text,
  license_number text,
  brokerage_name text,
  brokerage_address text,
  brokerage_phone text,
  brokerage_email text,
  brokerage_logo_url text,
  linkedin_url text,
  instagram_url text,
  facebook_url text,
  twitter_url text,
  youtube_url text,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.managed_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view managed agents"
  ON public.managed_agents FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can insert managed agents"
  ON public.managed_agents FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update managed agents"
  ON public.managed_agents FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete managed agents"
  ON public.managed_agents FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Public can view managed agents for sessions"
  ON public.managed_agents FOR SELECT
  TO anon
  USING (true);

CREATE INDEX idx_managed_agents_owner_id ON public.managed_agents(owner_id);

CREATE OR REPLACE FUNCTION public.update_managed_agents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER managed_agents_updated_at
  BEFORE UPDATE ON public.managed_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_managed_agents_updated_at();

-- Add agent_profile_id to showing_sessions
ALTER TABLE public.showing_sessions
  ADD COLUMN agent_profile_id uuid REFERENCES public.managed_agents(id) ON DELETE SET NULL;

CREATE INDEX idx_showing_sessions_agent_profile_id ON public.showing_sessions(agent_profile_id);

-- RPC: Resolve agent profile by share token
CREATE OR REPLACE FUNCTION public.get_session_agent_profile_by_token(p_share_token text)
RETURNS TABLE(
  full_name text, avatar_url text, slogan text, bio text, phone text, email text,
  company text, brokerage_name text, brokerage_address text, brokerage_phone text,
  brokerage_email text, brokerage_logo_url text, linkedin_url text, instagram_url text,
  facebook_url text, twitter_url text, youtube_url text, website_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(ma.full_name, p.full_name), COALESCE(ma.avatar_url, p.avatar_url),
    COALESCE(ma.slogan, p.slogan), COALESCE(ma.bio, p.bio),
    COALESCE(ma.phone, p.phone), COALESCE(ma.email, p.email),
    COALESCE(ma.company, p.company), COALESCE(ma.brokerage_name, p.brokerage_name),
    COALESCE(ma.brokerage_address, p.brokerage_address), COALESCE(ma.brokerage_phone, p.brokerage_phone),
    COALESCE(ma.brokerage_email, p.brokerage_email), COALESCE(ma.brokerage_logo_url, p.brokerage_logo_url),
    COALESCE(ma.linkedin_url, p.linkedin_url), COALESCE(ma.instagram_url, p.instagram_url),
    COALESCE(ma.facebook_url, p.facebook_url), COALESCE(ma.twitter_url, p.twitter_url),
    COALESCE(ma.youtube_url, p.youtube_url), COALESCE(ma.website_url, p.website_url)
  FROM showing_sessions ss
  JOIN profiles p ON p.user_id = ss.admin_id
  LEFT JOIN managed_agents ma ON ma.id = ss.agent_profile_id
  WHERE ss.share_token = p_share_token;
$$;

-- RPC: Resolve agent profile by session ID
CREATE OR REPLACE FUNCTION public.get_session_agent_profile(p_session_id uuid)
RETURNS TABLE(
  full_name text, avatar_url text, slogan text, bio text, phone text, email text,
  company text, brokerage_name text, brokerage_address text, brokerage_phone text,
  brokerage_email text, brokerage_logo_url text, linkedin_url text, instagram_url text,
  facebook_url text, twitter_url text, youtube_url text, website_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(ma.full_name, p.full_name), COALESCE(ma.avatar_url, p.avatar_url),
    COALESCE(ma.slogan, p.slogan), COALESCE(ma.bio, p.bio),
    COALESCE(ma.phone, p.phone), COALESCE(ma.email, p.email),
    COALESCE(ma.company, p.company), COALESCE(ma.brokerage_name, p.brokerage_name),
    COALESCE(ma.brokerage_address, p.brokerage_address), COALESCE(ma.brokerage_phone, p.brokerage_phone),
    COALESCE(ma.brokerage_email, p.brokerage_email), COALESCE(ma.brokerage_logo_url, p.brokerage_logo_url),
    COALESCE(ma.linkedin_url, p.linkedin_url), COALESCE(ma.instagram_url, p.instagram_url),
    COALESCE(ma.facebook_url, p.facebook_url), COALESCE(ma.twitter_url, p.twitter_url),
    COALESCE(ma.youtube_url, p.youtube_url), COALESCE(ma.website_url, p.website_url)
  FROM showing_sessions ss
  JOIN profiles p ON p.user_id = ss.admin_id
  LEFT JOIN managed_agents ma ON ma.id = ss.agent_profile_id
  WHERE ss.id = p_session_id;
$$;