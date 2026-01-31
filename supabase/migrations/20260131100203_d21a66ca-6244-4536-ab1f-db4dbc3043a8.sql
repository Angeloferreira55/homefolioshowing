-- Allow public users to update their own ratings
CREATE POLICY "Can update property ratings in valid sessions"
ON public.property_ratings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM session_properties sp
    JOIN showing_sessions ss ON ss.id = sp.session_id
    WHERE sp.id = property_ratings.session_property_id
    AND ss.share_token IS NOT NULL
  )
);