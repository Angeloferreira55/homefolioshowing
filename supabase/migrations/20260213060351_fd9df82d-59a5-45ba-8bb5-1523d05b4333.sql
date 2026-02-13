-- Fix search_path on update_managed_agents_updated_at
CREATE OR REPLACE FUNCTION public.update_managed_agents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;