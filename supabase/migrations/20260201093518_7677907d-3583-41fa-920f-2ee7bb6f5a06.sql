-- Create table for client-uploaded photos on properties
CREATE TABLE public.client_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_property_id UUID NOT NULL REFERENCES public.session_properties(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;

-- Allow anyone with a valid share token to insert photos (public access for clients)
CREATE POLICY "Anyone can insert client photos"
  ON public.client_photos
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view client photos (public access for clients viewing session)
CREATE POLICY "Anyone can view client photos"
  ON public.client_photos
  FOR SELECT
  USING (true);

-- Allow session admins to delete photos
CREATE POLICY "Session admins can delete client photos"
  ON public.client_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.session_properties sp
      JOIN public.showing_sessions ss ON ss.id = sp.session_id
      WHERE sp.id = client_photos.session_property_id
      AND ss.admin_id = auth.uid()
    )
  );

-- Create storage bucket for client photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client photos bucket
CREATE POLICY "Anyone can upload client photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'client-photos');

CREATE POLICY "Anyone can view client photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'client-photos');

CREATE POLICY "Authenticated users can delete their client photos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'client-photos' AND auth.role() = 'authenticated');