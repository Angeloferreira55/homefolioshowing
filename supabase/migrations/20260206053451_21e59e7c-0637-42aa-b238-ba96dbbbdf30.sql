-- Create table to track async MLS parsing jobs
CREATE TABLE public.mls_parsing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  progress INTEGER NOT NULL DEFAULT 0,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mls_parsing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own parsing jobs"
ON public.mls_parsing_jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can create their own parsing jobs"
ON public.mls_parsing_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_mls_parsing_jobs_updated_at
BEFORE UPDATE ON public.mls_parsing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for polling
ALTER PUBLICATION supabase_realtime ADD TABLE public.mls_parsing_jobs;