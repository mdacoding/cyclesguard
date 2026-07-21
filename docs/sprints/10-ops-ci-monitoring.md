# Sprint 10: CI/CD, Monitoring & Durable Queue (P2)

**Priorität:** P2 — Produktionshärte nach Pilot-Kickoff  
**Ziel:** Reproduzierbare Deploys, Sichtbarkeit bei Ausfällen, keine Telemetry-Verluste bei Restarts.

---

## CTO Evaluation & Architektur-Entscheidung

Heute: manuelle Builds, In-Memory-Queue (Verlust bei Pod-Restart), Actuator nur lokal sinnvoll, ein Frontend-Unit-Test + ein Java-Test.

**Fokus:** Stabilität der Pipeline, nicht Feature-Creep.

---

## Proposed Changes

### 1. Monorepo CI

#### [NEW] `.github/workflows/ci.yml`
- Frontend: `lint`, `test:trainer-status`, `build`
- Ingestion: `./mvnw test`, `package`
- Optional: path filters pro Subprojekt

### 2. Deploy Hardening

#### [MODIFY] Frontend `next.config.mjs`
- `output: 'standalone'` für Docker-Parity mit vorhandenem Dockerfile

#### [MODIFY] Ingestion
- Prod-Profile ohne Default-Secrets
- Healthchecks in Compose/K8s-Manifest (Stub)

### 3. Durable Telemetry Queue

#### [MODIFY] `TelemetryQueue`
- Redis Streams **oder** Postgres `LISTEN/NOTIFY` + Outbox-Tabelle
- Empfehlung Pilot→Liga: **Redis** (Bucket4j kann später clustered werden)

### 4. Monitoring

- Frontend: Sentry (oder gleichwertig), ohne Health-Payloads
- Ingestion: Actuator + Alert auf Queue-Depth / Error-Rate
- Uptime-Check auf `/api/trainer/team-status` (auth’d synthetic) und `/actuator/health`

### 5. Secrets

- Rotation-Runbook für `WEBHOOK_SECRET`, `MANAGEMENT_API_KEY`, `CRON_SECRET`, VAPID
- Keine Secrets in `docker-compose` Defaults für Prod-Docs

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | GitHub CI | Regressions-Schutz |
| 2 | Sentry + Health Alerts | MTTD |
| 3 | Durable Queue | Datenverlust Telemetry |
| 4 | Standalone/Docker Fix | Deploy-Konsistenz |

---

## Verification Plan

- PR ohne grüne CI kann nicht gemerged werden (Branch Protection)
- Kill Ingestion-Pod während Last → nach Restart keine dauerhaft verlorenen accepted Payloads (Queue durable)
- Künstlicher 500 in API → Sentry Event
