-- ============================================
-- Fix client_photos and property_ratings RLS
-- Drop ALL existing policies and recreate clean ones
-- ============================================

-- 1. Drop ALL client_photos policies
DROP POLICY IF EXISTS "Anyone can view client photos" ON public.client_photos;
DROP POLICY IF EXISTS "Anyone can insert client photos" ON public.client_photos;
DROP POLICY IF EXISTS "Session admins can insert client photos" ON public.client_photos;
DROP POLICY IF EXISTS "Admins can view their session photos" ON public.client_photos;
DROP POLICY IF EXISTS "Admins can insert photos" ON public.client_photos;
DROP POLICY IF EXISTS "Public can view photos via share token context" ON public.client_photos;
DROP POLICY IF EXISTS "Session admins can delete client photos" ON public.client_photos;

-- Ensure RLS is enabled
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins can view photos for their sessions
CREATE POLICY "admin_select_client_photos" ON public.client_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM session_properties sp
    JOIN showing_sessions ss ON sp.session_id = ss.id
    WHERE sp.id = client_photos.session_property_id
    AND ss.admin_id = auth.uid()
  )
);

-- SELECT: Anyone can view photos for sessions with a share token (public session pages)
CREATE POLICY "public_select_client_photos" ON public.client_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM session_properties sp
    JOIN showing_sessions ss ON sp.session_id = ss.id
    WHERE sp.id = client_photos.session_property_id
    AND ss.share_token IS NOT NULL
  )
);

-- INSERT: Service role only (edge function handles this)
-- No INSERT policy needed for regular users - the upload-client-photo edge function uses service role

-- DELETE: Admins can delete photos for their sessions
CREATE POLICY "admin_delete_client_photos" ON public.client_photos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM session_properties sp
    JOIN showing_sessions ss ON sp.session_id = ss.id
    WHERE sp.id = client_photos.session_property_id
    AND ss.admin_id = auth.uid()
  )
);

-- 2. Drop ALL property_ratings policies
DROP POLICY IF EXISTS "Anyone can view property ratings" ON public.property_ratings;
DROP POLICY IF EXISTS "Anyone can insert property ratings" ON public.property_ratings;
DROP POLICY IF EXISTS "Can rate properties in valid sessions" ON public.property_ratings;
DROP POLICY IF EXISTS "Can update property ratings in valid sessions" ON public.property_ratings;
DROP POLICY IF EXISTS "Admins can view their session ratings" ON public.property_ratings;
DROP POLICY IF EXISTS "Public can view ratings via share token context" ON public.property_ratings;

-- Ensure RLS is enabled
ALTER TABLE public.property_ratings ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins can view ratings for their sessions
CREATE POLICY "admin_select_ratings" ON public.property_ratings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM session_properties sp
    JOIN showing_sessions ss ON sp.session_id = ss.id
    WHERE sp.id = property_ratings.session_property_id
    AND ss.admin_id = auth.uid()
  )
);

-- SELECT: Anyone can view ratings for sessions with a share token (public pages)
CREATE POLICY "public_select_ratings" ON public.property_ratings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM session_properties sp
    JOIN showing_sessions ss ON sp.session_id = ss.id
    WHERE sp.id = property_ratings.session_property_id
    AND ss.share_token IS NOT NULL
  )
);

-- INSERT: Allow insert via RPC (submit_property_rating is SECURITY DEFINER)
-- Also allow direct insert for backward compatibility
CREATE POLICY "public_insert_ratings" ON public.property_ratings
FOR INSERT WITH CHECK (true);

-- UPDATE: Allow update for existing ratings
CREATE POLICY "public_update_ratings" ON public.property_ratings
FOR UPDATE USING (true) WITH CHECK (true);
