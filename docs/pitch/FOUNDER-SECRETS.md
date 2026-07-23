# CyclesGuard — Founder Secret Apply (einmalig)

**Stand:** 23.07.2026  
**Zweck:** Die letzten manuellen Secrets, die **nicht** ohne Founder-Login gesetzt werden können.

---

## 1. Sentry DSN (GO-LIVE A1) — 5 Minuten

```powershell
# Browser: https://sentry.io → EU storage → Next.js Project → DSN kopieren
cd cyclesguard-frontend
$env:SENTRY_DSN="https://....@....ingest.de.sentry.io/...."   # EU-DSN
npm run apply:sentry-dsn
# vom Monorepo-Root:
cd ..
npx vercel --prod --yes
```

Prüfen: Admin → Compliance → Ops-Status zeigt `sentry:ok`.

---

## 2. GitHub CLI Secrets (CI RLS + E2E)

```powershell
& "$env:ProgramFiles\GitHub CLI\gh.exe" auth login
cd C:\Users\AkbaS\Desktop\SaaS\Projekte\cyclesguard

# Demo-Credentials nur für CI gegen die Pitch-DB (nicht an Clubs weitergeben)
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set E2E_TRAINER_EMAIL -b "trainer@eintracht-demo.de"
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set E2E_TRAINER_PASSWORD -b "CyclesGuard2026!"
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set E2E_ADMIN_EMAIL -b "admin@eintracht-demo.de"
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set E2E_ADMIN_PASSWORD -b "CyclesGuard2026!"
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set E2E_PLAYER_EMAIL -b "anna.mueller@eintracht-demo.de"
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set E2E_PLAYER_PASSWORD -b "CyclesGuard2026!"

# Public Supabase (für rls-trainer-check CI-Job)
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set NEXT_PUBLIC_SUPABASE_URL -b "<aus Vercel / .env.local>"
& "$env:ProgramFiles\GitHub CLI\gh.exe" secret set NEXT_PUBLIC_SUPABASE_ANON_KEY -b "<aus Vercel / .env.local>"
```

---

## 3. GitHub Actions Minutes (CI 0 Jobs)

Seit ~22.07. schlugen Runs mit **0 Jobs** fehl — Ursache war **Invalid workflow file** (nicht Minutes; Free-Plan hat noch ~1974 min).

Fix: Lean `ci.yml` (frontend + ingestion) + separates `ci-e2e.yml` (manuell).

```powershell
& "$env:ProgramFiles\GitHub CLI\gh.exe" workflow run "CI E2E / RLS.yml"
```

Lokal Soft-Pilot-Trust: `npm run verify:go-live -- https://cyclesguard.vercel.app`

---

## 4. Bereits erledigt (nicht nochmal)

| Item | Status |
|------|--------|
| VAPID + CRON_SECRET in Vercel | ✅ |
| `NEXT_PUBLIC_DEMO_MODE=false` Production | ✅ 23.07. |
| Sentry DSN (EU) Production | ✅ 23.07. `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` |
| GitHub E2E + Supabase CI Secrets | ✅ 23.07. |
| Accidental Vercel-Projekt entfernt | ✅ |
| Cron / RLS / Admin Dry-Run live | ✅ |

---

## 5. Gerätetest Push (B3) — manuell

Homescreen → Settings Erinnerungen → Cron triggern → Text ohne Zyklus-/Menstruationswort.  
Payload ist unit-getestet (`lib/push/payload.test.ts`).
