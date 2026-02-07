-- Add SELECT policy for property-documents bucket
-- Allow authenticated users to read property documents (signed URLs will handle the actual access)
CREATE POLICY "Authenticated users can read property documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-documents' 
  AND auth.role() = 'authenticated'
);

-- Update INSERT policy to require authentication explicitly
DROP POLICY IF EXISTS "Authenticated users can upload property documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload property documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-documents' 
  AND auth.role() = 'authenticated'
);

-- Update DELETE policy to require authentication
DROP POLICY IF EXISTS "Users can delete property documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete property documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-documents' 
  AND auth.role() = 'authenticated'
);