-- Create a secure view for public session access that excludes sensitive client info
CREATE OR REPLACE VIEW public.public_session_view AS
SELECT 
  id,
  admin_id,
  client_name,
  -- Explicitly exclude client_email and client_phone
  title,
  notes,
  session_date,
  share_token,
  created_at,
  updated_at
FROM public.showing_sessions
WHERE share_token IS NOT NULL;

-- Create a secure function to get public session data
CREATE OR REPLACE FUNCTION public.get_public_session(p_share_token TEXT)
RETURNS TABLE (
  id UUID,
  admin_id UUID,
  client_name TEXT,
  title TEXT,
  notes TEXT,
  session_date DATE,
  share_token TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    admin_id,
    client_name,
    title,
    notes,
    session_date,
    share_token,
    created_at,
    updated_at
  FROM public.showing_sessions
  WHERE showing_sessions.share_token = p_share_token;
$$;