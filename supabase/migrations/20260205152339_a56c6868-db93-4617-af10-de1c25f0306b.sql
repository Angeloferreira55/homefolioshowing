-- Enable password HIBP (leaked password) check for stronger security
-- This is configured via Auth settings, not SQL migration
-- We'll address the Security Definer View warning by documenting that it's intentional

-- Add a comment explaining the SECURITY DEFINER views are intentional
COMMENT ON VIEW public.public_agent_profile IS 'Intentionally uses SECURITY DEFINER to allow public access to non-sensitive agent profile data (excludes license_number, mls_* credentials)';
COMMENT ON VIEW public.public_session_info IS 'Intentionally uses SECURITY DEFINER to allow public access to basic session metadata (excludes client contact info)';