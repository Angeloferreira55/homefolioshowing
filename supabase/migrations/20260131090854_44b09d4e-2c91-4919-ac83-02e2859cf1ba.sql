-- Create storage bucket for MLS uploads (PDFs, CSVs, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mls-uploads',
  'mls-uploads',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload MLS files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mls-uploads');

-- Allow users to read their own uploads
CREATE POLICY "Users can read their own MLS uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'mls-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own MLS uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mls-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);