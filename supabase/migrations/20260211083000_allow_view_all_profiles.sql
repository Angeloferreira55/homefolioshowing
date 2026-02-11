-- Allow authenticated users to view all profiles
-- This is needed for the ManageUsers admin page to display all users

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;

-- Create new policy that allows viewing all profiles
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Keep the other policies for insert/update/delete restricted to own profile
