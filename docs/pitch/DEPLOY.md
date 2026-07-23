# Pitch-Deploy: Vercel aus GitHub

**Stand:** 23.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard  
**Live:** https://cyclesguard.vercel.app  
**Supabase:** ✅ Cloud + Migrationen + Seed — siehe [SUPABASE-SETUP.md](./SUPABASE-SETUP.md)

**Status:** Production-URL live. Offene Ops: Soft-Pilot Outreach / AVV (Founder) — siehe [`GO-LIVE.md`](./GO-LIVE.md).

Geschätzte Dauer (neuer Fork/Deploy): **30–60 Minuten**.

---

## 1. Vercel-Projekt anlegen

1. https://vercel.com → **Add New… → Project**
2. Import **`mdacoding/cyclesguard`** (GitHub verbinden, falls nötig)
3. Configure:
   - **Root Directory:** `cyclesguard-frontend` *(Important)*
   - Framework: Next.js (auto)
   - Build Command: `npm run build` (default)
   - Install Command: `npm install` (default)
4. Region: Frankfurt — bereits in `vercel.json` (`fra1`)

---

## 2. Environment Variables

Production (+ Preview empfohlen) — Werte aus lokalem `cyclesguard-frontend/.env.local`:

| Variable | Pflicht | Hinweis |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ja | `https://jgtqtuwtrulwehrtcydf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ja | Publishable / anon |
| `SUPABASE_SERVICE_ROLE_KEY` | **ja** | Secret — **ohne Ampel = leer/500** |
| `NEXT_PUBLIC_SITE_URL` | ja | nach erstem Deploy auf echte URL setzen |
| `NEXT_PUBLIC_DEMO_MODE` | Soft-Pilot Prod: `false` | Pitch-Demo lokal ggf. `true` |
| `CRON_SECRET` | ja | aus `.env.local` |
| `CONSENT_IP_SALT` | ja | aus `.env.local` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | empfohlen | Push |
| `VAPID_PRIVATE_KEY` | empfohlen | Push |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | empfohlen | Observability |
| `NEXT_PUBLIC_IMPRESSUM_STREET` / `_CITY` | empfohlen | §5 TMG Postanschrift |

`INGESTION_*` für Soft-Pilot **nicht** setzen, bis Club GPS fordert.

Deploy → Production URL notieren (z. B. `https://cyclesguard.vercel.app`).

---

## 3. Supabase Auth URLs

Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://<eure-vercel-domain>`
- **Redirect URLs:**
  - `https://<eure-vercel-domain>/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://<eure-vercel-domain>/auth/set-password` oder `https://<eure-vercel-domain>/**`

Dann auf Vercel `NEXT_PUBLIC_SITE_URL` aktualisieren → Redeploy.

---

## 4. Smoke-Test

```bash
cd cyclesguard-frontend
npm run pitch:smoke -- https://<eure-vercel-domain>
npm run verify:go-live -- https://<eure-vercel-domain>
```

Manuell:

- [ ] `/login` (Demo-Hinweise nur wenn `DEMO_MODE=true`)
- [ ] `lisa.weber@eintracht-demo.de` → Dashboard
- [ ] `trainer@eintracht-demo.de` → Ampel (REST/FIT/MODIFIED/NO_DATA)
- [ ] Trainer sieht **keine** Phasen/Symptome
- [ ] Settings: Export / Löschen sichtbar
- [ ] `/spielerinnen-info` · `/impressum` erreichbar

Accounts: [DEMO-ACCOUNTS.md](./DEMO-ACCOUNTS.md) · Ablauf: [DEMO-SCRIPT.md](./DEMO-SCRIPT.md)

---

## 5. Security nach Deploy

- [ ] Demo-Passwort nur intern teilen; nach Pitch rotieren
- [ ] Secret Key rotieren, falls er in Chats stand
- [ ] Repo **private** halten, solange Demo-Secrets in Docs stehen
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` vor öffentlichem Marketing-Traffic

---

## 6. Nach Pitch-Zusage

→ P1 Soft-Pilot in [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md)  
→ Produkt-Stages in [`../product/SAAS-PLAN.md`](../product/SAAS-PLAN.md)
