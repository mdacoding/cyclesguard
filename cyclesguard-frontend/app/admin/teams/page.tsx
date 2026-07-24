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
  Archive,
  Upload,
  Pencil,
  ClipboardList,
  MessageSquareHeart,
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

type AdminTab = 'roster' | 'season' | 'compliance';

interface TeamRow {
  id: string;
  name: string;
  clubName: string | null;
  status?: 'active' | 'archived';
  playerCount: number;
  loggedLast7Days: number;
  loggedToday?: number;
  trainerCount?: number;
  trainersActive7d?: number;
  adherenceSeries7d?: { day: string; logged: number; pct: number }[];
}

interface MemberRow {
  userId: string;
  role: 'player' | 'trainer';
  name: string;
  email: string | null;
  joinedAt: string;
  invitePending?: boolean;
  /** Player only: ≥1 log in last 7d (coach-safe). */
  activeLast7Days?: boolean | null;
}

interface ClubRow {
  id: string;
  name: string;
  legalName?: string | null;
  billingEmail?: string | null;
}

interface SeasonRow {
  id: string;
  clubId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: 'planned' | 'active' | 'completed';
  commercialStatus?: string;
  feeCents?: number | null;
  currency?: string;
  contractRef?: string | null;
  signedAt?: string | null;
  signedByEmail?: string | null;
  internalNotes?: string | null;
}

interface FeedbackItem {
  id: string;
  role: string;
  score: number;
  message: string | null;
  context: string | null;
  createdAt: string;
}

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: 'roster', label: 'Roster', icon: Users },
  { id: 'season', label: 'Saison', icon: CalendarRange },
  { id: 'compliance', label: 'Compliance', icon: ClipboardList },
];

