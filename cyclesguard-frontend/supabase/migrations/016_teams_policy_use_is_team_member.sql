-- Align teams SELECT policy with SECURITY DEFINER helper
DROP POLICY IF EXISTS "members_select_own_teams" ON public.teams;
CREATE POLICY "members_select_own_teams" ON public.teams
  FOR SELECT
  USING (public.is_team_member(id));
