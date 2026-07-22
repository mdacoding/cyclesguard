'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  UserPlus,
  Printer,
  HelpCircle,
  Share2,
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import PilotFeedbackCapture from '@/components/PilotFeedbackCapture';
import {
  getStatusColor,
  getStatusLabel,
  getLoadLabel,
  ReadinessStatus,
  LoadFlag,
} from '@/lib/trainer-status';

interface TeamMember {
  playerId: string;
  name: string;
  status: ReadinessStatus;
  loadFlag: LoadFlag;
  recommendation: string;
  loggedToday: boolean;
}

interface TeamOption {
  id: string;
  name: string;
  clubName: string | null;
}

type FilterMode = 'all' | 'needs_attention' | 'missing_today' | 'logged_today';

export default function TrainerDashboardPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [showOnboardHint, setShowOnboardHint] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const loadTeams = async () => {
    const response = await fetch('/api/trainer/teams');
    if (!response.ok) return;
    const data = (await response.json()) as TeamOption[];
    setTeams(data);
    if (data.length > 0 && !selectedTeamId) {
      setSelectedTeamId(data[0].id);
    }
  };

  const loadTeamStatus = async (teamId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = teamId ? `?teamId=${teamId}` : '';
      const response = await fetch(`/api/trainer/team-status${qs}`);
      if (!response.ok) throw new Error('Failed to load team status');
      setTeam((await response.json()) as TeamMember[]);
    } catch {
      setError('Team-Status konnte nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
    try {
      setShowOnboardHint(localStorage.getItem('cg_trainer_onboarded') !== '1');
    } catch {
      setShowOnboardHint(true);
    }
  }, []);

  useEffect(() => {
    if (selectedTeamId) void loadTeamStatus(selectedTeamId);
    else void loadTeamStatus();
  }, [selectedTeamId]);

  const handleInvite = async () => {
    if (!selectedTeamId || !inviteEmail) return;
    setInviteLoading(true);
    setInviteMsg(null);
    setInviteError(null);
    try {
      const response = await fetch('/api/trainer/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          teamId: selectedTeamId,
          fullName: inviteName.trim() || undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          typeof body.error === 'string'
            ? body.error
            : 'Einladung fehlgeschlagen.';
        if (response.status === 403) {
          setInviteError('Kein Zugriff auf dieses Team.');
        } else {
          setInviteError(msg === 'Invite failed' ? 'Einladung fehlgeschlagen — E-Mail prüfen.' : msg);
        }
        return;
      }
      const label = inviteName.trim() || inviteEmail;
      setInviteMsg(
        body.mode === 'roster_add'
          ? `${label} war bereits registriert und wurde dem Roster hinzugefügt.`
          : `${label} wurde eingeladen (E-Mail) und dem Roster hinzugefügt.`
      );
      setInviteEmail('');
      setInviteName('');
      await loadTeamStatus(selectedTeamId);
    } catch {
      setInviteError('Netzwerkfehler — bitte erneut versuchen.');
    } finally {
      setInviteLoading(false);
    }
  };

  const statusCounts = team.reduce(
    (acc, member) => {
      acc[member.status] = (acc[member.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ReadinessStatus, number>
  );

  const loggedTodayCount = team.filter((m) => m.loggedToday).length;
  const missingTodayCount = team.length - loggedTodayCount;

  const filtered = useMemo(() => {
    switch (filter) {
      case 'needs_attention':
        return team.filter(
          (m) => m.status === 'REST' || m.status === 'MODIFIED_TRAINING' || m.status === 'NO_DATA'
        );
      case 'missing_today':
        return team.filter((m) => !m.loggedToday);
      case 'logged_today':
        return team.filter((m) => m.loggedToday);
      default:
        return team;
    }
  }, [team, filter]);

  const shareRoster = async () => {
    const teamName = teams.find((t) => t.id === selectedTeamId)?.name ?? 'Team';
    const lines = filtered.map(
      (m) =>
        `${m.name}: ${getStatusLabel(m.status)} · ${getLoadLabel(m.loadFlag)}${
          m.loggedToday ? '' : ' · heute fehlend'
        }`
    );
    const text = [
      `CyclesGuard · ${teamName}`,
      `${new Date().toLocaleString('de-DE')}`,
      `Geloggt heute: ${loggedTodayCount}/${team.length}`,
      '',
      ...lines,
      '',
      'Nur Ampel-Signale — keine Gesundheitsrohdaten.',
    ].join('\n');

    setShareMsg(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `CyclesGuard · ${teamName}`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareMsg('Roster in Zwischenablage kopiert.');
    } catch {
      setShareMsg('Teilen abgebrochen oder nicht verfügbar.');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-8 print:max-w-none">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-sage text-sm mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Readiness-Steuerung · Keine Gesundheitsdaten</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-gradient mb-2">
              Team Readiness
            </h1>
            <p className="text-cream/70">
              Kabine: Ampel für die heutige Einheit — aktualisieren, filtern, drucken.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <a
              href="/trainer/onboarding"
              className="flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              Hilfe
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
            >
              <Printer className="w-4 h-4" />
              Drucken
            </button>
            <button
              type="button"
              onClick={() => void shareRoster()}
              disabled={team.length === 0}
              className="flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm disabled:opacity-40"
            >
              <Share2 className="w-4 h-4" />
              Teilen
            </button>
            <button
              onClick={() => loadTeamStatus(selectedTeamId || undefined)}
              disabled={isLoading}
              className="flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Aktualisieren
            </button>
            <LogoutButton />
          </div>
        </header>

        <div className="hidden print:block mb-6">
          <h1 className="font-display text-2xl font-semibold">CyclesGuard · Team Readiness</h1>
          <p className="text-sm opacity-70">
            {new Date().toLocaleString('de-DE')} · Nur Ampel-Signale, keine Gesundheitsrohdaten
          </p>
        </div>

        {shareMsg && (
          <p className="text-sm text-cream/60 print:hidden">{shareMsg}</p>
        )}

        {showOnboardHint && (
          <section className="glass-card p-4 border border-rose-gold/25 bg-rose-gold/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <p className="text-sm text-cream/80">
              Neu hier? Kurzes Onboarding erklärt Ampel, Invite und Privacy.
            </p>
            <div className="flex gap-2">
              <a
                href="/trainer/onboarding"
                className="min-h-11 px-4 inline-flex items-center rounded-lg bg-rose-gold text-navy text-sm font-medium"
              >
                Starten
              </a>
              <button
                type="button"
                className="min-h-11 px-3 rounded-lg bg-white/10 text-sm"
                onClick={() => {
                  localStorage.setItem('cg_trainer_onboarded', '1');
                  setShowOnboardHint(false);
                }}
              >
                Später
              </button>
            </div>
          </section>
        )}

        {teams.length === 0 && !isLoading && (
          <div className="glass-card p-6 border border-ovulation/30 bg-ovulation/10 text-sm text-cream/80 print:hidden">
            Kein Team zugeordnet. Bitte Club-Admin um Zuweisung bitten.
          </div>
        )}

        {teams.length > 0 && (
          <div className="glass-card p-4 flex flex-col md:flex-row gap-3 md:items-center print:hidden">
            <label className="text-sm text-cream/60" htmlFor="team-select">
              Team
            </label>
            <select
              id="team-select"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 text-cream"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.clubName ? ` · ${t.clubName}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <section className="glass-card p-5 space-y-4 print:hidden">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="w-4 h-4 text-rose-gold" />
            Spielerin einladen
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Name (optional)"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="spielerin@verein.de"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
            />
            <button
              onClick={handleInvite}
              disabled={inviteLoading || !inviteEmail || !selectedTeamId}
              className="min-h-12 px-5 py-3 rounded-xl bg-rose-gold text-navy font-medium disabled:opacity-40"
            >
              {inviteLoading ? 'Sende…' : 'Einladen'}
            </button>
          </div>
          {inviteMsg && <p className="text-sm text-sage">{inviteMsg}</p>}
          {inviteError && <p className="text-sm text-menstrual">{inviteError}</p>}
        </section>

        {!isLoading && team.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="glass-card p-4 border border-white/10">
                <p className="text-xs text-cream/50 mb-1">Heute geloggt</p>
                <p className="text-2xl font-semibold">
                  {loggedTodayCount}/{team.length}
                </p>
              </div>
              <div className="glass-card p-4 border border-white/10">
                <p className="text-xs text-cream/50 mb-1">Noch offen heute</p>
                <p className="text-2xl font-semibold">{missingTodayCount}</p>
              </div>
              <div className="glass-card p-4 border border-white/10 col-span-2 md:col-span-1">
                <p className="text-xs text-cream/50 mb-1">Regeneration / Angepasst</p>
                <p className="text-2xl font-semibold">
                  {(statusCounts.REST ?? 0) + (statusCounts.MODIFIED_TRAINING ?? 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['FIT', 'MODIFIED_TRAINING', 'REST', 'NO_DATA'] as ReadinessStatus[]).map((status) => {
                const colors = getStatusColor(status);
                return (
                  <div key={status} className={`glass-card p-4 ${colors.bg} border ${colors.border}`}>
                    <p className="text-xs text-cream/50 mb-1">{getStatusLabel(status)}</p>
                    <p className="text-2xl font-semibold">{statusCounts[status] ?? 0}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              {(
                [
                  ['all', 'Alle'],
                  ['needs_attention', 'Handlungsbedarf'],
                  ['missing_today', 'Heute fehlend'],
                  ['logged_today', 'Heute da'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`min-h-11 px-4 rounded-full text-sm border transition-colors ${
                    filter === key
                      ? 'bg-rose-gold text-navy border-rose-gold'
                      : 'bg-white/5 border-white/10 text-cream/70 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="glass-card p-4 border border-menstrual/30 bg-menstrual/10 text-menstrual text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-gold" />
          </div>
        ) : team.length === 0 ? (
          <div className="glass-card p-12 text-center print:hidden">
            <Users className="w-10 h-10 text-cream/30 mx-auto mb-4" />
            <p className="text-cream/60 mb-2">Keine Spielerinnen im Team.</p>
            <p className="text-sm text-cream/40">Lade Spielerinnen oben per E-Mail ein.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-8 text-center text-cream/60 text-sm">
            Keine Einträge für diesen Filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((member) => {
              const colors = getStatusColor(member.status);
              return (
                <article
                  key={member.playerId}
                  className={`glass-card p-5 flex flex-col md:flex-row md:items-center gap-4 ${colors.bg} border ${colors.border}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full shrink-0 ${colors.dot} shadow-[0_0_12px_currentColor]`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-lg truncate">{member.name}</h2>
                      <p className="text-sm text-cream/60">
                        {getStatusLabel(member.status)} · {getLoadLabel(member.loadFlag)}
                        {member.loggedToday ? ' · heute geloggt' : ' · heute fehlend'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-cream/80 md:text-right md:max-w-sm">
                    {member.recommendation}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        <PilotFeedbackCapture
          context="trainer_dashboard"
          enabled={!isLoading && team.length > 0}
        />

        <p className="text-center text-xs text-cream/30 pt-4">
          Dieses Dashboard zeigt ausschließlich aggregierte Readiness-Signale.
          Medizinische Rohdaten sind nicht einsehbar (DOSB-konform).
        </p>
      </div>
    </div>
  );
}
