-- Fix security definer views - convert to security_invoker
DROP VIEW IF EXISTS public.public_session_info;
DROP VIEW IF EXISTS public.public_agent_profile;

-- Recreate views with security_invoker (safer)
CREATE VIEW public.public_session_info 
WITH (security_invoker = on) AS
SELECT 
  id,
  title,
  session_date,
  share_token,
  created_at,
  updated_at,
  admin_id
FROM showing_sessions
WHERE share_token IS NOT NULL;

CREATE VIEW public.public_agent_profile 
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  full_name,
  company,
  bio,
  slogan,
  avatar_url,
  website_url,
  facebook_url,
  instagram_url,
  linkedin_url,
  twitter_url,
  youtube_url,
  brokerage_name,
  brokerage_logo_url
FROM profiles;