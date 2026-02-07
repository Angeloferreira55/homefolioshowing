
-- Fix the public_agent_profile view to use security_invoker
DROP VIEW IF EXISTS public.public_agent_profile;

CREATE VIEW public.public_agent_profile
WITH (security_invoker=on) AS
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
