-- Update get_public_session function to exclude client contact info
CREATE OR REPLACE FUNCTION public.get_public_session(p_share_token text)
 RETURNS TABLE(id uuid, admin_id uuid, client_name text, title text, notes text, session_date date, share_token text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;