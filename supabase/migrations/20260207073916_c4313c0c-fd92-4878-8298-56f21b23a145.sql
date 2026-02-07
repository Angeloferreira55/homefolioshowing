
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view sessions with share_token" ON public.showing_sessions;

-- Recreate it to ONLY allow access for anonymous users (not authenticated users)
-- Authenticated users should only see their own sessions via the existing admin policy
CREATE POLICY "Anon can view sessions with share_token"
ON public.showing_sessions
FOR SELECT
TO anon
USING (share_token IS NOT NULL AND deleted_at IS NULL AND archived_at IS NULL);
