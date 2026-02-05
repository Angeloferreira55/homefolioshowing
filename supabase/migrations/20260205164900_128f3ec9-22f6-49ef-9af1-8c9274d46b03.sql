-- Remove the overly permissive public SELECT policy that exposes client data
DROP POLICY IF EXISTS "Public can view sessions via share token" ON public.showing_sessions;

-- Create a restrictive policy that denies direct public access
-- Public access should only be through the public_session_info view which excludes sensitive fields
CREATE POLICY "Deny public direct access to showing_sessions"
ON public.showing_sessions FOR SELECT
TO anon
USING (false);