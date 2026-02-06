-- Create a function to check if session requires password (public access)
CREATE OR REPLACE FUNCTION public.check_session_password_required(p_share_token text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT share_password IS NOT NULL
  FROM public.showing_sessions
  WHERE share_token = p_share_token
  LIMIT 1;
$$;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION public.check_session_password_required(text) TO anon;