'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, Users, Link2, UserMinus } from 'lucide-react';
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

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [name, setName] = useState('');
  const [clubName, setClubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [linkUserId, setLinkUserId] = useState('');
  const [linkProvider, setLinkProvider] = useState('catapult');
  const [linkExternalId, setLinkExternalId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState<'player' | 'trainer'>('trainer');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/teams');
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as TeamRow[];
      setTeams(data);
      if (data.length > 0 && !selectedTeamId) setSelectedTeamId(data[0].id);
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
    const res = await fetch('/api/admin/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeamId, userId }),
    });
    if (res.ok) await loadMembers(selectedTeamId);
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

  return (
    <div className="min-h-screen py-10 px-4 animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sage text-sm mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Club Admin · Keine Gesundheitsdaten einsehbar</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-gradient mb-2">Teams</h1>
            <p className="text-cream/70">
              Roster & Logging-Quote — ohne Phasen, Symptome oder medizinische Rohdaten.
            </p>
          </div>
          <LogoutButton className="self-start" />
        </header>

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
              <h3 className="text-sm font-medium">Trainer / Mitglied zuweisen</h3>
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
                Athlete-Link (Wearable)
              </h3>
              <div className="grid md:grid-cols-4 gap-3">
                <input
                  value={linkUserId}
                  onChange={(e) => setLinkUserId(e.target.value)}
                  placeholder="User-ID"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 font-mono text-sm"
                />
                <input
                  value={linkProvider}
                  onChange={(e) => setLinkProvider(e.target.value)}
                  placeholder="Provider"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                />
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
                Ohne laufende Ingestion wird der Link in Supabase gespeichert; Sync warnt nur in den Logs.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
