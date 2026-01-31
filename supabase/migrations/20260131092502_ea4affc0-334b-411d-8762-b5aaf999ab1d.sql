-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-documents',
  'property-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload property documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-documents');

-- Allow users to read documents for properties they can access
CREATE POLICY "Users can read property documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'property-documents');

-- Allow users to delete their own documents
CREATE POLICY "Users can delete property documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-documents');