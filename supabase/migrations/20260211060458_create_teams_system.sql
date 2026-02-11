-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team owner and members can view their team
CREATE POLICY "Team members can view their team"
  ON public.teams FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.team_id = teams.id
    )
  );

-- Only team owner can update team
CREATE POLICY "Team owner can update team"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Add team_id and role to profiles
ALTER TABLE public.profiles
  ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN role text DEFAULT 'member' CHECK (role IN ('admin', 'team_leader', 'member'));

-- Create index for better query performance
CREATE INDEX idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);

-- Function to get team member count
CREATE OR REPLACE FUNCTION public.get_team_member_count(p_team_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM profiles
  WHERE team_id = p_team_id;
$$;

-- Function to check if user can add team members
CREATE OR REPLACE FUNCTION public.can_add_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_team teams%ROWTYPE;
  v_current_count integer;
BEGIN
  -- Get team info
  SELECT * INTO v_team FROM teams WHERE id = p_team_id;
  IF v_team IS NULL THEN
    RETURN false;
  END IF;

  -- Check if caller is team owner
  IF v_team.owner_id != auth.uid() THEN
    RETURN false;
  END IF;

  -- Get current member count
  v_current_count := get_team_member_count(p_team_id);

  -- Check if under limit
  RETURN v_current_count < v_team.max_members;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_teams_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();
