# Sprint 4: Team-Tenancy & Trainer-Scope (P0)

**Priorität:** P0 — Hard Gate vor jedem Trainer-Prod-Zugang  
**Ziel:** Trainer sehen nur ihr eigenes Team. Keine Cross-Club-Aggregation mehr.

---

## CTO Evaluation & Architektur-Entscheidung

In Sprint 3 aggregiert `/api/trainer/team-status` via `service_role` **alle** `cycle_logs` und `auth.admin.listUsers()`. Das ist für einen Single-Club-Demo ok — für einen Bundesliga-Pilot mit mehreren Vereinen ein **Datenschutz-Showstopper**.

**Lösung:** Explizites Tenancy-Modell in Supabase:

```
teams → team_members (player | trainer) → cycle_logs bleiben player-owned
```

Die Trainer-API darf `service_role` **nur** auf `user_id IN (members of my teams)` anwenden. Maskierung (Ampel) bleibt unverändert.

---

## User Review Required

> [!IMPORTANT]
> **Team-Zuordnung:** Wer pflegt den Roster — Athletiktrainer, Mannschaftsarzt oder Club-Admin?  
> Vorschlag Sprint 4: Trainer kann Spielerinnen per E-Mail einladen; Club-Admin kommt erst in Sprint 12.

---

## Proposed Changes

### 1. Datenmodell

#### [NEW] `supabase/migrations/004_teams.sql`
- `teams (id, name, club_name, created_at)`
- `team_members (team_id, user_id, role CHECK IN ('player','trainer'), joined_at)`
- Unique `(team_id, user_id)`
- RLS: Mitglieder sehen eigene Memberships; Trainer sehen Team-Roster **ohne** Cycle-Daten
- Restrictive DENY für Trainer auf `cycle_logs` bleibt unangetastet

### 2. Trainer-API Scope

#### [MODIFY] `app/api/trainer/team-status/route.ts`
- Resolve `team_ids` des aufrufenden Trainers
- Hole nur Member-`user_id`s dieser Teams
- Aggregiere `cycle_logs` **nur** für diese IDs
- Response unverändert: `{ playerId, name, status, recommendation }`

### 3. Invite-Flow (minimal)

#### [NEW] `app/api/trainer/invite/route.ts`
- Trainer lädt Spielerin per E-Mail ein (Supabase Invite oder Magic Link)
- Nach Signup: Membership als `player` anlegen

#### [MODIFY] `app/trainer/dashboard/page.tsx`
- Team-Filter (falls mehrere Teams)
- Badge „Nicht geloggt heute“ (`NO_DATA`) hervorgehoben
- Einfache Invite-UI

### 4. Seed / Ops

- Script oder SQL: ersten Trainer + Team + Demo-Spielerinnen verknüpfen
- README: `app_metadata.role = trainer` **und** `team_members`-Eintrag erforderlich

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | Migration `teams` / `team_members` | Fundament |
| 2 | Scope in `team-status` | Schließt Leak |
| 3 | Dashboard Filter + NO_DATA | Trainer-Akzeptanz |
| 4 | Invite-API | Operabler Pilot |

---

## Verification Plan

- Zwei Teams mit je einem Trainer anlegen → Trainer A sieht **nie** Spielerinnen von Team B
- Direkter Browser-Fetch auf `cycle_logs` als Trainer → weiterhin RLS-Block
- Response von `/api/trainer/team-status` enthält keine Felder `phase`, `symptoms`, `notes`, `energy_level`
