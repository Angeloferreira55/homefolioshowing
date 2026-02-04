-- Drop the public SELECT policy on profiles table that exposes ALL fields
DROP POLICY IF EXISTS "Public can view agent profiles with shared sessions" ON public.profiles;

-- Recreate the public_agent_profile view to include contact info agents want public
-- but EXCLUDE: license_number, mls_api_key, mls_api_secret, mls_board_id, mls_provider
DROP VIEW IF EXISTS public.public_agent_profile;

CREATE VIEW public.public_agent_profile AS
SELECT 
  id,
  user_id,
  full_name,
  company,
  email,
  phone,
  bio,
  slogan,
  avatar_url,
  brokerage_name,
  brokerage_address,
  brokerage_phone,
  brokerage_email,
  brokerage_logo_url,
  linkedin_url,
  instagram_url,
  facebook_url,
  twitter_url,
  youtube_url,
  website_url
FROM public.profiles;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_agent_profile TO anon, authenticated;