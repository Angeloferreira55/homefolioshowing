-- Add password protection column to showing_sessions
ALTER TABLE public.showing_sessions
ADD COLUMN share_password text;

-- Create a function to verify share password
CREATE OR REPLACE FUNCTION public.verify_share_access(p_share_token text, p_password text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.showing_sessions
    WHERE share_token = p_share_token
    AND (share_password IS NULL OR share_password = p_password)
  );
$$;