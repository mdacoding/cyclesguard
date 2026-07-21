# Vercel-Import prüfen (Checkliste)

Ohne Zugang zu deinem Vercel-Account kann ich das Dashboard nicht lesen.  
Bitte **eine der beiden** Optionen:

### A) Live-URL schicken
Die Domain aus Vercel → Project → **Domains** (z. B. `https://cyclesguard-xxx.vercel.app`).  
Dann prüfe ich sie mit `npm run pitch:smoke` und Login-Flow.

### B) Selbst in 2 Minuten abhaken

#### 1. Root Directory (häufigster Fehler)

Vercel → Project → **Settings → General → Root Directory**

| Richtig | Falsch |
|---------|--------|
| `cyclesguard-frontend` | leer / Repo-Root |

Ohne `cyclesguard-frontend` findet Vercel kein Next.js-`package.json` → Build fail.

#### 2. Letzter Deployment-Status

**Deployments** → neuester Eintrag:

- [ ] Status **Ready** (grün)
- [ ] Falls **Error**: Build Logs öffnen und Fehlerzeile kopieren

#### 3. Environment Variables

**Settings → Environment Variables** (Production) — alle gesetzt?

| Variable | Pflicht |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ja |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ja |
| `SUPABASE_SERVICE_ROLE_KEY` | **ja** (sonst leere Ampel) |
| `NEXT_PUBLIC_SITE_URL` | ja → echte `https://….vercel.app` URL, **nicht** localhost |
| `NEXT_PUBLIC_DEMO_MODE` | `true` für Pitch |
| `CRON_SECRET` | ja |
| `CONSENT_IP_SALT` | ja |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ja für Push-Pilot |
| `VAPID_PRIVATE_KEY` | ja für Push-Pilot |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | optional Monitoring |
| Soft-Pilot | `NEXT_PUBLIC_DEMO_MODE=false` + Secrets rotieren |

Lokal anzeigen (Werte der Secrets werden maskiert):

```powershell
cd cyclesguard-frontend
node scripts/print-vercel-env-checklist.mjs
```

Nach Env-Änderung: **Redeploy** (Deployments → … → Redeploy).

#### 4. Supabase Auth

Dashboard → Authentication → URL Configuration:

- Site URL = Vercel-URL  
- Redirect: `https://<vercel>/auth/callback`

#### 5. Smoke

```powershell
cd cyclesguard-frontend
npm run pitch:smoke -- https://<deine-vercel-url>
```

Login-Test: `trainer@eintracht-demo.de` / `CyclesGuard2026!`

---

## Was ich bereits im Code angepasst habe

- `next.config.mjs`: `output: 'standalone'` nur noch **außerhalb** von Vercel (Docker), damit Vercel-Deploy stabiler läuft.

Schick mir die **Vercel-URL** oder einen **Build-Error-Auszug**, dann greife ich gezielt ein.
