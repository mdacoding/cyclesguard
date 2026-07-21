# CyclesGuard Player / Trainer / Admin App

Privacy-first readiness app for female soccer players (DSGVO Art. 9 / DOSB).

## Tech Stack
- Next.js 14 (App Router) + Serwist PWA
- Supabase (Auth, Postgres, RLS)
- Tailwind CSS, Framer Motion, Zod

## Setup

```bash
npm install
cp .env.example .env.local
# fill Supabase + VAPID + CRON_SECRET + ingestion URLs
npm run dev
```

Run Supabase migrations `supabase/migrations/001` … `008` in order.

## Roles (`app_metadata.role`)
| Role | Home |
|------|------|
| player (default) | `/player/dashboard` |
| trainer | `/trainer/dashboard` (+ `team_members.role=trainer`) |
| club_admin | `/admin/teams` (+ `club_members`) |
| platform_admin | all clubs |

## Sprint Features (4–12)
- Team-scoped trainer readiness API (no raw cycle data)
- Offline outbox sync for cycle logs
- Daily push cron (`/api/cron/daily-reminders`)
- Symptoms/notes + history
- Athlete links + session summary sync
- Full export / GPS cleanup on delete
- CI workflow + durable ingestion outbox
- Load flags on trainer dashboard
- Club admin adherence view

## Pitch demo (Eintracht)

Live: https://cyclesguard.vercel.app · Docs: `docs/pitch/`

```bash
npm run seed:eintracht
npm run pitch:env-checklist
npm run pitch:smoke -- https://cyclesguard.vercel.app
npm test
npm run test:e2e:public
```

Soft-Pilot nach Club-Ja: `docs/pitch/PILOT-RUNBOOK.md`  
Optional Sentry: `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` setzen.

## Deploy
Vercel region `fra1`. Crons in `vercel.json`. Plan: `docs/sprints/00-ROADMAP.md`.
