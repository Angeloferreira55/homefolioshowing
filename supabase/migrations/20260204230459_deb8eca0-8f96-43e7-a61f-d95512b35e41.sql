-- Fix: Restrict client-photos storage uploads to authenticated users only

-- Drop the permissive policy that allows anyone to upload
DROP POLICY IF EXISTS "Anyone can upload client photos" ON storage.objects;

-- Create new policy requiring authentication for uploads
CREATE POLICY "Authenticated users can upload client photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'client-photos' AND
    auth.role() = 'authenticated'
  );