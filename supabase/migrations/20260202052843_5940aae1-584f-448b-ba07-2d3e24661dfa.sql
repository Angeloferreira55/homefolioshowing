-- Remove the overly permissive INSERT policy for client_photos
DROP POLICY IF EXISTS "Anyone can insert client photos" ON public.client_photos;

-- Create a more restrictive policy that only allows authenticated session admins to upload photos
CREATE POLICY "Session admins can insert client photos"
ON public.client_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_properties sp
    JOIN showing_sessions ss ON ss.id = sp.session_id
    WHERE sp.id = session_property_id
    AND ss.admin_id = auth.uid()
  )
);