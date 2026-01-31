-- Fix legacy showing sessions created with profiles.id stored in showing_sessions.admin_id
-- If admin_id matches a profiles.id, replace it with that profile's user_id
UPDATE public.showing_sessions AS ss
SET admin_id = p.user_id
FROM public.profiles AS p
WHERE ss.admin_id = p.id
  AND ss.admin_id <> p.user_id;
