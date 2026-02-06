-- Fix profiles table security: explicitly deny anonymous access
-- The public_agent_profile view already provides safe public access to non-sensitive fields

-- First, drop existing SELECT policy and recreate with explicit role targeting
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create explicit deny policy for anonymous users
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- Recreate authenticated user policy with explicit role targeting
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());