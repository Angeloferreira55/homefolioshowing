-- Add new columns to profiles table for agent profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS slogan text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS brokerage_name text,
ADD COLUMN IF NOT EXISTS brokerage_address text,
ADD COLUMN IF NOT EXISTS brokerage_phone text,
ADD COLUMN IF NOT EXISTS brokerage_email text,
ADD COLUMN IF NOT EXISTS brokerage_logo_url text;

-- Create storage bucket for profile assets (avatar and brokerage logo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile-assets bucket
CREATE POLICY "Users can upload their own profile assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile assets are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-assets');