export default function AdminTeamsPage() {
  const [tab, setTab] = useState<AdminTab>('roster');
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [name, setName] = useState('');
  const [clubName, setClubName] = useState('');
  const [teamClubId, setTeamClubId] = useState('');
  const [newClubName, setNewClubName] = useState('');
  const [clubCreateBusy, setClubCreateBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'player' | 'trainer'>('player');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [pendingArchive, setPendingArchive] = useState(false);
  const [resendId, setResendId] = useState<string | null>(null);

  const [linkUserId, setLinkUserId] = useState('');
  const [linkProvider, setLinkProvider] = useState('catapult');
  const [linkExternalId, setLinkExternalId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState<'player' | 'trainer'>('trainer');

  const [seasonClubId, setSeasonClubId] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [csvBusy, setCsvBusy] = useState(false);
  const [platformEmail, setPlatformEmail] = useState('');
  const [platformClubId, setPlatformClubId] = useState('');
  const [showPlatform, setShowPlatform] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [editSeasonId, setEditSeasonId] = useState<string | null>(null);
  const [editFeeEuro, setEditFeeEuro] = useState('');
  const [editContractRef, setEditContractRef] = useState('');
  const [editSignedBy, setEditSignedBy] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [contractBusy, setContractBusy] = useState(false);
  const [pendingCommercial, setPendingCommercial] = useState<{
    id: string;
    status: 'churned' | 'ended';
  } | null>(null);

  const [clubLegalName, setClubLegalName] = useState('');
  const [clubBillingEmail, setClubBillingEmail] = useState('');
  const [clubBusy, setClubBusy] = useState(false);

  const [feedbackAvg, setFeedbackAvg] = useState<number | null>(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [feedbackAvgByRole, setFeedbackAvgByRole] = useState<Record<string, number>>({});
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [opsStatus, setOpsStatus] = useState<{
    push: { ready: boolean; vapidPublicConfigured: boolean; vapidPrivateConfigured: boolean };
    cronSecretConfigured: boolean;
    sentryConfigured: boolean;
    demoMode: boolean;
    siteUrl: string | null;
    ingestionConfigured: boolean;
    checklist: { softPilotReady: boolean; observabilityReady: boolean };
  } | null>(null);
  const [opsLoading, setOpsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsRes, clubsRes, seasonsRes] = await Promise.all([
        fetch(`/api/admin/teams${showArchived ? '?includeArchived=1' : ''}`),
        fetch('/api/admin/clubs'),
        fetch('/api/admin/seasons'),
      ]);
      if (!teamsRes.ok) throw new Error('load failed');
      const data = (await teamsRes.json()) as TeamRow[];
      setTeams(data);
      if (data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data[0].id);
        setRenameValue(data[0].name);
      }
      if (clubsRes.ok) {
        const clubData = (await clubsRes.json()) as ClubRow[];
        setClubs(clubData);
        const pickId =
          seasonClubId && clubData.some((c) => c.id === seasonClubId)
            ? seasonClubId
            : clubData[0]?.id ?? '';
        if (clubData.length > 0 && !seasonClubId) setSeasonClubId(clubData[0].id);
        if (clubData.length > 0 && !teamClubId) setTeamClubId(clubData[0].id);
        if (clubData.length > 0 && !platformClubId) setPlatformClubId(clubData[0].id);
        const active = clubData.find((c) => c.id === pickId) ?? clubData[0];
        if (active) {
          setClubLegalName(active.legalName ?? '');
          setClubBillingEmail(active.billingEmail ?? '');
        }
      }
      if (seasonsRes.ok) setSeasons((await seasonsRes.json()) as SeasonRow[]);
      setShowPlatform(clubsRes.ok);
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

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/feedback');
      if (!res.ok) return;
      const data = (await res.json()) as {
        avgScore: number | null;
        count: number;
        avgByRole?: Record<string, number>;
        items: FeedbackItem[];
      };
      setFeedbackAvg(data.avgScore);
      setFeedbackCount(data.count);
      setFeedbackAvgByRole(data.avgByRole ?? {});
      setFeedbackItems(data.items);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const loadOpsStatus = async () => {
    setOpsLoading(true);
    try {
      const res = await fetch('/api/admin/ops-status');
      if (!res.ok) return;
      setOpsStatus(await res.json());
    } finally {
      setOpsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  useEffect(() => {
    if (selectedTeamId) {
      void loadMembers(selectedTeamId);
      const t = teams.find((x) => x.id === selectedTeamId);
      if (t) setRenameValue(t.name);
    }
  }, [selectedTeamId, teams]);

  useEffect(() => {
    if (tab === 'compliance') {
      void loadFeedback();
      void loadOpsStatus();
    }
  }, [tab]);

  const createTeam = async () => {
    setMsg(null);
    const res = await fetch('/api/admin/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        clubName: clubName || undefined,
        clubId: teamClubId || undefined,
      }),
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

  const createClub = async () => {
    if (!newClubName.trim()) return;
    setClubCreateBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClubName.trim() }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setMsg(
          data.error === 'Forbidden'
            ? 'Verein anlegen nur als Platform-Admin.'
            : data.error ?? 'Verein konnte nicht angelegt werden.'
        );
        return;
      }
      setNewClubName('');
      setMsg('Verein angelegt — jetzt Team zuordnen und einladen.');
      if (data.id) {
        setSeasonClubId(data.id);
        setTeamClubId(data.id);
      }
      await load();
    } finally {
      setClubCreateBusy(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!selectedTeamId) return;
    if (pendingRemoveId !== userId) {
      setPendingRemoveId(userId);
      setPendingArchive(false);
      setMsg(null);
      return;
    }
    setPendingRemoveId(null);
    const res = await fetch('/api/admin/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeamId, userId }),
    });
    if (res.ok) {
      setMsg('Mitglied entfernt.');
      await loadMembers(selectedTeamId);
      await load();
    } else {
      setMsg('Entfernen fehlgeschlagen.');
    }
  };

  const resendInvite = async (userId: string) => {
    if (!selectedTeamId) return;
    setResendId(userId);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamId, userId, resend: true }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setMsg(data.error ?? 'Erneutes Senden fehlgeschlagen.');
        return;
      }
      setMsg(data.message ?? 'Einladung erneut gesendet.');
    } finally {
      setResendId(null);
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

  const renameTeam = async () => {
    if (!selectedTeamId || !renameValue.trim()) return;
    setMsg(null);
    const res = await fetch('/api/admin/teams', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedTeamId, name: renameValue.trim() }),
    });
    if (!res.ok) {
      setMsg('Umbenennen fehlgeschlagen.');
      return;
    }
    setMsg('Team umbenannt.');
    await load();
  };

  const archiveTeam = async () => {
    if (!selectedTeamId) return;
    const team = teams.find((t) => t.id === selectedTeamId);
    const nextStatus = team?.status === 'archived' ? 'active' : 'archived';
    if (nextStatus === 'archived' && !pendingArchive) {
      setPendingArchive(true);
      setPendingRemoveId(null);
      setMsg('Nochmal tippen zum Archivieren — Team verschwindet aus der aktiven Liste.');
      return;
    }
    setPendingArchive(false);
    const res = await fetch('/api/admin/teams', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedTeamId, status: nextStatus }),
    });
    if (!res.ok) {
      setMsg(nextStatus === 'archived' ? 'Archivieren fehlgeschlagen.' : 'Reaktivieren fehlgeschlagen.');
      return;
    }
    if (nextStatus === 'archived') setSelectedTeamId('');
    setMsg(nextStatus === 'archived' ? 'Team archiviert.' : 'Team reaktiviert.');
    await load();
  };

  const setSeasonCommercial = async (id: string, commercialStatus: string) => {
    if (commercialStatus === 'churned' || commercialStatus === 'ended') {
      if (
        !pendingCommercial ||
        pendingCommercial.id !== id ||
        pendingCommercial.status !== commercialStatus
      ) {
        setPendingCommercial({ id, status: commercialStatus });
        setMsg(
          commercialStatus === 'churned'
            ? 'Nochmal „Churned“ wählen zum Bestätigen — Season als verloren markieren.'
            : 'Nochmal „Beendet“ wählen zum Bestätigen — Season abschließen.'
        );
        return;
      }
      setPendingCommercial(null);
    } else if (pendingCommercial?.id === id) {
      setPendingCommercial(null);
    }

    if (commercialStatus === 'signed' || commercialStatus === 'active_paid') {
      const season = seasons.find((s) => s.id === id);
      if (season && season.feeCents == null && !season.contractRef) {
        setMsg('Zuerst Fee oder Contract-Ref unter Details speichern — dann signed/aktiv bezahlt.');
        openContractEditor(season);
        return;
      }
    }

    const res = await fetch('/api/admin/seasons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, commercialStatus }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? 'Vertragsstatus aktualisieren fehlgeschlagen.');
      return;
    }
    setMsg('Vertragsstatus aktualisiert.');
    await load();
  };

  const openContractEditor = (s: SeasonRow) => {
    setEditSeasonId(s.id);
    setEditFeeEuro(s.feeCents != null ? String(s.feeCents / 100) : '');
    setEditContractRef(s.contractRef ?? '');
    setEditSignedBy(s.signedByEmail ?? '');
    setEditNotes(s.internalNotes ?? '');
  };

  const saveContractDetails = async () => {
    if (!editSeasonId) return;
    setContractBusy(true);
    setMsg(null);
    try {
      const feeTrim = editFeeEuro.trim();
      const feeCents =
        feeTrim === ''
          ? null
          : Math.round(Number(feeTrim.replace(',', '.')) * 100);
      if (feeCents !== null && (Number.isNaN(feeCents) || feeCents < 0)) {
        setMsg('Fee ungültig — Euro-Betrag prüfen.');
        return;
      }
      const contractRef = editContractRef.trim() || null;
      const season = seasons.find((s) => s.id === editSeasonId);
      const commercial = season?.commercialStatus ?? 'pilot_free';
      if (
        (commercial === 'signed' || commercial === 'active_paid') &&
        feeCents == null &&
        !contractRef
      ) {
        setMsg('Bei signed/aktiv bezahlt: Fee oder Contract-Ref angeben.');
        return;
      }
      const res = await fetch('/api/admin/seasons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editSeasonId,
          feeCents,
          contractRef,
          signedByEmail: editSignedBy.trim() || null,
          internalNotes: editNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg(data.error ?? 'Vertragsdetails speichern fehlgeschlagen.');
        return;
      }
      setMsg(
        season?.signedAt
          ? 'Vertragsdetails gespeichert (signiert-Datum unverändert).'
          : 'Vertragsdetails gespeichert (manuell, ohne Stripe).'
      );
      setEditSeasonId(null);
      await load();
    } finally {
      setContractBusy(false);
    }
  };

  const uploadCsv = async (file: File | null) => {
    if (!file || !selectedTeamId) return;
    setCsvBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.set('teamId', selectedTeamId);
      form.set('file', file);
      const res = await fetch('/api/admin/invite/bulk', { method: 'POST', body: form });
      const data = (await res.json()) as {
        ok?: number;
        failed?: number;
        error?: string;
        parseErrors?: string[];
      };
      if (!res.ok) {
        setMsg(data.error ?? 'CSV-Import fehlgeschlagen.');
        return;
      }
      setMsg(
        `CSV: ${data.ok ?? 0} ok, ${data.failed ?? 0} fehlgeschlagen` +
          (data.parseErrors?.length ? ` · Parse: ${data.parseErrors[0]}` : '')
      );
      await loadMembers(selectedTeamId);
      await load();
    } finally {
      setCsvBusy(false);
    }
  };

  const saveClubBilling = async () => {
    if (!seasonClubId) return;
    setClubBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/clubs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: seasonClubId,
          legalName: clubLegalName.trim() || null,
          billingEmail: clubBillingEmail.trim() || null,
        }),
      });
      if (!res.ok) {
        setMsg('Club-Billing speichern fehlgeschlagen.');
        return;
      }
      setMsg('Verein Billing/Legal aktualisiert.');
      await load();
    } finally {
      setClubBusy(false);
    }
  };

  const assignClubAdmin = async () => {
    if (!platformEmail || !platformClubId) return;
    setMsg(null);
    const res = await fetch('/api/platform/club-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: platformEmail.trim(), clubId: platformClubId }),
    });
    const data = (await res.json()) as { message?: string; error?: string };
    if (!res.ok) {
      setMsg(data.error ?? 'Club-Admin-Zuweisung fehlgeschlagen.');
      return;
    }
    setPlatformEmail('');
    setMsg(data.message ?? 'Club-Admin zugewiesen.');
  };

  const statusLabel = (s: SeasonRow['status']) =>
    s === 'active' ? 'Aktiv' : s === 'completed' ? 'Abgeschlossen' : 'Geplant';

  const totalPlayers = teams.reduce((sum, t) => sum + t.playerCount, 0);
  const loggedPlayers = teams.reduce((sum, t) => sum + t.loggedLast7Days, 0);
  const loggedTodayPlayers = teams.reduce((sum, t) => sum + (t.loggedToday ?? 0), 0);
  const adherencePct =
    totalPlayers === 0 ? 0 : Math.round((loggedPlayers / totalPlayers) * 100);
  const teamsBelowTarget = teams.filter(
    (t) => t.playerCount > 0 && t.loggedLast7Days / t.playerCount < 0.7
  ).length;
  const trainerCount = teams.reduce((sum, t) => sum + (t.trainerCount ?? 0), 0);
  const trainersActive7d = teams.reduce((sum, t) => sum + (t.trainersActive7d ?? 0), 0);

  const selectedClub = clubs.find((c) => c.id === seasonClubId);
  const clubSeasons = seasons.filter((s) => s.clubId === seasonClubId);
  const primarySeason =
    clubSeasons.find((s) => s.status === 'active') ??
    clubSeasons.find((s) => s.commercialStatus === 'quoted' || s.commercialStatus === 'signed') ??
    clubSeasons[0];
  const closingChecks = [
    {
      id: 'billing',
      label: 'Billing-E-Mail',
      ok: Boolean(selectedClub?.billingEmail?.trim() || clubBillingEmail.trim()),
    },
    {
      id: 'legal',
      label: 'Legal Name',
      ok: Boolean(selectedClub?.legalName?.trim() || clubLegalName.trim()),
    },
    {
      id: 'fee',
      label: 'Fee',
      ok: primarySeason?.feeCents != null,
    },
    {
      id: 'ref',
      label: 'Contract-Ref',
      ok: Boolean(primarySeason?.contractRef),
    },
    {
      id: 'signedBy',
      label: 'Signed-by',
      ok: Boolean(primarySeason?.signedByEmail),
    },
    {
      id: 'commercial',
      label: 'Status signed/paid',
      ok:
        primarySeason?.commercialStatus === 'signed' ||
        primarySeason?.commercialStatus === 'active_paid',
    },
  ];
  const closingReady = closingChecks.every((c) => c.ok);

  const softPilotStartChecks = [
    { id: 'club', label: 'Verein verknüpft', ok: clubs.length > 0 },
    {
      id: 'team',
      label: 'Aktives Team',
      ok: teams.some((t) => t.status !== 'archived'),
    },
    { id: 'season', label: 'Saison angelegt', ok: seasons.length > 0 },
    {
      id: 'trainer',
      label: 'Trainer im Team',
      ok: trainerCount > 0,
    },
    {
      id: 'roster',
      label: 'Spielerinnen im Roster',
      ok: totalPlayers > 0,
    },
  ];
  const softPilotStartReady = softPilotStartChecks.every((c) => c.ok);

  const buildOfferMailto = (s: SeasonRow) => {
    const club = clubs.find((c) => c.id === s.clubId);
    const to = encodeURIComponent(club?.billingEmail || 'hello@cyclesguard.de');
    const fee =
      s.feeCents != null
        ? `${(s.feeCents / 100).toLocaleString('de-DE')} ${s.currency ?? 'EUR'}`
        : 'nach Absprache';
    const subject = encodeURIComponent(`CyclesGuard Angebot — ${s.name}`);
    const body = encodeURIComponent(
      [
        `Verein: ${club?.legalName || club?.name || '—'}`,
        `Saison: ${s.name}`,
        `Zeitraum: ${s.startsOn} – ${s.endsOn}`,
        `Fee: ${fee}`,
        `Contract-Ref: ${s.contractRef || '—'}`,
        '',
        'Manueller Season-Vertrag (ohne Stripe).',
        'Support: hello@cyclesguard.de',
      ].join('\n')
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
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
            <h1 className="font-display text-4xl font-semibold text-gradient mb-2">Club Product</h1>
            <p className="text-cream/70">
              Roster, Saison & Compliance — ohne Phasen, Symptome oder medizinische Rohdaten.
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
            <a
              href="/api/feedback?format=csv"
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
            >
              <Download className="w-4 h-4" />
              Feedback CSV
            </a>
            <a
              href="/api/admin/teams?format=csv"
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
            >
              <Download className="w-4 h-4" />
              Adherence CSV
            </a>
            <LogoutButton />
          </div>
        </header>
        <p className="text-xs text-cream/35 -mt-2">
          Support:{' '}
          <a
            href="mailto:hello@cyclesguard.de?subject=CyclesGuard%20Admin%20Support"
            className="text-cream/50 hover:text-rose-gold underline-offset-2 hover:underline"
          >
            hello@cyclesguard.de
          </a>
        </p>

        {!loading && teams.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="glass-card p-4">
              <p className="text-xs text-cream/50 mb-1">Spielerinnen</p>
              <p className="text-2xl font-semibold">{totalPlayers}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-cream/50 mb-1">Heute geloggt</p>
              <p className="text-2xl font-semibold">
                {loggedTodayPlayers}/{totalPlayers}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-cream/50 mb-1">Logging 7d</p>
              <p className="text-2xl font-semibold">
                {loggedPlayers}/{totalPlayers}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-cream/50 mb-1">Adherence 7d</p>
              <p
                className={`text-2xl font-semibold ${
                  adherencePct >= 70 ? 'text-sage' : 'text-rose-gold'
                }`}
              >
                {adherencePct}%
              </p>
              <p className="text-[11px] text-cream/35 mt-1 leading-snug">
                Anteil mit ≥1 Log · Ziel ≥70%
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-cream/50 mb-1">Teams &lt;70%</p>
              <p className="text-2xl font-semibold">{teamsBelowTarget}</p>
              <p className="text-[11px] text-cream/35 mt-1 leading-snug">
                Soft-Pilot KPI
              </p>
            </div>
          </section>
        )}

        <nav className="flex flex-wrap gap-2" aria-label="Admin Bereiche">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-sm font-medium border transition-colors ${
                tab === t.id
                  ? 'bg-rose-gold/15 border-rose-gold/40 text-cream'
                  : 'bg-white/5 border-white/10 text-cream/70 hover:bg-white/10'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>

        {msg && (
          <p
            className={`text-sm ${
              /fehlgeschlagen|Fehler|ungültig|prüfen/i.test(msg) ? 'text-menstrual' : 'text-sage'
            }`}
            role="status"
          >
            {msg}
          </p>
        )}
        {error && (
          <div className="glass-card p-4 border border-menstrual/30 bg-menstrual/10 text-menstrual text-sm">
            {error}
          </div>
        )}

        {tab === 'season' && (
          <div className="space-y-6">
            <section className="glass-card p-5 space-y-3">
              <h2 className="font-semibold inline-flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-rose-gold" />
                Saison anlegen
              </h2>
              {clubs.length === 0 ? (
                <p className="text-sm text-cream/50">
                  Kein Verein verknüpft — Saisons benötigen eine Club-Zuordnung in{' '}
                  <code className="text-cream/70">club_members</code>.
                </p>
              ) : (
                <div className="grid md:grid-cols-5 gap-3">
                  <select
                    value={seasonClubId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSeasonClubId(id);
                      const c = clubs.find((x) => x.id === id);
                      setClubLegalName(c?.legalName ?? '');
                      setClubBillingEmail(c?.billingEmail ?? '');
                    }}
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
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
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
              )}
            </section>

            {clubs.length > 0 && (
              <section className="glass-card p-5 space-y-3">
                <h2 className="font-semibold">Verein · Billing / Legal</h2>
                <p className="text-xs text-cream/50">
                  Für manuellen Paid-Vertrag — keine Spieler-PII, nur Vereinskontakt.
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    value={clubLegalName}
                    onChange={(e) => setClubLegalName(e.target.value)}
                    placeholder="Legal Name"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                  />
                  <input
                    type="email"
                    value={clubBillingEmail}
                    onChange={(e) => setClubBillingEmail(e.target.value)}
                    placeholder="billing@verein.de"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                  />
                  <button
                    type="button"
                    onClick={() => void saveClubBilling()}
                    disabled={clubBusy || !seasonClubId}
                    className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 min-h-12 disabled:opacity-40 inline-flex items-center justify-center gap-2"
                  >
                    {clubBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Speichern
                  </button>
                </div>
              </section>
            )}

            {clubs.length > 0 && (
              <section className="glass-card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">Closing-Checkliste (GO-LIVE D1–D2)</h2>
                  <span
                    className={`text-xs font-medium ${closingReady ? 'text-sage' : 'text-rose-gold'}`}
                  >
                    {closingReady ? 'Ready für Paid' : 'Noch offen'}
                  </span>
                </div>
                <p className="text-xs text-cream/50">
                  Manueller Vertrag ohne Stripe — für den gewählten Verein
                  {primarySeason ? ` · Saison „${primarySeason.name}“` : ' · noch keine Saison'}.
                </p>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                  {closingChecks.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                    >
                      <span className="text-cream/70">{c.label}</span>
                      <span className={c.ok ? 'text-sage' : 'text-rose-gold'}>
                        {c.ok ? 'OK' : 'offen'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="glass-card p-5 space-y-4">
              <div>
                <h2 className="font-semibold mb-1">Vertragspfad (manuell, ohne Stripe)</h2>
                <p className="text-xs text-cream/50">
                  Soft-Pilot → Angebot → unterschrieben → aktiv bezahlt. Fee & Contract-Ref für Closing.
                </p>
              </div>
              {seasons.length === 0 ? (
                <p className="text-sm text-cream/50">Noch keine Saisons.</p>
              ) : (
                <div className="space-y-3">
                  {seasons.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-cream/50">
                            {s.startsOn} → {s.endsOn} · {statusLabel(s.status)}
                          </p>
                          <p className="text-xs text-cream/40 mt-1">
                            {s.feeCents != null
                              ? `${(s.feeCents / 100).toLocaleString('de-DE')} ${s.currency ?? 'EUR'}`
                              : 'Kein Fee'}
                            {s.contractRef ? ` · Ref ${s.contractRef}` : ''}
                            {s.signedByEmail ? ` · ${s.signedByEmail}` : ''}
                            {s.signedAt
                              ? ` · signiert ${new Date(s.signedAt).toLocaleDateString('de-DE')}`
                              : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
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
                          <select
                            value={s.commercialStatus ?? 'pilot_free'}
                            onChange={(e) => void setSeasonCommercial(s.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-11"
                            aria-label="Vertragsstatus"
                          >
                            <option value="pilot_free">Pilot gratis</option>
                            <option value="quoted">Angebot</option>
                            <option value="signed">Unterschrieben</option>
                            <option value="active_paid">Aktiv bezahlt</option>
                            <option value="ended">
                              {pendingCommercial?.id === s.id && pendingCommercial.status === 'ended'
                                ? 'Beendet (nochmal tippen)'
                                : 'Beendet'}
                            </option>
                            <option value="churned">
                              {pendingCommercial?.id === s.id &&
                              pendingCommercial.status === 'churned'
                                ? 'Churned (nochmal tippen)'
                                : 'Churned'}
                            </option>
                          </select>
                          <button
                            type="button"
                            onClick={() => openContractEditor(s)}
                            className="inline-flex items-center gap-2 min-h-11 px-3 rounded-lg bg-white/10 text-sm"
                          >
                            <Pencil className="w-4 h-4" />
                            Details
                          </button>
                          {(s.commercialStatus === 'quoted' ||
                            s.commercialStatus === 'signed') && (
                            <a
                              href={buildOfferMailto(s)}
                              className="inline-flex items-center gap-2 min-h-11 px-3 rounded-lg bg-white/10 text-sm"
                            >
                              <Mail className="w-4 h-4" />
                              Angebot mailen
                            </a>
                          )}
                        </div>
                      </div>

                      {editSeasonId === s.id && (
                        <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                          <input
                            value={editFeeEuro}
                            onChange={(e) => setEditFeeEuro(e.target.value)}
                            placeholder="Fee EUR (z. B. 3500)"
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                          />
                          <input
                            value={editContractRef}
                            onChange={(e) => setEditContractRef(e.target.value)}
                            placeholder="Contract-Ref / Angebots-Nr."
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                          />
                          <input
                            type="email"
                            value={editSignedBy}
                            onChange={(e) => setEditSignedBy(e.target.value)}
                            placeholder="Unterzeichner E-Mail"
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                          />
                          <input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Interne Notiz (nicht an Club)"
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                          />
                          <div className="md:col-span-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void saveContractDetails()}
                              disabled={contractBusy}
                              className="rounded-xl bg-rose-gold text-navy font-medium px-4 py-3 min-h-12 disabled:opacity-40 inline-flex items-center gap-2"
                            >
                              {contractBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              Speichern
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditSeasonId(null)}
                              className="rounded-xl bg-white/10 px-4 py-3 min-h-12 text-sm"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {showPlatform && clubs.length > 0 && (
              <section className="glass-card p-5 space-y-3">
                <h2 className="font-semibold">Club-Admin zuweisen</h2>
                <p className="text-xs text-cream/50">
                  E-Mail einladen oder bestehende Nutzerin als Club-Admin für einen Verein setzen.
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <select
                    value={platformClubId}
                    onChange={(e) => setPlatformClubId(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="email"
                    value={platformEmail}
                    onChange={(e) => setPlatformEmail(e.target.value)}
                    placeholder="admin@verein.de"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                  />
                  <button
                    onClick={assignClubAdmin}
                    disabled={!platformEmail.trim()}
                    className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 min-h-12 disabled:opacity-40"
                  >
                    Zuweisen
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {tab === 'compliance' && (
          <div className="space-y-6">
            <section className="glass-card p-5 space-y-3">
              <h2 className="font-semibold inline-flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-rose-gold" />
                Pilot-Scorecard (Wochen-Call)
              </h2>
              <p className="text-xs text-cream/50">
                Kurz für PILOT-FEEDBACK.md — ohne Gesundheitsrohdaten.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[11px] text-cream/45 mb-1">Adherence 7d</p>
                  <p
                    className={`text-xl font-semibold ${
                      adherencePct >= 70 ? 'text-sage' : 'text-rose-gold'
                    }`}
                  >
                    {adherencePct}%
                  </p>
                  <p className="text-[11px] text-cream/35">Ziel ≥70%</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[11px] text-cream/45 mb-1">Keine Daten heute</p>
                  <p className="text-xl font-semibold">
                    {totalPlayers === 0
                      ? '—'
                      : `${Math.round(
                          ((totalPlayers - loggedTodayPlayers) / totalPlayers) * 100
                        )}%`}
                  </p>
                  <p className="text-[11px] text-cream/35">
                    {totalPlayers - loggedTodayPlayers}/{totalPlayers || 0} ohne Log
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[11px] text-cream/45 mb-1">Trainer aktiv 7d</p>
                  <p
                    className={`text-xl font-semibold ${
                      trainerCount > 0 && trainersActive7d >= 1 ? 'text-sage' : 'text-cream'
                    }`}
                  >
                    {trainerCount === 0 ? '—' : `${trainersActive7d}/${trainerCount}`}
                  </p>
                  <p className="text-[11px] text-cream/35">Ziel ≥3×/Woche · Kabine</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[11px] text-cream/45 mb-1">Feedback Ø</p>
                  <p
                    className={`text-xl font-semibold ${
                      feedbackAvg != null && feedbackAvg >= 4 ? 'text-sage' : 'text-cream'
                    }`}
                  >
                    {feedbackAvg != null ? `${feedbackAvg}/5` : '—'}
                  </p>
                  <p className="text-[11px] text-cream/35">
                    T{' '}
                    {feedbackAvgByRole.trainer != null ? feedbackAvgByRole.trainer : '—'}
                    {' · S '}
                    {feedbackAvgByRole.player != null ? feedbackAvgByRole.player : '—'}
                    {' · Ziel ≥4'}
                  </p>
                </div>
              </div>
              <a
                href="/api/admin/teams?format=csv"
                className="inline-flex items-center gap-2 text-xs text-cream/50 hover:text-rose-gold w-fit"
              >
                <Download className="w-3.5 h-3.5" />
                Adherence CSV für Wochen-Call
              </a>
            </section>

            <section className="glass-card p-5 space-y-3">
              <h2 className="font-semibold inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sage" />
                Ops-Status (L2/L3 Trust)
              </h2>
              <p className="text-xs text-cream/50">
                Nur Booleans — keine Secret-Werte. Öffentlich:{' '}
                <a href="/privacy" className="text-cream/70 hover:text-rose-gold underline-offset-2 hover:underline">
                  /privacy
                </a>
                {' · '}
                <a href="/pilot" className="text-cream/70 hover:text-rose-gold underline-offset-2 hover:underline">
                  /pilot
                </a>
                {' · '}
                Checkliste: docs/pitch/GO-LIVE.md
              </p>
              {opsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-rose-gold" />
              ) : opsStatus ? (
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between gap-3">
                    <span>Push ready (VAPID + Cron)</span>
                    <span className={opsStatus.push.ready ? 'text-sage' : 'text-rose-gold'}>
                      {opsStatus.push.ready ? 'OK' : 'offen'}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Sentry konfiguriert</span>
                    <span className={opsStatus.sentryConfigured ? 'text-sage' : 'text-rose-gold'}>
                      {opsStatus.sentryConfigured ? 'OK' : 'offen'}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Demo-Mode</span>
                    <span className={!opsStatus.demoMode ? 'text-sage' : 'text-rose-gold'}>
                      {opsStatus.demoMode ? 'AN (Pitch)' : 'AUS (Pilot)'}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Soft-Pilot Env ready</span>
                    <span
                      className={
                        opsStatus.checklist.softPilotReady ? 'text-sage' : 'text-rose-gold'
                      }
                    >
                      {opsStatus.checklist.softPilotReady ? 'OK' : 'offen'}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>GPS Ingestion</span>
                    <span className="text-cream/60">
                      {opsStatus.ingestionConfigured ? 'konfiguriert' : 'optional / aus'}
                    </span>
                  </li>
                  {opsStatus.siteUrl && (
                    <li className="text-xs text-cream/40 pt-1">Site: {opsStatus.siteUrl}</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-cream/50">Ops-Status nicht ladbar.</p>
              )}
            </section>

            <section className="glass-card p-5 space-y-3">
              <h2 className="font-semibold inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sage" />
                Trust & Export
              </h2>
              <p className="text-sm text-cream/60 leading-relaxed">
                Audit-Log ohne Gesundheits-Rohdaten. Go-Live-Checkliste:{' '}
                <code className="text-cream/80">docs/pitch/GO-LIVE.md</code>
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/admin/audit?format=csv"
                  className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm w-fit"
                >
                  <Download className="w-4 h-4" />
                  Audit CSV herunterladen
                </a>
                <a
                  href="/api/feedback?format=csv"
                  className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm w-fit"
                >
                  <Download className="w-4 h-4" />
                  Feedback CSV herunterladen
                </a>
              </div>
            </section>

            <section className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-semibold inline-flex items-center gap-2">
                  <MessageSquareHeart className="w-4 h-4 text-sage" />
                  Pilot-Feedback
                </h2>
                <div className="flex items-center gap-3">
                  {feedbackAvg != null && (
                    <p className="text-sm text-cream/60">
                      Ø {feedbackAvg}/5 · {feedbackCount} Einträge
                    </p>
                  )}
                  <a
                    href="/api/feedback?format=csv"
                    className="inline-flex items-center gap-1.5 text-xs text-cream/50 hover:text-rose-gold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </a>
                </div>
              </div>
              <p className="text-xs text-cream/50">
                Nur Produkt-Scores & Freitext — keine Zyklusdaten, keine E-Mails.
              </p>
              {feedbackLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-rose-gold" />
              ) : feedbackItems.length === 0 ? (
                <p className="text-sm text-cream/50">Noch kein In-App-Feedback.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {feedbackItems.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm"
                    >
                      <p className="text-cream/80">
                        <span className="font-medium">{f.score}/5</span>
                        <span className="text-cream/40"> · {f.role}</span>
                        {f.context ? (
                          <span className="text-cream/40"> · {f.context}</span>
                        ) : null}
                      </p>
                      {f.message && (
                        <p className="text-cream/65 mt-1 leading-relaxed">{f.message}</p>
                      )}
                      <p className="text-[11px] text-cream/30 mt-1">
                        {new Date(f.createdAt).toLocaleString('de-DE')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'roster' && (
          <div className="space-y-6">
            <section className="glass-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Soft-Pilot Start (First-Run)</h2>
                <span
                  className={`text-xs font-medium ${
                    softPilotStartReady ? 'text-sage' : 'text-rose-gold'
                  }`}
                >
                  {softPilotStartReady ? 'Startklar' : 'Noch offen'}
                </span>
              </div>
              <p className="text-xs text-cream/50">
                Verein → Team → Saison → Trainer → Invites. Soft-Pilot-Pack:{' '}
                <a href="/privacy" className="text-cream/70 hover:text-rose-gold">
                  /privacy
                </a>
                {' · '}
                <a href="/pilot" className="text-cream/70 hover:text-rose-gold">
                  /pilot
                </a>
                {' · '}
                <a href="/spielerinnen-info" className="text-cream/70 hover:text-rose-gold">
                  /spielerinnen-info
                </a>
                {' · '}
                <a href="/trainer/onboarding" className="text-cream/70 hover:text-rose-gold">
                  Trainer-Onboarding
                </a>
                {' · '}
                <a
                  href="https://github.com/mdacoding/cyclesguard/blob/main/docs/pitch/MULTI-CLUB-OPS.md"
                  className="text-cream/70 hover:text-rose-gold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Multi-Club Ops
                </a>
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {softPilotStartChecks.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  >
                    <span className="text-cream/70">{c.label}</span>
                    <span className={c.ok ? 'text-sage' : 'text-rose-gold'}>
                      {c.ok ? 'OK' : 'offen'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {showPlatform && (
              <section className="glass-card p-5 space-y-3">
                <h2 className="font-semibold">Verein anlegen (Platform)</h2>
                <p className="text-xs text-cream/50">
                  Neuen Club für Soft-Pilot / zweiten Verein — danach Team mit Club-ID zuordnen.
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    placeholder="Vereinsname"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 md:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => void createClub()}
                    disabled={clubCreateBusy || !newClubName.trim()}
                    className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 min-h-12 disabled:opacity-40 inline-flex items-center justify-center gap-2"
                  >
                    {clubCreateBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Verein anlegen
                  </button>
                </div>
              </section>
            )}

            <section className="glass-card p-5 space-y-3">
              <h2 className="font-semibold">Neues Team</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Teamname"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                />
                <select
                  value={teamClubId}
                  onChange={(e) => setTeamClubId(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12"
                  aria-label="Verein zuordnen"
                >
                  <option value="">Verein (optional)</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Anzeigename Verein (optional)"
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
            </section>

            <label className="inline-flex items-center gap-2 text-sm text-cream/60 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="accent-[#E8C4B8]"
              />
              Archivierte Teams anzeigen
            </label>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-rose-gold" />
              </div>
            ) : teams.length === 0 ? (
              <div className="glass-card p-12 text-center text-cream/60 space-y-3">
                <Users className="w-10 h-10 mx-auto text-cream/30" />
                <p className="font-medium text-cream/80">Noch keine Teams</p>
                <p className="text-sm text-cream/50 max-w-md mx-auto leading-relaxed">
                  Lege oben ein Team an, dann Trainer und Spielerinnen per E-Mail einladen.
                  Soft-Pilot: ein aktives Team reicht zum Start.
                </p>
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
                      <h2 className="font-semibold text-lg">
                        {team.name}
                        {team.status === 'archived' ? (
                          <span className="ml-2 text-xs font-normal text-cream/40">archiviert</span>
                        ) : null}
                      </h2>
                      <p className="text-sm text-cream/50">
                        {team.clubName ?? 'Ohne Vereinszuordnung'}
                      </p>
                    </div>
                    <div className="text-sm text-cream/70">
                      {team.playerCount} Spielerinnen · Adherence 7d:{' '}
                      <strong
                        className={
                          team.playerCount === 0
                            ? 'text-cream'
                            : team.loggedLast7Days / team.playerCount >= 0.7
                              ? 'text-sage'
                              : 'text-rose-gold'
                        }
                      >
                        {team.playerCount === 0
                          ? '—'
                          : `${team.loggedLast7Days}/${team.playerCount} (${Math.round(
                              (team.loggedLast7Days / team.playerCount) * 100
                            )}%)`}
                      </strong>
                      {team.playerCount > 0 ? (
                        <span className="text-cream/40"> · Ziel ≥70%</span>
                      ) : null}
                      {team.adherenceSeries7d && team.adherenceSeries7d.length > 0 ? (
                        <div
                          className="mt-2 flex items-end gap-0.5 h-8"
                          title="Adherence % pro Tag (7 Tage)"
                          aria-label="Adherence 7-Tage-Serie"
                        >
                          {team.adherenceSeries7d.map((p) => (
                            <div
                              key={p.day}
                              className={`flex-1 min-w-[4px] rounded-sm ${
                                p.pct >= 70 ? 'bg-sage/70' : p.pct > 0 ? 'bg-rose-gold/55' : 'bg-white/15'
                              }`}
                              style={{ height: `${Math.max(8, p.pct)}%` }}
                              title={`${p.day}: ${p.pct}% (${p.logged})`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedTeamId && (
              <section className="glass-card p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="font-semibold text-lg">Roster & Team</h2>
                  <div className="flex flex-wrap gap-2">
                    {pendingArchive && (
                      <button
                        type="button"
                        onClick={() => setPendingArchive(false)}
                        className="inline-flex items-center min-h-11 px-3 rounded-lg bg-white/10 text-sm"
                      >
                        Abbrechen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={archiveTeam}
                      className="inline-flex items-center gap-2 min-h-11 px-3 rounded-lg bg-white/10 text-sm text-cream/70 hover:bg-white/15"
                    >
                      <Archive className="w-4 h-4" />
                      {teams.find((t) => t.id === selectedTeamId)?.status === 'archived'
                        ? 'Reaktivieren'
                        : pendingArchive
                          ? 'Endgültig archivieren'
                          : 'Archivieren'}
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 md:col-span-2"
                    placeholder="Teamname"
                  />
                  <button
                    type="button"
                    onClick={renameTeam}
                    disabled={!renameValue.trim()}
                    className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 min-h-12 disabled:opacity-40 inline-flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Umbenennen
                  </button>
                </div>
                {membersLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-rose-gold" />
                ) : members.length === 0 ? (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-2">
                    <p className="text-sm text-cream/70 font-medium">Noch keine Mitglieder</p>
                    <p className="text-sm text-cream/45 leading-relaxed">
                      Lade Spielerinnen oder Trainer per E-Mail ein (unten) oder importiere eine CSV.
                      Soft-Pilot: 5–10 Freiwillige reichen zum Start.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div>
                          <p className="font-medium">
                            {m.name}
                            {m.invitePending ? (
                              <span className="ml-2 text-[11px] font-normal text-rose-gold/90">
                                Einladung offen
                              </span>
                            ) : null}
                            {m.role === 'player' && m.activeLast7Days === true ? (
                              <span className="ml-2 text-[11px] font-normal text-sage">
                                aktiv 7d
                              </span>
                            ) : null}
                            {m.role === 'player' &&
                            m.activeLast7Days === false &&
                            !m.invitePending ? (
                              <span className="ml-2 text-[11px] font-normal text-rose-gold/80">
                                still 7d
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-cream/50">
                            {m.role === 'trainer' ? 'Trainer' : 'Spielerin'}
                            {m.email ? ` · ${m.email}` : ''}
                          </p>
                          <details className="mt-1">
                            <summary className="text-[11px] text-cream/35 cursor-pointer hover:text-cream/55">
                              Erweitert (User-ID)
                            </summary>
                            <p className="text-[11px] text-cream/30 mt-1 font-mono break-all">{m.userId}</p>
                          </details>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.invitePending && (
                            <button
                              type="button"
                              onClick={() => void resendInvite(m.userId)}
                              disabled={resendId === m.userId}
                              className="inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-lg bg-white/10 text-sm disabled:opacity-50"
                            >
                              <Mail className="w-4 h-4" />
                              {resendId === m.userId ? 'Sende…' : 'Einladung erneut'}
                            </button>
                          )}
                          {pendingRemoveId === m.userId && (
                            <button
                              type="button"
                              onClick={() => setPendingRemoveId(null)}
                              className="inline-flex items-center min-h-11 px-3 py-2 rounded-lg bg-white/10 text-sm"
                            >
                              Abbrechen
                            </button>
                          )}
                          <button
                            onClick={() => removeMember(m.userId)}
                            className="inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-lg bg-menstrual/15 text-menstrual text-sm"
                          >
                            <UserMinus className="w-4 h-4" />
                            {pendingRemoveId === m.userId ? 'Endgültig entfernen' : 'Entfernen'}
                          </button>
                        </div>
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
                  {msg && /einlad|roster|csv|mitglied|zugewiesen/i.test(msg) && (
                    <p
                      className={`text-sm ${
                        /fehlgeschlagen|Fehler|ungültig|prüfen/i.test(msg)
                          ? 'text-menstrual'
                          : 'text-sage'
                      }`}
                      role="status"
                    >
                      {msg}
                    </p>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-3">
                  <h3 className="text-sm font-medium inline-flex items-center gap-2">
                    <Upload className="w-4 h-4 text-rose-gold" />
                    Bulk CSV (email,fullName,role)
                  </h3>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={csvBusy || !selectedTeamId}
                    onChange={(e) => void uploadCsv(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-cream/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-gold file:text-navy file:font-medium"
                  />
                  <p className="text-xs text-cream/40">
                    Header optional. Beispiel: <code>anna@verein.de,Anna Müller,player</code>
                  </p>
                </div>

                <details className="border-t border-white/10 pt-4 space-y-4">
                  <summary className="text-sm font-medium text-cream/70 cursor-pointer hover:text-cream/90">
                    Erweitert — User-ID / GPS Athlete-Link
                  </summary>
                  <div className="space-y-3 pt-2">
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

                  <div className="space-y-3">
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
                      Ohne laufende Ingestion wird der Link in Supabase gespeichert; Sync warnt nur in
                      den Logs. Siehe docs/pitch/INGESTION-DEPLOY.md. Nur nötig, wenn der Club GPS fordert.
                    </p>
                  </div>
                </details>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
