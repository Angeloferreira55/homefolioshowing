-- Add showing_time column to session_properties table
ALTER TABLE public.session_properties 
ADD COLUMN showing_time time without time zone;