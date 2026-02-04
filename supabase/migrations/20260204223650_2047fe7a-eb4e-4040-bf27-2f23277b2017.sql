-- Add soft delete and archive columns to showing_sessions
ALTER TABLE public.showing_sessions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_showing_sessions_deleted_at ON public.showing_sessions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_showing_sessions_archived_at ON public.showing_sessions(archived_at);

-- Create function to permanently delete old trashed sessions (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_deleted_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.showing_sessions
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create function to soft delete a session
CREATE OR REPLACE FUNCTION public.soft_delete_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.showing_sessions
  SET deleted_at = NOW()
  WHERE id = p_session_id AND admin_id = auth.uid();
END;
$$;

-- Create function to restore a session from trash
CREATE OR REPLACE FUNCTION public.restore_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.showing_sessions
  SET deleted_at = NULL
  WHERE id = p_session_id AND admin_id = auth.uid();
END;
$$;

-- Create function to archive a session
CREATE OR REPLACE FUNCTION public.archive_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.showing_sessions
  SET archived_at = NOW()
  WHERE id = p_session_id AND admin_id = auth.uid();
END;
$$;

-- Create function to unarchive a session
CREATE OR REPLACE FUNCTION public.unarchive_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.showing_sessions
  SET archived_at = NULL
  WHERE id = p_session_id AND admin_id = auth.uid();
END;
$$;