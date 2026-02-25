-- Add delivery completion tracking columns to session_properties
ALTER TABLE public.session_properties
ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;

-- Update get_public_session to return session_type for client portal pop-by detection
CREATE OR REPLACE FUNCTION public.get_public_session(p_share_token text)
RETURNS TABLE(
  id uuid,
  admin_id uuid,
  client_name text,
  title text,
  notes text,
  session_date date,
  share_token text,
  session_type text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
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
    session_type,
    created_at,
    updated_at
  FROM public.showing_sessions
  WHERE showing_sessions.share_token = p_share_token;
$function$;

-- Secure RPC for anonymous clients to mark a pop-by delivery as completed
-- Follows the same pattern as submit_property_rating
CREATE OR REPLACE FUNCTION public.submit_delivery_completion(
  p_session_property_id UUID,
  p_share_token TEXT,
  p_delivery_notes TEXT DEFAULT NULL,
  p_delivery_photo_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Verify share token matches a pop_by session that owns this property
  SELECT ss.id INTO v_session_id
  FROM session_properties sp
  JOIN showing_sessions ss ON ss.id = sp.session_id
  WHERE sp.id = p_session_property_id
    AND ss.share_token = p_share_token
    AND ss.session_type = 'pop_by';

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid share token or property';
  END IF;

  UPDATE session_properties
  SET
    delivery_completed_at = NOW(),
    delivery_notes = p_delivery_notes,
    delivery_photo_url = p_delivery_photo_url,
    updated_at = NOW()
  WHERE id = p_session_property_id;

  RETURN p_session_property_id;
END;
$$;

-- RPC to undo a delivery completion (reset to pending)
CREATE OR REPLACE FUNCTION public.undo_delivery_completion(
  p_session_property_id UUID,
  p_share_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  SELECT ss.id INTO v_session_id
  FROM session_properties sp
  JOIN showing_sessions ss ON ss.id = sp.session_id
  WHERE sp.id = p_session_property_id
    AND ss.share_token = p_share_token;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid share token or property';
  END IF;

  UPDATE session_properties
  SET
    delivery_completed_at = NULL,
    delivery_notes = NULL,
    delivery_photo_url = NULL,
    updated_at = NOW()
  WHERE id = p_session_property_id;

  RETURN p_session_property_id;
END;
$$;
