-- Allow public to view profiles of agents who have shared sessions
CREATE POLICY "Public can view agent profiles with shared sessions"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.showing_sessions
    WHERE showing_sessions.admin_id = profiles.user_id
    AND showing_sessions.share_token IS NOT NULL
  )
);