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
  Bell,
  Lock,
  Unlock,
  ClipboardList,
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import PilotFeedbackCapture from '@/components/PilotFeedbackCapture';
import {
  getStatusColor,
  getStatusLabel,
  getLoadLabel,
  ReadinessStatus,
  LoadFlag,
  ReadinessTrend7d,
} from '@/lib/trainer-status';
import {
  buildGroupedAmpelShareText,
  buildSessionStationsText,
  clearSessionFreeze,
  readSessionFreeze,
  writeSessionFreeze,
} from '@/lib/kabine-pack';
import {
  clearTeamSessionWindow,
  isWithinPreSessionWindow,
  minutesUntilSession,
  parseSessionTime,
  readTeamSessionWindow,
  writeTeamSessionWindow,
  type TeamSessionWindow,
} from '@/lib/session-window';
import {
  buildInvitePendingPack,
  buildPlayerSharePack,
  buildStaffSharePack,
} from '@/lib/soft-pilot-pack';
import { buildKabineDay1Checklist, resolveKabineDay1State } from '@/lib/kabine-day1';
import { berlinDate } from '@/lib/date';

interface TeamMember {
  playerId: string;
  name: string;
  status: ReadinessStatus;
  loadFlag: LoadFlag;
  recommendation: string;
  loggedToday: boolean;
  daysSinceLog: number | null;
  invitePending: boolean;
  hasPush: boolean;
}

interface TeamOption {
  id: string;
  name: string;
  clubName: string | null;
}

type FilterMode = 'all' | 'needs_attention' | 'missing_today' | 'logged_today' | 'invite_pending';

function logAgeLabel(m: Pick<TeamMember, 'loggedToday' | 'daysSinceLog'>): string {
  if (m.loggedToday) return 'heute geloggt';
  if (m.daysSinceLog == null) return 'nie geloggt';
  if (m.daysSinceLog === 1) return 'vor 1 Tag';
  return `vor ${m.daysSinceLog} Tagen`;
}

const EMPTY_TREND: ReadinessTrend7d = {
  FIT: 0,
  MODIFIED_TRAINING: 0,
  REST: 0,
  NO_DATA: 0,
  playerDays: 0,
};

