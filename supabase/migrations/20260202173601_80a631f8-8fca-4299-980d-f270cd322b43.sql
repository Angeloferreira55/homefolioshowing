-- Create secure function for submitting/updating property ratings with share token validation
CREATE OR REPLACE FUNCTION public.submit_property_rating(
  p_session_property_id UUID,
  p_share_token TEXT,
  p_rating INTEGER,
  p_feedback TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_rating_id UUID;
BEGIN
  -- Verify share token is valid for this property's session
  SELECT ss.id INTO v_session_id
  FROM session_properties sp
  JOIN showing_sessions ss ON ss.id = sp.session_id
  WHERE sp.id = p_session_property_id
  AND ss.share_token = p_share_token;
  
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid share token or property';
  END IF;
  
  -- Check for existing rating
  SELECT id INTO v_rating_id
  FROM property_ratings
  WHERE session_property_id = p_session_property_id;
  
  IF v_rating_id IS NULL THEN
    -- Insert new rating
    INSERT INTO property_ratings (session_property_id, rating, feedback)
    VALUES (p_session_property_id, p_rating, p_feedback)
    RETURNING id INTO v_rating_id;
  ELSE
    -- Update existing rating
    UPDATE property_ratings
    SET rating = p_rating, feedback = p_feedback
    WHERE id = v_rating_id;
  END IF;
  
  RETURN v_rating_id;
END;
$$;

-- Drop the weak INSERT policy
DROP POLICY IF EXISTS "Can rate properties in valid sessions" ON public.property_ratings;

-- Drop the weak UPDATE policy
DROP POLICY IF EXISTS "Can update property ratings in valid sessions" ON public.property_ratings;