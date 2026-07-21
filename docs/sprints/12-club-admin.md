# Sprint 12: Club Admin & Multi-Team Ops (P2)

**Priorität:** P2 — Liga-/Vereinsbetrieb nach stabilem Pilot  
**Ziel:** Vereine verwalten Teams, Rollen und Einladungen ohne Engineering-Eingriff in Supabase.

---

## CTO Evaluation & Architektur-Entscheidung

Bis Sprint 4/6 läuft Ops über SQL/Auth-Dashboard. Das skaliert nicht für 2.–Bundesliga-Kaderwechsel.

**Rollenmodell:**

| Rolle | Rechte |
|-------|--------|
| `player` | Eigene Cycle/GPS-Summaries |
| `trainer` | Team-Ampel + Invites (kein Rohzyklus) |
| `club_admin` | Teams, Memberships, Trainer zuweisen, Audit-Export Meta |
| `platform_admin` | Multi-Club (CyclesGuard intern) |

`club_admin` sieht **ebenfalls keine** `cycle_logs`-Rohdaten — nur Roster-Metadaten und aggregierte Adherence („12/18 haben heute geloggt“).

---

## User Review Required

> [!IMPORTANT]
> **Wer ist Club-Admin rechtlich?** Oft Mannschaftsarzt oder Sportdirektor — nicht der Cheftrainer. UI-Copy muss „Gesundheitsdaten nicht einsehbar“ prominent halten.

---

## Proposed Changes

### 1. Schema

#### [NEW] `supabase/migrations/008_clubs.sql`
- `clubs`, `club_members`, Erweiterung `teams.club_id`
- RLS für Admin-Scope

### 2. Admin UI

#### [NEW] `app/admin/teams/page.tsx`
- Teams anlegen, Trainer/Spieler zuweisen, deaktivieren
- Bulk-Invite CSV (E-Mail)

#### [NEW] `app/api/admin/*`
- CRUD Memberships mit Role-Checks (`club_admin`)

### 3. Adherence Dashboard (ohne Medizin)

- „Logging-Quote letzte 7 Tage“ pro Team
- Keine Phasenverteilung an Admin (das wäre indirektes Leak-Risiko)

### 4. Audit

- Admin-Aktionen in `admin_audit_log` (wer hat wen eingeladen/entfernt)
- Keine Gesundheitsfelder im Audit

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | Clubs + Admin-Rollen | Org-Struktur |
| 2 | Roster UI + Invites | Operabilität |
| 3 | Adherence ohne Medizin | Steuerung ohne Leak |
| 4 | Audit Log | DOSB/Compliance Story |

---

## Verification Plan

- Club-Admin von Club A sieht Club B nicht
- Club-Admin API darf `cycle_logs` nicht lesen (auch nicht aggregierte Phasen-Histogramme)
- Trainer-Rechte unverändert; Ampel weiterhin einzige medizinische Ableitung
