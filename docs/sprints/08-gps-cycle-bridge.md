# Sprint 8: Identity Bridge + GPS↔Cycle Link (P1)

**Priorität:** P1 — Kern-Differenzierung der Plattform  
**Ziel:** Telemetry und Cycle-Daten über dieselbe Spielerinnen-Identität verbinden — ohne Rohzyklus an Trainer.

---

## CTO Evaluation & Architektur-Entscheidung

Heute existieren zwei Welten:

| System | Identity | DB |
|--------|----------|-----|
| Frontend | Supabase `auth.users.id` | Supabase |
| Ingestion | freies `playerId` UUID | eigener Postgres |

Ohne Bridge keine Korrelation. **Keine** Rohdaten-Fusion im Trainer-Client.

**Architektur:**

```
Wearable/Webhook
    → Ingestion (HMAC) speichert gps_metrics.player_id = Supabase user UUID
    → Analytics-Job (server-only) liest:
         cycle_logs (service_role, scoped)
         gps_metrics (read replica / API)
    → schreibt readiness_insights (aggregiert)
    → Trainer sieht nur Ampel + optionale Load-Flags (Sprint 11)
```

**Entscheidung Sprint 8:** Identity + Session-Metadaten + read-only Bridge-API. Volles ML/Risk-Modell bewusst **nicht** — erst Datenqualität sichern.

---

## User Review Required

> [!IMPORTANT]
> **GPS-Anbieter:** Welches Tracking-System (Catapult, STATSports, Polar, Eigenbau) liefert die Webhooks?  
> Davon hängt die Mapping-Tabelle `external_athlete_id → user_id` ab.

---

## Proposed Changes

### 1. Identity Mapping

#### [NEW] `supabase/migrations/006_athlete_links.sql`
- `athlete_links (user_id, external_athlete_id, provider, team_id, created_at)`
- Unique `(provider, external_athlete_id)`

#### [NEW] Ingestion Flyway `V2__player_link_note.sql` (Dokumentation)
- Konvention: `player_id` **muss** Supabase UUID sein (oder Mapping-Tabelle in Ingestion)

### 2. Ingestion Hardening

#### [MODIFY] Webhook-Payload / Validierung
- Optional `externalAthleteId` + Provider-Lookup
- Reject unbekannter Athleten (Quarantine reason `UNKNOWN_PLAYER`)

### 3. Bridge-Service (minimal)

#### [NEW] `app/api/internal/session-summary/route.ts` (Cron/service-key only)
- Pro Session: Dauer, Distanz-Proxy, avg HR, max Speed (keine Roh-GPS-Punkte an FE)
- Speichert `session_summaries` in Supabase (aggregiert)

#### [NEW] `supabase/migrations/007_session_summaries.sql`
- Aggregattabelle, RLS: Spielerin sieht eigene Summaries; Trainer DENY auf Rohdaten
- Trainer darf später nur Team-Aggregate sehen (Sprint 11)

### 4. Player UX (optional klein)

- Dashboard: „Letzte Einheit: 72 min · Ø HF 148“ — ohne Zyklus-Leak nach außen

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | `athlete_links` + UUID-Konvention | Ohne Identity kein Link |
| 2 | Reject unknown players | Datenqualität |
| 3 | `session_summaries` Job | Nutzbare Aggregate |
| 4 | Player Session Card | Sichtbarer Mehrwert |

---

## Verification Plan

- Telemetry mit gemapptem `playerId` → `gps_metrics` + Summary entsteht
- Unmapped ID → Quarantine, kein Summary
- Trainer-API liefert weiterhin **keine** GPS-Koordinaten und keine Cycle-Rohfelder
- Account-Löschung (Sprint 9) muss Summaries + Links mitlöschen
