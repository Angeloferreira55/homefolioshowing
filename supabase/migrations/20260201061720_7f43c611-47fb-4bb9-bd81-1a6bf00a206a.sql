-- Add social media columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN linkedin_url text,
ADD COLUMN instagram_url text,
ADD COLUMN facebook_url text,
ADD COLUMN twitter_url text,
ADD COLUMN youtube_url text,
ADD COLUMN website_url text;