# Eintracht Pitch — Materialien

**Stand 21.07.2026:** Supabase + Seed fertig · **nächster Schritt = Vercel**.

| Datei | Zweck |
|-------|--------|
| [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) | Cloud-Projekt Status + CLI |
| [DEPLOY.md](./DEPLOY.md) | Vercel Deploy (P0.1 Rest) |
| [DEMO-ACCOUNTS.md](./DEMO-ACCOUNTS.md) | Login-Daten + Ampel |
| [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) | 5-Minuten Ablauf (P0.4) |
| [DATENSCHUTZ-DOSB-1-PAGER.md](./DATENSCHUTZ-DOSB-1-PAGER.md) | Datenschutz (P0.5) |
| [PILOTANGEBOT.md](./PILOTANGEBOT.md) | Pilotangebot (P0.6) |
| [TRAINER-ONBOARDING.md](./TRAINER-ONBOARDING.md) | Athletik 1-Seiter (P1.2) |
| [PILOT-FEEDBACK.md](./PILOT-FEEDBACK.md) | Feedback-Call (P1.4) |
| [ALL-MIGRATIONS.sql](./ALL-MIGRATIONS.sql) | SQL-Bundle (frisch generieren via npm) |

**Scripts** (`cyclesguard-frontend/`):

| npm script | Zweck |
|------------|--------|
| `seed:eintracht` | Demo-Team + Accounts |
| `pitch:bundle-migrations` | SQL neu generieren |
| `pitch:smoke` | HTTP-Checks nach Deploy |
| `pitch:setup-env` | `.env.local` scaffold |

Roadmap: `docs/sprints/00-ROADMAP.md`.
