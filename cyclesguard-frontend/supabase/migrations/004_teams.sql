-- Sprint 4: Team tenancy — trainers only see their roster (never raw cycle data)
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    club_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('player', 'trainer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Members can see teams they belong to
CREATE POLICY "members_select_own_teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
        )
    );

-- Members can see roster of their teams (metadata only — no cycle join)
CREATE POLICY "members_select_team_roster" ON public.team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members me
            WHERE me.team_id = team_members.team_id AND me.user_id = auth.uid()
        )
    );

-- Trainers can insert player memberships into their teams
CREATE POLICY "trainer_insert_player_membership" ON public.team_members
    FOR INSERT WITH CHECK (
        role = 'player'
        AND EXISTS (
            SELECT 1 FROM public.team_members me
            WHERE me.team_id = team_members.team_id
              AND me.user_id = auth.uid()
              AND me.role = 'trainer'
        )
    );

COMMENT ON TABLE public.teams IS 'Club teams for roster scoping. Cycle data never joins here for trainers.';
COMMENT ON TABLE public.team_members IS 'Team roster. Trainers see membership only; cycle_logs remain RLS-denied.';
