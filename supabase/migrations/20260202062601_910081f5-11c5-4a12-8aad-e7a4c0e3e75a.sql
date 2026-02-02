-- Create analytics_events table to track all engagement
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  session_id UUID REFERENCES public.showing_sessions(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.session_properties(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_analytics_events_admin_id ON public.analytics_events(admin_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Admins can view their own analytics
CREATE POLICY "Admins can view their own analytics"
ON public.analytics_events
FOR SELECT
USING (admin_id = auth.uid());

-- Anyone can insert analytics (for public tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Create a function to get the admin_id from a session
CREATE OR REPLACE FUNCTION public.get_admin_id_from_session(p_session_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT admin_id FROM public.showing_sessions WHERE id = p_session_id LIMIT 1;
$$;