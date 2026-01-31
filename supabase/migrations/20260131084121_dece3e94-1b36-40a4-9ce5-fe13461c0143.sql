-- Fix the permissive INSERT policy on property_ratings
-- Restrict to only allow ratings on properties that exist in valid sessions

DROP POLICY IF EXISTS "Anyone can create property ratings" ON public.property_ratings;

CREATE POLICY "Can rate properties in valid sessions"
  ON public.property_ratings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.session_properties sp
    JOIN public.showing_sessions ss ON ss.id = sp.session_id
    WHERE sp.id = session_property_id AND ss.share_token IS NOT NULL
  ));