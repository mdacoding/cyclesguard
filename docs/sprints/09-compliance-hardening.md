# Sprint 9: Compliance Hardening — DSGVO Art. 17 / 20 (P1)

**Priorität:** P1 — rechtliche Vollständigkeit vor Liga-Ausbau  
**Ziel:** Export und Löschung decken **alle** personenbezogenen/Gesundheitsdaten ab.

---

## CTO Evaluation & Architektur-Entscheidung

Heute:

| Recht | Ist-Zustand | Lücke |
|-------|-------------|-------|
| Art. 20 Export | nur `cycle_logs` + E-Mail | Consents, Push, Summaries fehlen |
| Art. 17 Delete | Supabase Auth delete (Cascade) | **Ingestion `gps_*` bleibt liegen** |
| Art. 9 Consent Audit | Tabelle existiert | `ip_address_hashed` nie gesetzt |

**Lösung:** Zentraler „Privacy Orchestrator“ in Next.js API Routes, der alle Stores kennt.

```
DELETE /api/player/delete-account
  → Supabase: user (+ cascade)
  → Ingestion Management API: DELETE /internal/players/{id}
  → Audit-Log (ohne Gesundheitsinhalt)
```

---

## User Review Required

> [!IMPORTANT]
> **Aufbewahrungsfrist GPS:** Wie lange dürfen anonymisierte/aggregierte Trainingsdaten nach Löschung des Accounts für Vereinsstatistik bleiben?  
> Vorschlag: Roh-GPS **sofort löschen**; Team-Aggregate ohne Personenbezug dürfen bleiben.

---

## Proposed Changes

### 1. Vollständiger Export

#### [MODIFY] `app/api/player/export/route.ts`
- Inkludiert: `cycle_logs`, `player_consents`, `push_subscriptions` (ohne Secrets? → endpoint ok, keys optional redacted), `session_summaries`, `athlete_links`
- Content-Disposition unverändert JSON

### 2. Vollständige Löschung

#### [NEW] Ingestion `DELETE /api/v1/internal/players/{playerId}`
- Auth: Management Key
- Löscht `gps_metrics`, `gps_metrics_quarantine` für `player_id`
- Optional: anonymisiere offene Sessions

#### [MODIFY] `app/api/player/delete-account/route.ts`
- Nach Supabase-Delete: Ingestion-Cleanup aufrufen (best effort + Error surfacing)
- Reihenfolge dokumentieren (FK/Race)

### 3. Consent Audit

#### [MODIFY] `app/api/player/consent/route.ts`
- Hash Client-IP (SHA-256 + Server-Salt) → `ip_address_hashed`
- Kein Klartext-IP speichern

### 4. Retention Policy (Doku + Job-Stub)

#### [NEW] `docs/privacy/retention.md`
- Fristen für Logs, GPS, Push, Audit
#### [NEW] Cron-Stub `app/api/cron/retention/route.ts`
- Löscht z. B. Push-Subscriptions älter als X ohne User-Aktivität (konfigurierbar)

### 5. Trainer DENY Re-Audit

- Penetration-Checkliste: RLS Policies, Middleware, API Masking
- Sicherstellen: Postgres-Role `trainer` vs. Supabase JWT — dokumentieren, was wirklich greift

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | GPS-Löschung bei Account-Delete | Art. 17 Lücke |
| 2 | Export erweitern | Art. 20 |
| 3 | Consent IP-Hash | Auditierbarkeit |
| 4 | Retention Doku + Stub | Governance |

---

## Verification Plan

- Export-JSON enthält alle erwarteten Keys
- Nach Delete: keine Zeilen in Supabase-Tabellen **und** keine `gps_metrics` für die UUID
- Consent-Row hat `ip_address_hashed` ≠ Klartext
