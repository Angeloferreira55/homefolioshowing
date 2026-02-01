-- Fix RLS policies: Change from RESTRICTIVE to PERMISSIVE
-- Drop existing restrictive policies and recreate as permissive

-- showing_sessions table
DROP POLICY IF EXISTS "Admins can create sessions" ON public.showing_sessions;
DROP POLICY IF EXISTS "Admins can delete their own sessions" ON public.showing_sessions;
DROP POLICY IF EXISTS "Admins can update their own sessions" ON public.showing_sessions;
DROP POLICY IF EXISTS "Admins can view their own sessions" ON public.showing_sessions;
DROP POLICY IF EXISTS "Public can view sessions via share token" ON public.showing_sessions;

CREATE POLICY "Admins can create sessions" 
ON public.showing_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can delete their own sessions" 
ON public.showing_sessions 
FOR DELETE 
TO authenticated
USING (admin_id = auth.uid());

CREATE POLICY "Admins can update their own sessions" 
ON public.showing_sessions 
FOR UPDATE 
TO authenticated
USING (admin_id = auth.uid());

CREATE POLICY "Admins can view their own sessions" 
ON public.showing_sessions 
FOR SELECT 
TO authenticated
USING (admin_id = auth.uid());

CREATE POLICY "Public can view sessions via share token" 
ON public.showing_sessions 
FOR SELECT 
TO anon, authenticated
USING (share_token IS NOT NULL);

-- session_properties table
DROP POLICY IF EXISTS "Admins can create session properties" ON public.session_properties;
DROP POLICY IF EXISTS "Admins can delete session properties" ON public.session_properties;
DROP POLICY IF EXISTS "Admins can update session properties" ON public.session_properties;
DROP POLICY IF EXISTS "Admins can view their session properties" ON public.session_properties;
DROP POLICY IF EXISTS "Public can view session properties" ON public.session_properties;

CREATE POLICY "Admins can create session properties" 
ON public.session_properties 
FOR INSERT 
TO authenticated
WITH CHECK (is_session_admin(session_id));

CREATE POLICY "Admins can delete session properties" 
ON public.session_properties 
FOR DELETE 
TO authenticated
USING (is_session_admin(session_id));

CREATE POLICY "Admins can update session properties" 
ON public.session_properties 
FOR UPDATE 
TO authenticated
USING (is_session_admin(session_id));

CREATE POLICY "Admins can view their session properties" 
ON public.session_properties 
FOR SELECT 
TO authenticated
USING (is_session_admin(session_id));

CREATE POLICY "Public can view session properties" 
ON public.session_properties 
FOR SELECT 
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM showing_sessions
  WHERE showing_sessions.id = session_properties.session_id 
  AND showing_sessions.share_token IS NOT NULL
));

-- property_documents table
DROP POLICY IF EXISTS "Admins can create property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Admins can delete property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Admins can update property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Admins can view their property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Public can view property documents" ON public.property_documents;

CREATE POLICY "Admins can create property documents" 
ON public.property_documents 
FOR INSERT 
TO authenticated
WITH CHECK (is_session_admin(get_session_id_from_property(session_property_id)));

CREATE POLICY "Admins can delete property documents" 
ON public.property_documents 
FOR DELETE 
TO authenticated
USING (is_session_admin(get_session_id_from_property(session_property_id)));

CREATE POLICY "Admins can update property documents" 
ON public.property_documents 
FOR UPDATE 
TO authenticated
USING (is_session_admin(get_session_id_from_property(session_property_id)));

CREATE POLICY "Admins can view their property documents" 
ON public.property_documents 
FOR SELECT 
TO authenticated
USING (is_session_admin(get_session_id_from_property(session_property_id)));

CREATE POLICY "Public can view property documents" 
ON public.property_documents 
FOR SELECT 
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM session_properties sp
  JOIN showing_sessions ss ON ss.id = sp.session_id
  WHERE sp.id = property_documents.session_property_id 
  AND ss.share_token IS NOT NULL
));

-- property_ratings table
DROP POLICY IF EXISTS "Anyone can view property ratings" ON public.property_ratings;
DROP POLICY IF EXISTS "Can rate properties in valid sessions" ON public.property_ratings;
DROP POLICY IF EXISTS "Can update property ratings in valid sessions" ON public.property_ratings;

CREATE POLICY "Anyone can view property ratings" 
ON public.property_ratings 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Can rate properties in valid sessions" 
ON public.property_ratings 
FOR INSERT 
TO anon, authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM session_properties sp
  JOIN showing_sessions ss ON ss.id = sp.session_id
  WHERE sp.id = property_ratings.session_property_id 
  AND ss.share_token IS NOT NULL
));

CREATE POLICY "Can update property ratings in valid sessions" 
ON public.property_ratings 
FOR UPDATE 
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM session_properties sp
  JOIN showing_sessions ss ON ss.id = sp.session_id
  WHERE sp.id = property_ratings.session_property_id 
  AND ss.share_token IS NOT NULL
));

-- profiles table
DROP POLICY IF EXISTS "Public can view agent profiles with shared sessions" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public can view agent profiles with shared sessions" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM showing_sessions
  WHERE showing_sessions.admin_id = profiles.user_id 
  AND showing_sessions.share_token IS NOT NULL
));

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);