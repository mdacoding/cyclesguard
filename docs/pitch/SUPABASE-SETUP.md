# Supabase Setup — Projekt `jgtqtuwtrulwehrtcydf`

**Project URL:** `https://jgtqtuwtrulwehrtcydf.supabase.co`  
**Dashboard:** https://supabase.com/dashboard/project/jgtqtuwtrulwehrtcydf  
**Production:** https://cyclesguard.vercel.app

---

## Erledigt (Stand 23.07.2026)

| Schritt | Status |
|---------|--------|
| `.env.local` (URL, Publishable, Secret) | ✅ |
| `supabase login` + `link --project-ref jgtqtuwtrulwehrtcydf` | ✅ |
| `db push` Migrationen (inkl. RLS-Fixes) | ✅ |
| UUID-Fix (`gen_random_uuid` statt `uuid-ossp`) | ✅ |
| `npm run seed:eintracht` | ✅ Ampel-Demo-Daten |
| Vercel Production Deploy | ✅ live |
| Auth Redirect URLs (callback + set-password) | ✅ siehe unten |

Docker-Warnung nach `db push` („failed to cache migrations catalog“) ist **harmlos** — betrifft nur lokales Docker-Image-Caching, nicht die Cloud-DB.

---

## Lokaler Smoke (optional)

```powershell
cd cyclesguard-frontend
npm run dev
```

Trust gegen Prod (kostenlos, ohne CI-Minutes):

```powershell
npm run verify:go-live -- https://cyclesguard.vercel.app
```

Deploy-Ops: [`DEPLOY.md`](./DEPLOY.md) · Sign-off: [`GO-LIVE.md`](./GO-LIVE.md).

---

## Auth-Einstellungen

**Authentication → URL Configuration:**

- Site URL: `https://cyclesguard.vercel.app` (lokal: `http://localhost:3000`)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://cyclesguard.vercel.app/auth/callback`
  - Optional Wildcard: `https://cyclesguard.vercel.app/**` (deckt `/auth/set-password` ab)

Email confirm für Demo: deaktiviert oder Seed mit `email_confirm: true` (bereits im Seed).

---

## Test-Login

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Trainer | `trainer@eintracht-demo.de` | `CyclesGuard2026!` |
| Spielerin (REST) | `lisa.weber@eintracht-demo.de` | `CyclesGuard2026!` |

Vollständige Liste: `DEMO-ACCOUNTS.md` (nur intern — nicht an Clubs).

---

## Bekannte frühere Fehler (behoben)

| Fehler | Ursache | Fix |
|--------|---------|-----|
| `uuid_generate_v4() does not exist` | `uuid-ossp` in Schema `extensions` | `gen_random_uuid()` |
| `Could not find table public.clubs` | Migrationen nicht applied | `db push` |
| `Access token not provided` | CLI nicht eingeloggt | `supabase login` |
