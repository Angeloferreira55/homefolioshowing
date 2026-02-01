-- Add agent notes, summary, and description fields to session_properties
ALTER TABLE public.session_properties 
ADD COLUMN IF NOT EXISTS agent_notes TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;