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

Supabase Cloud + Seed sind live (`docs/pitch/SUPABASE-SETUP.md`). Offen: Vercel.

```bash
npx supabase db push             # pending migrations (z. B. 009)
npm run seed:eintracht           # Ampel-Demo neu setzen
npm run pitch:smoke -- https://your-app.vercel.app
```

Docs: `docs/pitch/` · Plan: `docs/sprints/00-ROADMAP.md`.

## Deploy
Vercel region `fra1`. Crons defined in `vercel.json`. Step-by-step: `docs/pitch/DEPLOY.md`.

See `docs/sprints/00-ROADMAP.md` for the full roadmap.
