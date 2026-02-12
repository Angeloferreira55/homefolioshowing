
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-voice', 'ai-voice', true);

CREATE POLICY "Authenticated users can upload ai-voice files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ai-voice' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can read ai-voice files"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-voice');
