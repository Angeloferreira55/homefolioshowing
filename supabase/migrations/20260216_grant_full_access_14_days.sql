-- Grant all existing profiles full (pro) access for 14 days
-- Creates a beta code and redeems it for every current profile

-- 1. Insert a bulk beta code with high max_uses
INSERT INTO public.beta_codes (code, trial_days, max_uses, times_used, expires_at)
VALUES ('FULLACCESS14', 14, 999999, 0, now() + interval '14 days');

-- 2. Insert a beta_redemption for every existing profile that doesn't already have one
INSERT INTO public.beta_redemptions (user_id, beta_code_id, trial_ends_at, tier)
SELECT
  p.user_id,
  bc.id,
  now() + interval '14 days',
  'pro'
FROM public.profiles p
CROSS JOIN public.beta_codes bc
WHERE bc.code = 'FULLACCESS14'
  AND NOT EXISTS (
    SELECT 1 FROM public.beta_redemptions br
    WHERE br.user_id = p.user_id
      AND br.trial_ends_at > now()
  );

-- 3. Update the beta code usage count to reflect how many were redeemed
UPDATE public.beta_codes
SET times_used = (
  SELECT count(*) FROM public.beta_redemptions br
  WHERE br.beta_code_id = (SELECT id FROM public.beta_codes WHERE code = 'FULLACCESS14')
)
WHERE code = 'FULLACCESS14';
