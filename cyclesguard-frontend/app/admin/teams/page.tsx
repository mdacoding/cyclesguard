'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Users,
  Link2,
  UserMinus,
  Mail,
  CalendarRange,
  Download,
  CheckCircle2,
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

interface TeamRow {
  id: string;
  name: string;
  clubName: string | null;
  playerCount: number;
  loggedLast7Days: number;
}

interface MemberRow {
  userId: string;
  role: 'player' | 'trainer';
  name: string;
  email: string | null;
  joinedAt: string;
}

interface ClubRow {
  id: string;
  name: string;
}

interface SeasonRow {
  id: string;
  clubId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: 'planned' | 'active' | 'completed';
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [name, setName] = useState('');
  const [clubName, setClubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'player' | 'trainer'>('player');
  const [inviteBusy, setInviteBusy] = useState(false);

  const [linkUserId, setLinkUserId] = useState('');
  const [linkProvider, setLinkProvider] = useState('catapult');
  const [linkExternalId, setLinkExternalId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState<'player' | 'trainer'>('trainer');

  const [seasonClubId, setSeasonClubId] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsRes, clubsRes, seasonsRes] = await Promise.all([
        fetch('/api/admin/teams'),
        fetch('/api/admin/clubs'),
        fetch('/api/admin/seasons'),
      ]);
      if (!teamsRes.ok) throw new Error('load failed');
      const data = (await teamsRes.json()) as TeamRow[];
      setTeams(data);
      if (data.length > 0 && !selectedTeamId) setSelectedTeamId(data[0].id);
      if (clubsRes.ok) {
        const clubData = (await clubsRes.json()) as ClubRow[];
        setClubs(clubData);
        if (clubData.length > 0 && !seasonClubId) setSeasonClubId(clubData[0].id);
      }
      if (seasonsRes.ok) setSeasons((await seasonsRes.json()) as SeasonRow[]);
    } catch {
      setError('Teams konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (teamId: string) => {
    if (!teamId) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/admin/members?teamId=${teamId}`);
      if (!res.ok) throw new Error('members failed');
      setMembers((await res.json()) as MemberRow[]);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTeamId) void loadMembers(selectedTeamId);
  }, [selectedTeamId]);

  const createTeam = async () => {
    setMsg(null);
    const res = await fetch('/api/admin/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, clubName: clubName || undefined }),
    });
    if (!res.ok) {
      setMsg('Team konnte nicht angelegt werden.');
      return;
    }
    setName('');
    setClubName('');
    setMsg('Team angelegt.');
    await load();
  };

  const removeMember = async (userId: string) => {
    if (!selectedTeamId) return;
    if (!window.confirm('Mitglied wirklich aus dem Roster entfernen?')) return;
    const res = await fetch('/api/admin/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeamId, userId }),
    });
    if (res.ok) {
      await loadMembers(selectedTeamId);
      await load();
    }
  };

  const inviteMember = async () => {
    if (!selectedTeamId || !inviteEmail) return;
    setInviteBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          teamId: selectedTeamId,
          fullName: inviteName.trim() || undefined,
          role: inviteRole,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setMsg(data.error ?? 'Einladung fehlgeschlagen.');
        return;
      }
      setInviteEmail('');
      setInviteName('');
      setMsg(data.message ?? 'Einladung gesendet.');
      await loadMembers(selectedTeamId);
      await load();
    } finally {
      setInviteBusy(false);
    }
  };

  const assignMember = async () => {
    if (!selectedTeamId || !assignUserId) return;
    setMsg(null);
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: selectedTeamId,
        userId: assignUserId,
        role: assignRole,
      }),
    });
    if (!res.ok) {
      setMsg('Zuweisung fehlgeschlagen — gültige User-ID prüfen.');
      return;
    }
    setAssignUserId('');
    setMsg('Mitglied zugewiesen.');
    await loadMembers(selectedTeamId);
    await load();
  };

  const saveAthleteLink = async () => {
    if (!linkUserId || !linkExternalId) return;
    setMsg(null);
    const res = await fetch('/api/admin/athlete-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: linkUserId,
        provider: linkProvider,
        externalAthleteId: linkExternalId,
        teamId: selectedTeamId || undefined,
      }),
    });
    if (!res.ok) {
      setMsg('Athlete-Link konnte nicht gespeichert werden.');
      return;
    }
    setMsg('Athlete-Link gespeichert (Ingestion-Sync falls konfiguriert).');
    setLinkExternalId('');
  };

  const createSeason = async () => {
    if (!seasonClubId || !seasonName || !seasonStart || !seasonEnd) return;
    setMsg(null);
    const res = await fetch('/api/admin/seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clubId: seasonClubId,
        name: seasonName,
        startsOn: seasonStart,
        endsOn: seasonEnd,
        status: 'planned',
      }),
    });
    if (!res.ok) {
      setMsg('Saison konnte nicht angelegt werden.');
      return;
    }
    setSeasonName('');
    setMsg('Saison angelegt.');
    await load();
  };

  const activateSeason = async (id: string) => {
    const res = await fetch('/api/admin/seasons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'active' }),
    });
    if (res.ok) {
      setMsg('Saison aktiviert.');
      await load();
    }
  };

  const statusLabel = (s: SeasonRow['status']) =>
    s === 'active' ? 'Aktiv' : s === 'completed' ? 'Abgeschlossen' : 'Geplant';

  return (
    <div className="min-h-screen py-10 px-4 animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sage text-sm mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Club Admin · Keine Gesundheitsdaten einsehbar</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-gradient mb-2">Club Product</h1>
            <p className="text-cream/70">
              Teams, Roster, Saison & Audit — ohne Phasen, Symptome oder medizinische Rohdaten.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <a
              href="/api/admin/audit?format=csv"
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
            >
              <Download className="w-4 h-4" />
              Audit CSV
            </a>
            <LogoutButton />
          </div>
        </header>

        <section className="glass-card p-5 space-y-3">
          <h2 className="font-semibold inline-flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-rose-gold" />
            Saison-Setup
          </h2>
          {clubs.length === 0 ? (
            <p className="text-sm text-cream/50">
              Kein Verein verknüpft — Saisons benötigen eine Club-Zuordnung in{' '}
              <code className="text-cream/70">club_members</code>.
            </p>
          ) : (
            <>
              <div className="grid md:grid-cols-5 gap-3">
                <select
                  value={seasonClubId}
                  onChange={(e) => setSeasonClubId(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="z. B. Saison 26/27"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 md:col-span-1"
                />
                <input
                  type="date"
                  value={seasonStart}
                  onChange={(e) => setSeasonStart(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                />
                <input
                  type="date"
                  value={seasonEnd}
                  onChange={(e) => setSeasonEnd(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                />
                <button
                  onClick={createSeason}
                  disabled={!seasonName.trim() || !seasonStart || !seasonEnd}
                  className="rounded-xl bg-rose-gold text-navy font-medium px-4 py-3 min-h-12 disabled:opacity-40"
                >
                  Anlegen
                </button>
              </div>
              {seasons.length > 0 && (
                <div className="space-y-2 pt-2">
                  {seasons.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-cream/50">
                          {s.startsOn} → {s.endsOn} · {statusLabel(s.status)}
                        </p>
                      </div>
                      {s.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() => activateSeason(s.id)}
                          className="inline-flex items-center gap-2 min-h-11 px-3 rounded-lg bg-sage/20 text-sage text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aktivieren
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="glass-card p-5 space-y-3">
          <h2 className="font-semibold">Neues Team</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Teamname"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
            />
            <input
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Verein (optional)"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
            />
            <button
              onClick={createTeam}
              disabled={!name.trim()}
              className="rounded-xl bg-rose-gold text-navy font-medium px-4 py-3 min-h-12 disabled:opacity-40"
            >
              Anlegen
            </button>
          </div>
          {msg && <p className="text-sm text-cream/60">{msg}</p>}
        </section>

        {error && (
          <div className="glass-card p-4 border border-menstrual/30 bg-menstrual/10 text-menstrual text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-rose-gold" />
          </div>
        ) : teams.length === 0 ? (
          <div className="glass-card p-12 text-center text-cream/60">
            <Users className="w-10 h-10 mx-auto mb-3 text-cream/30" />
            Noch keine Teams.
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full text-left glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border transition-colors ${
                  selectedTeamId === team.id
                    ? 'border-rose-gold/40 bg-rose-gold/5'
                    : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <div>
                  <h2 className="font-semibold text-lg">{team.name}</h2>
                  <p className="text-sm text-cream/50">{team.clubName ?? 'Ohne Vereinszuordnung'}</p>
                </div>
                <div className="text-sm text-cream/70">
                  {team.playerCount} Spielerinnen · Logging-Quote 7d:{' '}
                  <strong className="text-cream">
                    {team.playerCount === 0
                      ? '—'
                      : `${team.loggedLast7Days}/${team.playerCount}`}
                  </strong>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedTeamId && (
          <section className="glass-card p-5 space-y-5">
            <h2 className="font-semibold text-lg">Roster</h2>
            {membersLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-rose-gold" />
            ) : members.length === 0 ? (
              <p className="text-sm text-cream/50">Keine Mitglieder in diesem Team.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-cream/50">
                        {m.role === 'trainer' ? 'Trainer' : 'Spielerin'}
                        {m.email ? ` · ${m.email}` : ''}
                      </p>
                      <p className="text-[11px] text-cream/30 mt-1 font-mono">{m.userId}</p>
                    </div>
                    <button
                      onClick={() => removeMember(m.userId)}
                      className="inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-lg bg-menstrual/15 text-menstrual text-sm"
                    >
                      <UserMinus className="w-4 h-4" />
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-white/10 pt-4 space-y-3">
              <h3 className="text-sm font-medium inline-flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-gold" />
                Per E-Mail einladen
              </h3>
              <div className="grid md:grid-cols-4 gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@verein.de"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                />
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Name (optional)"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'player' | 'trainer')}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                >
                  <option value="player">Spielerin</option>
                  <option value="trainer">Trainer</option>
                </select>
                <button
                  onClick={inviteMember}
                  disabled={!inviteEmail || inviteBusy}
                  className="rounded-xl bg-rose-gold text-navy font-medium px-4 py-3 min-h-12 disabled:opacity-40 inline-flex items-center justify-center gap-2"
                >
                  {inviteBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Einladen
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <h3 className="text-sm font-medium">Per User-ID zuweisen (Fallback)</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="User-ID (UUID)"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 font-mono text-sm"
                />
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value as 'player' | 'trainer')}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                >
                  <option value="trainer">Trainer</option>
                  <option value="player">Spielerin</option>
                </select>
                <button
                  onClick={assignMember}
                  disabled={!assignUserId}
                  className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 min-h-12 disabled:opacity-40"
                >
                  Zuweisen
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <h3 className="text-sm font-medium inline-flex items-center gap-2">
                <Link2 className="w-4 h-4 text-rose-gold" />
                Athlete-Link (Wearable / GPS)
              </h3>
              <div className="grid md:grid-cols-4 gap-3">
                <input
                  value={linkUserId}
                  onChange={(e) => setLinkUserId(e.target.value)}
                  placeholder="User-ID"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 font-mono text-sm"
                />
                <select
                  value={linkProvider}
                  onChange={(e) => setLinkProvider(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                >
                  <option value="catapult">Catapult</option>
                  <option value="statsports">STATSports</option>
                  <option value="polar">Polar</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  value={linkExternalId}
                  onChange={(e) => setLinkExternalId(e.target.value)}
                  placeholder="External Athlete ID"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                />
                <button
                  onClick={saveAthleteLink}
                  disabled={!linkUserId || !linkExternalId}
                  className="rounded-xl bg-rose-gold text-navy font-medium px-4 py-3 min-h-12 disabled:opacity-40"
                >
                  Speichern
                </button>
              </div>
              <p className="text-xs text-cream/40">
                Ohne laufende Ingestion wird der Link in Supabase gespeichert; Sync warnt nur in den
                Logs. Siehe docs/pitch/INGESTION-DEPLOY.md.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
