-- Auto-grant 30-day Pro trial to every new user on signup
CREATE OR REPLACE FUNCTION public.grant_pro_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO beta_redemptions (user_id, beta_code_id, trial_ends_at, tier)
  VALUES (
    NEW.user_id,
    (SELECT id FROM beta_codes WHERE code = 'FULLACCESS14' LIMIT 1),
    '2099-12-31T23:59:59Z'::timestamptz,
    'pro'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_pro_trial
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION grant_pro_trial();
