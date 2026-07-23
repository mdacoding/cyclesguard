# CyclesGuard

Privacy-first readiness SaaS for female soccer players — menstrual cycle logging with **DOSB-compliant trainer signals** (Ampel only, never raw cycle data).

**GitHub:** https://github.com/mdacoding/cyclesguard  
**Live-Demo:** https://cyclesguard.vercel.app  

Pitch: **Multi-Club Soft-Pilot** (Eintracht Priorität 1, parallel Wolfsburg/Bayern) · Status: **Pitch-Ready** — Pack: `docs/pitch/` · Tracking: `docs/pitch/OUTREACH-TRACKING.md`.

---

## Monorepo

| Path | Stack | Role |
|------|-------|------|
| `cyclesguard-frontend/` | Next.js 14, Supabase, Serwist PWA | Player / Trainer / Club-Admin app |
| `cyclesguard-ingestion/` | Spring Boot 3.3, Flyway | GPS telemetry bridge (pilot+) |
| `docs/` | Markdown | Roadmap, pitch pack, privacy |

---

## Product stages (CTO)

```
Pitch-Ready  →  Soft-Pilot  →  Paid SaaS
   ← now         after club yes    after pilot proof
```

| Stage | Goal | Gate |
|-------|------|------|
| **Pitch-Ready** | Live demo URL + Datenschutz + Pilotangebot | Vercel online |
| **Soft-Pilot** | 5–10 Freiwillige, 8–12 Wochen, Feedback | Club commitment |
| **Paid SaaS** | Multi-club, contracts, billing, GPS optional | Pilot success metrics |

Full plan: [`docs/sprints/00-ROADMAP.md`](docs/sprints/00-ROADMAP.md) · SaaS view: [`docs/product/SAAS-PLAN.md`](docs/product/SAAS-PLAN.md)

---

## Quick start (local)

```bash
cd cyclesguard-frontend
cp .env.example .env.local   # or: npm run pitch:setup-env
# fill Supabase keys — see docs/pitch/SUPABASE-SETUP.md
npm install
npm run seed:demo            # after migrations on Supabase
npm run dev
```

Demo logins: [`docs/pitch/DEMO-ACCOUNTS.md`](docs/pitch/DEMO-ACCOUNTS.md)

---

## Deploy (Pitch)

1. Import **this repo** on [Vercel](https://vercel.com)  
2. Root Directory: **`cyclesguard-frontend`**  
3. Env vars: see [`docs/pitch/DEPLOY.md`](docs/pitch/DEPLOY.md)  
4. Set Supabase Auth Site URL + `/auth/callback`  
5. `npm run pitch:smoke -- https://<your-url>`

---

## Guardrails (non-negotiable)

1. Trainer sees only `FIT | MODIFIED_TRAINING | REST | NO_DATA` (+ load flags)  
2. No phase / symptoms / notes in trainer UI or push payloads  
3. Art. 9 consent, export, delete  
4. EU hosting (Supabase Frankfurt, Vercel `fra1`)

---

## CI

GitHub Actions (`.github/workflows/ci.yml`): frontend tests + build, ingestion Maven tests.
