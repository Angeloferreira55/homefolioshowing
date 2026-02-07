-- Add a permissive SELECT policy for public access to sessions via share_token
-- This allows the public_session_info view to work for anonymous/authenticated users
CREATE POLICY "Public can view sessions with share_token"
ON public.showing_sessions
FOR SELECT
USING (share_token IS NOT NULL AND deleted_at IS NULL AND archived_at IS NULL);