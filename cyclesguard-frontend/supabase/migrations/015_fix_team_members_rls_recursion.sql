-- Fix infinite recursion in team_members RLS
-- (SELECT/INSERT policies previously queried team_members inside their own USING/WITH CHECK)

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_trainer(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND role = 'trainer'
  );
$$;

REVOKE ALL ON FUNCTION public.is_team_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO authenticated, anon;
REVOKE ALL ON FUNCTION public.is_team_trainer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_team_trainer(uuid) TO authenticated, anon;

DROP POLICY IF EXISTS "members_select_team_roster" ON public.team_members;
CREATE POLICY "members_select_team_roster" ON public.team_members
  FOR SELECT
  USING (public.is_team_member(team_id));

DROP POLICY IF EXISTS "trainer_insert_player_membership" ON public.team_members;
CREATE POLICY "trainer_insert_player_membership" ON public.team_members
  FOR INSERT
  WITH CHECK (
    role = 'player'
    AND public.is_team_trainer(team_id)
  );

COMMENT ON FUNCTION public.is_team_member(uuid) IS
  'SECURITY DEFINER helper to avoid RLS recursion when checking team membership';
COMMENT ON FUNCTION public.is_team_trainer(uuid) IS
  'SECURITY DEFINER helper to avoid RLS recursion when checking trainer role on a team';
