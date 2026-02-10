
-- Table for beta invite codes
CREATE TABLE public.beta_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  trial_days integer NOT NULL DEFAULT 14,
  max_uses integer NOT NULL DEFAULT 1,
  times_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT NULL
);

ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read codes (for redemption validation)
CREATE POLICY "Anyone can read beta codes for validation"
  ON public.beta_codes FOR SELECT
  USING (true);

-- Table for tracking who redeemed codes
CREATE TABLE public.beta_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beta_code_id uuid NOT NULL REFERENCES public.beta_codes(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL,
  tier text NOT NULL DEFAULT 'pro',
  UNIQUE (user_id, beta_code_id)
);

ALTER TABLE public.beta_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
  ON public.beta_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own redemptions
CREATE POLICY "Users can redeem codes"
  ON public.beta_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to redeem a beta code atomically
CREATE OR REPLACE FUNCTION public.redeem_beta_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code_record beta_codes%ROWTYPE;
  v_existing beta_redemptions%ROWTYPE;
  v_trial_end timestamptz;
  v_redemption_id uuid;
BEGIN
  -- Find the code
  SELECT * INTO v_code_record FROM beta_codes WHERE code = upper(p_code);
  IF v_code_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid beta code');
  END IF;

  -- Check if code has expired
  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This beta code has expired');
  END IF;

  -- Check max uses
  IF v_code_record.times_used >= v_code_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'This beta code has reached its maximum uses');
  END IF;

  -- Check if user already redeemed ANY code
  SELECT * INTO v_existing FROM beta_redemptions WHERE user_id = auth.uid() LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already redeemed a beta code');
  END IF;

  -- Calculate trial end
  v_trial_end := now() + (v_code_record.trial_days || ' days')::interval;

  -- Create redemption
  INSERT INTO beta_redemptions (user_id, beta_code_id, trial_ends_at, tier)
  VALUES (auth.uid(), v_code_record.id, v_trial_end, 'pro')
  RETURNING id INTO v_redemption_id;

  -- Increment usage
  UPDATE beta_codes SET times_used = times_used + 1 WHERE id = v_code_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'trial_ends_at', v_trial_end,
    'tier', 'pro'
  );
END;
$$;