export default function TrainerDashboardPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [trend7d, setTrend7d] = useState<ReadinessTrend7d>(EMPTY_TREND);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [resendId, setResendId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [showOnboardHint, setShowOnboardHint] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState(false);
  const [frozenTeam, setFrozenTeam] = useState<TeamMember[] | null>(null);
  const [frozenTrend, setFrozenTrend] = useState<ReadinessTrend7d | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState<string | null>(null);
  const [nudgeError, setNudgeError] = useState<string | null>(null);
  const [nudgePlayerId, setNudgePlayerId] = useState<string | null>(null);
  const [sessionWindow, setSessionWindow] = useState<TeamSessionWindow | null>(null);
  const [sessionTimeInput, setSessionTimeInput] = useState('18:00');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [bulkResendLoading, setBulkResendLoading] = useState(false);

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
      const body = await response.json();
      if (Array.isArray(body)) {
        setTeam(
          (body as TeamMember[]).map((m) => ({
            ...m,
            hasPush: Boolean(m.hasPush),
          }))
        );
        setTrend7d(EMPTY_TREND);
      } else {
        const data = body as { players?: TeamMember[]; trend7d?: ReadinessTrend7d };
        setTeam(
          (data.players ?? []).map((m) => ({
            ...m,
            hasPush: Boolean(m.hasPush),
          }))
        );
        setTrend7d(data.trend7d ?? EMPTY_TREND);
      }
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
    if (!selectedTeamId) {
      setSessionMode(false);
      setFrozenTeam(null);
      setFrozenTrend(null);
      setSessionWindow(null);
      return;
    }
    const snap = readSessionFreeze<TeamMember, ReadinessTrend7d>(selectedTeamId);
    if (snap) {
      setFrozenTeam(snap.team);
      setFrozenTrend(snap.trend7d);
      setSessionMode(true);
    } else {
      setSessionMode(false);
      setFrozenTeam(null);
      setFrozenTrend(null);
    }
    const win = readTeamSessionWindow(selectedTeamId);
    setSessionWindow(win);
    if (win) setSessionTimeInput(win.time);
  }, [selectedTeamId]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
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
        typeof body.message === 'string'
          ? body.message
          : body.mode === 'roster_add'
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

  const resendInvite = async (playerId: string) => {
    if (!selectedTeamId) return;
    setResendId(playerId);
    setInviteMsg(null);
    setInviteError(null);
    try {
      const response = await fetch('/api/trainer/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamId, playerId, resend: true }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setInviteError(typeof body.error === 'string' ? body.error : 'Erneutes Senden fehlgeschlagen.');
        return;
      }
      setInviteMsg(typeof body.message === 'string' ? body.message : 'Einladung erneut gesendet.');
    } catch {
      setInviteError('Netzwerkfehler — bitte erneut versuchen.');
    } finally {
      setResendId(null);
    }
  };

  const removePlayer = async (playerId: string) => {
    if (!selectedTeamId) return;
    if (pendingRemoveId !== playerId) {
      setPendingRemoveId(playerId);
      setInviteMsg(null);
      setInviteError(null);
      return;
    }
    setPendingRemoveId(null);
    try {
      const response = await fetch('/api/trainer/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamId, userId: playerId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setInviteError(typeof body.error === 'string' ? body.error : 'Entfernen fehlgeschlagen.');
        return;
      }
      setInviteMsg('Spielerin aus dem Roster entfernt.');
      await loadTeamStatus(selectedTeamId);
    } catch {
      setInviteError('Netzwerkfehler — bitte erneut versuchen.');
    }
  };

  const displayTeam = sessionMode && frozenTeam ? frozenTeam : team;
  const displayTrend = sessionMode && frozenTrend ? frozenTrend : trend7d;

  const statusCounts = displayTeam.reduce(
    (acc, member) => {
      acc[member.status] = (acc[member.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ReadinessStatus, number>
  );

  const loggedTodayCount = displayTeam.filter((m) => m.loggedToday).length;
  const missingTodayCount = displayTeam.length - loggedTodayCount;
  const nudgeableMissingIds = displayTeam
    .filter((m) => !m.loggedToday && !m.invitePending)
    .map((m) => m.playerId);
  const pushCoverageCount = displayTeam.filter((m) => m.hasPush).length;
  const missingWithoutPush = displayTeam.filter(
    (m) => !m.loggedToday && !m.invitePending && !m.hasPush
  ).length;
  const invitePendingMembers = displayTeam.filter((m) => m.invitePending);
  const invitePendingCount = invitePendingMembers.length;

  const day1State = resolveKabineDay1State({
    teamCount: teams.length,
    rosterCount: displayTeam.length,
    invitePendingCount,
    loggedTodayCount,
  });
  const day1Checklist = buildKabineDay1Checklist({
    state: day1State,
    hasSessionWindow: Boolean(sessionWindow),
    sessionMode,
  });

  const filtered = useMemo(() => {
    switch (filter) {
      case 'needs_attention':
        return displayTeam.filter(
          (m) => m.status === 'REST' || m.status === 'MODIFIED_TRAINING' || m.status === 'NO_DATA'
        );
      case 'missing_today':
        return displayTeam.filter((m) => !m.loggedToday);
      case 'logged_today':
        return displayTeam.filter((m) => m.loggedToday);
      case 'invite_pending':
        return displayTeam.filter((m) => m.invitePending);
      default:
        return displayTeam;
    }
  }, [displayTeam, filter]);

  const printGroups = useMemo(() => {
    const order: ReadinessStatus[] = ['REST', 'MODIFIED_TRAINING', 'NO_DATA', 'FIT'];
    return order
      .map((status) => ({
        status,
        members: filtered.filter((m) => m.status === status),
      }))
      .filter((g) => g.members.length > 0);
  }, [filtered]);

  const toggleSessionMode = () => {
    if (sessionMode) {
      setSessionMode(false);
      setFrozenTeam(null);
      setFrozenTrend(null);
      clearSessionFreeze();
      return;
    }
    setFrozenTeam(team);
    setFrozenTrend(trend7d);
    setSessionMode(true);
    if (selectedTeamId) {
      writeSessionFreeze({
        teamId: selectedTeamId,
        frozenAt: new Date().toISOString(),
        team,
        trend7d,
      });
    }
  };

  const sendNudge = async (playerIds?: string[]) => {
    setNudgeLoading(true);
    setNudgeMsg(null);
    setNudgeError(null);
    try {
      const response = await fetch('/api/trainer/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId || undefined,
          playerIds: playerIds && playerIds.length > 0 ? playerIds : undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNudgeError(typeof body.error === 'string' ? body.error : 'Erinnerung fehlgeschlagen.');
        return;
      }
      const sent = typeof body.sent === 'number' ? body.sent : 0;
      const noSub = typeof body.skippedNoSub === 'number' ? body.skippedNoSub : 0;
      const logged = typeof body.skippedAlreadyLogged === 'number' ? body.skippedAlreadyLogged : 0;
      setNudgeMsg(
        `Erinnerung gesendet: ${sent}` +
          (noSub ? ` · ohne Push: ${noSub}` : '') +
          (logged ? ` · schon geloggt: ${logged}` : '')
      );
    } catch {
      setNudgeError('Netzwerkfehler — bitte erneut versuchen.');
    } finally {
      setNudgeLoading(false);
      setNudgePlayerId(null);
    }
  };

  const shareRoster = async () => {
    const teamName = teams.find((t) => t.id === selectedTeamId)?.name ?? 'Team';
    const text = buildGroupedAmpelShareText({
      teamName,
      members: filtered,
      loggedTodayCount: filtered.filter((m) => m.loggedToday).length,
      sessionMode,
    });

    setShareMsg(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `CyclesGuard · ${teamName}`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareMsg('Ampel-Gruppen in Zwischenablage kopiert.');
    } catch {
      setShareMsg('Teilen abgebrochen oder nicht verfügbar.');
    }
  };

  const copyEinheitsblatt = async () => {
    const teamName = teams.find((t) => t.id === selectedTeamId)?.name ?? 'Team';
    const text = buildSessionStationsText({
      teamName,
      members: displayTeam,
      sessionMode,
    });
    setShareMsg(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `Einheitsblatt · ${teamName}`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareMsg('Einheitsblatt (Stationen) kopiert.');
    } catch {
      setShareMsg('Kopieren abgebrochen oder nicht verfügbar.');
    }
  };

  const saveSessionWindow = () => {
    if (!selectedTeamId) return;
    if (!parseSessionTime(sessionTimeInput)) {
      setShareMsg('Uhrzeit als HH:MM eingeben (z. B. 18:00).');
      return;
    }
    const win: TeamSessionWindow = {
      time: sessionTimeInput.trim(),
      date: berlinDate(),
    };
    writeTeamSessionWindow(selectedTeamId, win);
    setSessionWindow(win);
    setShareMsg(`Einheit heute ${win.time} gesetzt.`);
  };

  const clearSessionWindowUi = () => {
    if (!selectedTeamId) return;
    clearTeamSessionWindow(selectedTeamId);
    setSessionWindow(null);
    setShareMsg('Einheit-Fenster entfernt.');
  };

  const copyPlayerPack = async () => {
    setShareMsg(null);
    try {
      await navigator.clipboard.writeText(buildPlayerSharePack());
      setShareMsg('Spielerinnen-Pack in Zwischenablage.');
    } catch {
      setShareMsg('Kopieren fehlgeschlagen.');
    }
  };

  const copyStaffPack = async () => {
    setShareMsg(null);
    try {
      await navigator.clipboard.writeText(
        buildStaffSharePack({
          clubLabel: teams.find((t) => t.id === selectedTeamId)?.clubName ?? undefined,
        })
      );
      setShareMsg('Stab-Pack in Zwischenablage.');
    } catch {
      setShareMsg('Kopieren fehlgeschlagen.');
    }
  };

  const copyInvitePending = async () => {
    setShareMsg(null);
    try {
      await navigator.clipboard.writeText(
        buildInvitePendingPack({ names: invitePendingMembers.map((m) => m.name) })
      );
      setShareMsg('Offene Einladungen kopiert.');
    } catch {
      setShareMsg('Kopieren fehlgeschlagen.');
    }
  };

  const bulkResendInvites = async () => {
    if (!selectedTeamId || invitePendingMembers.length === 0) return;
    setBulkResendLoading(true);
    setInviteMsg(null);
    setInviteError(null);
    let ok = 0;
    let fail = 0;
    for (const m of invitePendingMembers) {
      try {
        const response = await fetch('/api/trainer/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: selectedTeamId, playerId: m.playerId, resend: true }),
        });
        if (response.ok) ok += 1;
        else fail += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkResendLoading(false);
    setInviteMsg(
      `Einladungen erneut: ${ok} gesendet` + (fail ? ` · ${fail} fehlgeschlagen` : '')
    );
  };

  const now = new Date(nowTick);
  const minsToUnit =
    sessionWindow != null ? minutesUntilSession(sessionWindow, now) : null;
  const preSessionHot =
    sessionWindow != null && isWithinPreSessionWindow(sessionWindow, now);

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
              disabled={displayTeam.length === 0}
              className="flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm disabled:opacity-40"
            >
              <Share2 className="w-4 h-4" />
              Teilen
            </button>
            <button
              type="button"
              onClick={() => void copyEinheitsblatt()}
              disabled={displayTeam.length === 0}
              className="flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm disabled:opacity-40"
              title="Stationsplan für die Einheit"
            >
              <ClipboardList className="w-4 h-4" />
              Einheitsblatt
            </button>
            <button
              type="button"
              onClick={toggleSessionMode}
              disabled={team.length === 0 && !sessionMode}
              className={`flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl border text-sm disabled:opacity-40 ${
                sessionMode
                  ? 'bg-sage/15 border-sage/40 text-sage'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              title="Ampel für die Einheit einfrieren"
            >
              {sessionMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {sessionMode ? 'Session an' : 'Session'}
            </button>
            <button
              onClick={() => loadTeamStatus(selectedTeamId || undefined)}
              disabled={isLoading || sessionMode}
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
            {new Date().toLocaleString('de-DE')}
            {sessionMode ? ' · Session-Freeze' : ''} · Nur Ampel-Signale, keine Gesundheitsrohdaten
          </p>
          <p className="text-sm mt-1">
            Geloggt heute: {loggedTodayCount}/{displayTeam.length}
            {displayTeam.length > 0
              ? ` · Push: ${pushCoverageCount}/${displayTeam.length}`
              : ''}
          </p>
        </div>

        {shareMsg && (
          <p className="text-sm text-cream/60 print:hidden">{shareMsg}</p>
        )}

        {selectedTeamId && (
          <section
            className={`glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 print:hidden ${
              preSessionHot ? 'border border-rose-gold/35 bg-rose-gold/5' : 'border border-white/10'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Einheit-Log-Fenster</p>
              <p className="text-xs text-cream/45 mt-0.5">
                {sessionWindow
                  ? `Heute ${sessionWindow.time}${
                      minsToUnit != null
                        ? minsToUnit >= 0
                          ? ` · in ${minsToUnit} Min`
                          : ` · seit ${Math.abs(minsToUnit)} Min`
                        : ''
                    } · ${missingTodayCount} ohne Log`
                  : 'Uhrzeit setzen — 90 Min vorher Fehlende erinnern hervorheben.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="time"
                value={sessionTimeInput}
                onChange={(e) => setSessionTimeInput(e.target.value)}
                className="min-h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm"
                aria-label="Einheit Uhrzeit"
              />
              <button
                type="button"
                onClick={saveSessionWindow}
                className="min-h-11 px-3 rounded-xl bg-white/10 text-sm hover:bg-white/15"
              >
                Setzen
              </button>
              {sessionWindow && (
                <button
                  type="button"
                  onClick={clearSessionWindowUi}
                  className="min-h-11 px-3 rounded-xl bg-white/5 text-sm text-cream/50"
                >
                  Löschen
                </button>
              )}
              {preSessionHot && nudgeableMissingIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => void sendNudge(nudgeableMissingIds)}
                  disabled={nudgeLoading || sessionMode}
                  className="min-h-11 px-4 rounded-xl bg-rose-gold text-navy text-sm font-medium disabled:opacity-40"
                >
                  {nudgeLoading ? 'Sende…' : 'Fehlende erinnern'}
                </button>
              )}
            </div>
          </section>
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
          <div className="glass-card p-8 border border-ovulation/30 bg-ovulation/10 print:hidden text-center space-y-3">
            <Users className="w-10 h-10 text-cream/40 mx-auto" />
            <p className="text-cream/85 font-medium">Noch kein Team zugeordnet</p>
            <p className="text-sm text-cream/60 max-w-md mx-auto leading-relaxed">
              Bitte deine Club-Admin um Zuweisung zu einem aktiven Team. Danach kannst du
              Spielerinnen per E-Mail einladen.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                href="/trainer/onboarding"
                className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-white/10 text-sm hover:bg-white/15"
              >
                Onboarding lesen
              </a>
              <button
                type="button"
                onClick={() => void copyStaffPack()}
                className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-white/10 text-sm hover:bg-white/15"
              >
                Stab-Pack kopieren
              </button>
            </div>
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

        {teams.length > 0 && (
          <section id="invite-section" className="glass-card p-5 space-y-4 print:hidden">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserPlus className="w-4 h-4 text-rose-gold" />
              Spielerin einladen
            </div>
            <p className="text-xs text-cream/45 leading-relaxed">
              Neue Konten erhalten eine E-Mail zum Passwort setzen. Noch nicht eingeloggte
              Einladungen: Status „Einladung offen“ → Button „Einladung erneut“. Vorlage für
              Spielerinnen:{' '}
              <a href="/spielerinnen-info" className="text-cream/70 hover:text-rose-gold underline-offset-2 hover:underline">
                /spielerinnen-info
              </a>
              .
            </p>
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
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => void copyPlayerPack()}
                className="min-h-10 px-3 rounded-lg bg-white/10 text-xs text-cream/80 hover:bg-white/15"
              >
                Team-Chat Pack
              </button>
              <button
                type="button"
                onClick={() => void copyStaffPack()}
                className="min-h-10 px-3 rounded-lg bg-white/10 text-xs text-cream/80 hover:bg-white/15"
              >
                Stab-Pack
              </button>
            </div>
          </section>
        )}

        {teams.length > 0 && day1State !== 'ready' && !isLoading && (
          <section className="glass-card p-5 border border-rose-gold/25 bg-rose-gold/5 space-y-3 print:hidden">
            <h2 className="font-semibold text-sm">Day-1 Aktivierung</h2>
            <p className="text-xs text-cream/55">
              Soft-Pilot Kabine schrittweise startklar — Checklist für die erste Einheit.
            </p>
            <ul className="space-y-2">
              {day1Checklist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-sm rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                >
                  <span className={item.done ? 'text-cream/45 line-through' : 'text-cream/85'}>
                    {item.label}
                  </span>
                  {item.done ? (
                    <span className="text-sage text-xs">OK</span>
                  ) : item.href?.startsWith('#') ? (
                    <button
                      type="button"
                      className="text-xs text-rose-gold"
                      onClick={() =>
                        document.getElementById(item.href!.slice(1))?.scrollIntoView({
                          behavior: 'smooth',
                        })
                      }
                    >
                      Öffnen
                    </button>
                  ) : item.href ? (
                    <a href={item.href} className="text-xs text-rose-gold">
                      Öffnen
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isLoading && displayTeam.length > 0 && (
          <>
            {sessionMode && (
              <p className="text-xs text-sage print:hidden">
                Session-Modus: Ampel eingefroren für die Einheit — Aktualisieren deaktiviert.
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="glass-card p-4 border border-white/10">
                <p className="text-xs text-cream/50 mb-1">Heute geloggt</p>
                <p className="text-2xl font-semibold">
                  {loggedTodayCount}/{displayTeam.length}
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
            {displayTeam.length > 0 && (
              <p className="text-xs text-cream/45 print:hidden">
                Push-Opt-in: {pushCoverageCount}/{displayTeam.length}
                {missingWithoutPush > 0
                  ? ` · ${missingWithoutPush} ohne Log und ohne Push (Erinnerung landet nicht)`
                  : ''}
              </p>
            )}

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

            {displayTrend.playerDays > 0 && (
              <div className="glass-card p-4 border border-white/10 space-y-2">
                <p className="text-xs text-cream/50">
                  Ampel 7 Tage · Spielerinnen-Tage (ohne Gesundheitsrohdaten)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {(['FIT', 'MODIFIED_TRAINING', 'REST', 'NO_DATA'] as ReadinessStatus[]).map(
                    (status) => (
                      <div key={status} className="flex justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                        <span className="text-cream/55 truncate">{getStatusLabel(status)}</span>
                        <span className="font-medium tabular-nums">{displayTrend[status]}</span>
                      </div>
                    )
                  )}
                </div>
                <p className="text-[11px] text-cream/35">
                  {displayTrend.NO_DATA} von {displayTrend.playerDays} Tage ohne Log
                </p>
              </div>
            )}

            {nudgeableMissingIds.length > 0 && (
              <div className="glass-card p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4 text-rose-gold" />
                    Fehlende Logs erinnern
                  </p>
                  <p className="text-xs text-cream/45 mt-1">
                    Push nur „bitte heute loggen“ — keine Ampel-/Gesundheitsdaten in der Vorschau.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void sendNudge(nudgeableMissingIds)}
                  disabled={nudgeLoading || sessionMode}
                  className="min-h-11 px-4 rounded-xl bg-rose-gold text-navy text-sm font-medium disabled:opacity-40 shrink-0"
                >
                  {nudgeLoading ? 'Sende…' : `${nudgeableMissingIds.length} erinnern`}
                </button>
              </div>
            )}

            {invitePendingCount > 0 && (
              <div className="glass-card p-4 border border-ovulation/30 bg-ovulation/10 flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {invitePendingCount} Einladung{invitePendingCount === 1 ? '' : 'en'} offen
                  </p>
                  <p className="text-xs text-cream/45 mt-1">
                    Push erreicht sie nicht — erneut senden oder WhatsApp-Pack teilen.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void copyInvitePending()}
                    className="min-h-11 px-3 rounded-xl bg-white/10 text-sm"
                  >
                    Chat kopieren
                  </button>
                  <button
                    type="button"
                    onClick={() => void bulkResendInvites()}
                    disabled={bulkResendLoading}
                    className="min-h-11 px-4 rounded-xl bg-rose-gold text-navy text-sm font-medium disabled:opacity-40"
                  >
                    {bulkResendLoading ? 'Sende…' : 'Alle erneut'}
                  </button>
                </div>
              </div>
            )}
            {nudgeMsg && <p className="text-sm text-sage print:hidden">{nudgeMsg}</p>}
            {nudgeError && <p className="text-sm text-menstrual print:hidden">{nudgeError}</p>}

            <div className="flex flex-wrap gap-2 print:hidden">
              {(
                [
                  ['all', 'Alle'],
                  ['needs_attention', 'Handlungsbedarf'],
                  ['missing_today', 'Heute fehlend'],
                  ['logged_today', 'Heute da'],
                  ['invite_pending', 'Einladung offen'],
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
        ) : displayTeam.length === 0 ? (
          <div className="glass-card p-12 text-center print:hidden">
            <Users className="w-10 h-10 text-cream/30 mx-auto mb-4" />
            {teams.length === 0 ? (
              <>
                <p className="text-cream/60 mb-2">Ampel erscheint nach Team-Zuweisung.</p>
                <p className="text-sm text-cream/40">Club-Admin legt das Team an und weist dich zu.</p>
              </>
            ) : (
              <>
                <p className="text-cream/60 mb-2">Keine Spielerinnen im Team.</p>
                <p className="text-sm text-cream/40 mb-4 leading-relaxed max-w-md mx-auto">
                  Oben einladen → sie setzt Passwort → Consent → erster Log. Info-Vorlage zum Teilen:{' '}
                  <a
                    href="/spielerinnen-info"
                    className="text-rose-gold hover:underline underline-offset-2"
                  >
                    /spielerinnen-info
                  </a>
                </p>
                <a
                  href="#invite"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('invite-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex min-h-11 px-5 items-center rounded-xl bg-rose-gold text-navy text-sm font-medium"
                >
                  Zur Einladung
                </a>
              </>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-8 text-center text-cream/60 text-sm">
            Keine Einträge für diesen Filter.
          </div>
        ) : (
          <div className="space-y-6">
            {printGroups.map((group) => (
              <div key={group.status} className="space-y-3">
                <h2 className="text-sm font-medium text-cream/55 print:text-black print:mt-4">
                  {getStatusLabel(group.status)} ({group.members.length})
                </h2>
                {group.members.map((member) => {
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
                        {getStatusLabel(member.status)}
                        {member.loadFlag !== 'UNKNOWN'
                          ? ` · ${getLoadLabel(member.loadFlag)}`
                          : ''}
                        {` · ${logAgeLabel(member)}`}
                        {member.invitePending ? ' · Einladung offen' : ''}
                        {!member.hasPush && !member.invitePending ? ' · ohne Push' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    <p className="text-sm text-cream/80 md:text-right md:max-w-sm">
                      {member.recommendation}
                    </p>
                    <div className="flex flex-wrap gap-2 print:hidden shrink-0">
                      {!member.loggedToday && !member.invitePending && (
                        <button
                          type="button"
                          onClick={() => {
                            setNudgePlayerId(member.playerId);
                            void sendNudge([member.playerId]);
                          }}
                          disabled={nudgeLoading || sessionMode}
                          className="min-h-11 px-3 rounded-lg bg-white/10 text-xs sm:text-sm text-cream/80 hover:bg-white/15 disabled:opacity-50"
                          title={member.hasPush ? undefined : 'Kein Push — Erinnerung landet nicht'}
                        >
                          {nudgePlayerId === member.playerId && nudgeLoading
                            ? 'Sende…'
                            : member.hasPush
                              ? 'Erinnern'
                              : 'Erinnern (kein Push)'}
                        </button>
                      )}
                      {member.invitePending && (
                        <button
                          type="button"
                          onClick={() => void resendInvite(member.playerId)}
                          disabled={resendId === member.playerId}
                          className="min-h-11 px-3 rounded-lg bg-white/10 text-xs sm:text-sm text-cream/80 hover:bg-white/15 disabled:opacity-50"
                        >
                          {resendId === member.playerId ? 'Sende…' : 'Einladung erneut'}
                        </button>
                      )}
                      {pendingRemoveId === member.playerId && (
                        <button
                          type="button"
                          onClick={() => setPendingRemoveId(null)}
                          className="min-h-11 px-3 rounded-lg bg-white/10 text-xs sm:text-sm"
                        >
                          Abbrechen
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void removePlayer(member.playerId)}
                        className="min-h-11 px-3 rounded-lg bg-menstrual/15 text-menstrual text-xs sm:text-sm disabled:opacity-50"
                      >
                        {pendingRemoveId === member.playerId ? 'Endgültig entfernen' : 'Entfernen'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
              </div>
            ))}
          </div>
        )}

        <PilotFeedbackCapture
          context="trainer_dashboard"
          enabled={!isLoading && displayTeam.length > 0}
        />

        <p className="text-center text-xs text-cream/30 pt-4 print:hidden">
          Dieses Dashboard zeigt ausschließlich aggregierte Readiness-Signale.
          Medizinische Rohdaten sind nicht einsehbar (DOSB-konform).{' '}
          <a
            href="mailto:cyclesguard@proton.me?subject=CyclesGuard%20Trainer%20Support"
            className="text-cream/45 hover:text-rose-gold underline-offset-2 hover:underline"
          >
            Support
          </a>
        </p>
      </div>
    </div>
  );
}
