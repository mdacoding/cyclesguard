# Supabase Setup — Projekt `jgtqtuwtrulwehrtcydf`

**Project URL:** `https://jgtqtuwtrulwehrtcydf.supabase.co`  
**Dashboard:** https://supabase.com/dashboard/project/jgtqtuwtrulwehrtcydf

---

## Erledigt (Stand 21.07.2026)

| Schritt | Status |
|---------|--------|
| `.env.local` (URL, Publishable, Secret) | ✅ |
| `supabase login` + `link --project-ref jgtqtuwtrulwehrtcydf` | ✅ |
| `db push` Migrationen `001`–`008` | ✅ |
| UUID-Fix (`gen_random_uuid` statt `uuid-ossp`) | ✅ |
| `npm run seed:eintracht` | ✅ Ampel-Demo-Daten |
| Migration `009` (consent unique) | ✅ |

Docker-Warnung nach `db push` („failed to cache migrations catalog“) ist **harmlos** — betrifft nur lokales Docker-Image-Caching, nicht die Cloud-DB.

---

## Noch offen

```powershell
cd cyclesguard-frontend
npm run dev   # lokaler Smoke vor Vercel
```

Dann: **Vercel Deploy** → `docs/pitch/DEPLOY.md`.

---

## Auth-Einstellungen (vor öffentlicher URL)

**Authentication → URL Configuration:**

- Site URL: `https://<eure-vercel-domain>` (lokal: `http://localhost:3000`)
- Redirect URLs:  
  - `http://localhost:3000/auth/callback`  
  - `https://<eure-vercel-domain>/auth/callback`

Email confirm für Demo: deaktiviert oder Seed mit `email_confirm: true` (bereits im Seed).

---

## Test-Login

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Trainer | `trainer@eintracht-demo.de` | `CyclesGuard2026!` |
| Spielerin (REST) | `lisa.weber@eintracht-demo.de` | `CyclesGuard2026!` |

Vollständige Liste: `DEMO-ACCOUNTS.md`.

---

## Bekannte frühere Fehler (behoben)

| Fehler | Ursache | Fix |
|--------|---------|-----|
| `uuid_generate_v4() does not exist` | `uuid-ossp` in Schema `extensions` | `gen_random_uuid()` |
| `Could not find table public.clubs` | Migrationen nicht applied | `db push` 001–008 |
| `Access token not provided` | CLI nicht eingeloggt | `supabase login` |
