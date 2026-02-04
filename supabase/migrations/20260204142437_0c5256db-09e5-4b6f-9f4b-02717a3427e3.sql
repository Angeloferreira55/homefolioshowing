-- Add Spark API credential fields to profiles table
-- These are stored encrypted and only accessible by the profile owner

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mls_api_key text,
ADD COLUMN IF NOT EXISTS mls_api_secret text,
ADD COLUMN IF NOT EXISTS mls_board_id text,
ADD COLUMN IF NOT EXISTS mls_provider text DEFAULT 'spark';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.mls_api_key IS 'Encrypted Spark API client_id';
COMMENT ON COLUMN public.profiles.mls_api_secret IS 'Encrypted Spark API client_secret';
COMMENT ON COLUMN public.profiles.mls_board_id IS 'MLS board identifier (optional, some MLSs require this)';
COMMENT ON COLUMN public.profiles.mls_provider IS 'MLS provider type (spark, rets, etc.)';

-- Ensure these sensitive fields are only accessible by the profile owner
-- The existing RLS policies already restrict profiles to owner-only access