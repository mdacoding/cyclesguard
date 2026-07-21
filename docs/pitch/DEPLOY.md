# Pitch-Deploy: Vercel + Supabase Cloud

Schritt-für-Schritt für **P0.1** (gehostete Demo).

**Stand 21.07.2026:** Supabase Cloud + Migrationen `001`–`008` + Seed ✅ — **offen: Vercel**.  
Projekt: [SUPABASE-SETUP.md](./SUPABASE-SETUP.md).

---

## 1. Supabase Cloud-Projekt

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Region: **Frankfurt (eu-central-1)** — nah an Eintracht / DSGVO
3. DB-Passwort sicher speichern
4. Unter **Settings → API** notieren:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nur Server/Vercel, nie im Client)

### Auth-Einstellungen

**Authentication → Providers → Email:**

- Email provider: **enabled**
- Für Demo/Pitch: **Confirm email** optional deaktivieren (Seed setzt `email_confirm: true`)
- Site URL: später eure Vercel-URL, z. B. `https://cyclesguard.vercel.app`
- Redirect URLs: `https://<domain>/auth/callback`, `http://localhost:3000/auth/callback`

---

## 2. Migrationen

**Aktuelles Projekt:** `001`–`008` bereits applied. Neue Migrationen:

```bash
cd cyclesguard-frontend
npx supabase db push   # z. B. 009_player_consents_unique
```

**Neues leeres Projekt:** `npm run pitch:bundle-migrations` → `ALL-MIGRATIONS.sql` im SQL Editor, oder CLI `db push`.

---

## 3. Demo-Seed (P0.3)

```bash
cd cyclesguard-frontend
npm run pitch:setup-env   # .env.local + VAPID/Secrets (einmalig)
# Supabase-Keys in .env.local eintragen
npm run seed:eintracht
```

Setze in Vercel zusätzlich `NEXT_PUBLIC_DEMO_MODE=true` für Login-Hinweise im Pitch.

Accounts und Ampel-Erwartung: siehe [DEMO-ACCOUNTS.md](./DEMO-ACCOUNTS.md).

---

## 4. Secrets generieren

```bash
# VAPID (Push — optional für Pitch, aber in Vercel setzen)
npx web-push generate-vapid-keys

# CRON + Consent-Salt (beliebige lange Zufallsstrings)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Vercel Deploy

1. Repo auf GitHub pushen
2. [vercel.com](https://vercel.com) → Import → Root Directory: **`cyclesguard-frontend`**
3. Region: **Frankfurt (fra1)** — bereits in `vercel.json`
4. Environment Variables (Production + Preview):

| Variable | Wert |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jgtqtuwtrulwehrtcydf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / service_role (**Pflicht für Trainer-Ampel**) |
| `NEXT_PUBLIC_SITE_URL` | `https://<eure-domain>` |
| `NEXT_PUBLIC_DEMO_MODE` | `true` (Login-Hinweise im Pitch) |
| `CRON_SECRET` | aus `.env.local` |
| `CONSENT_IP_SALT` | aus `.env.local` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | aus `.env.local` |
| `VAPID_PRIVATE_KEY` | aus `.env.local` |

`INGESTION_*` für Pitch **nicht nötig** (GPS kommt erst im Pilot).

5. Deploy → Production-URL in Supabase **Site URL** + **Redirect URLs** eintragen

---

## 6. Smoke-Test (Checkliste)

Automatisch (HTTP):

```bash
npm run pitch:smoke -- https://<eure-domain>
```

Manuell:

- [ ] `/login` lädt ohne Fehler
- [ ] Spielerin `anna.mueller@eintracht-demo.de` → Dashboard (kein Onboarding-Loop)
- [ ] Log speichern / aktualisieren am selben Tag
- [ ] Trainer `trainer@eintracht-demo.de` → `/trainer/dashboard` — Ampel sichtbar
- [ ] Trainer sieht **keine** Phasen/Symptome — nur FIT / MODIFIED / REST / NO_DATA
- [ ] `/player/settings` — Export + Löschen-Link vorhanden
- [ ] PWA: Manifest + Offline-Seite `/~offline` (optional zeigen)

---

## 7. Nach dem Pitch

- Demo-Passwort rotieren oder Accounts deaktivieren
- `service_role` nie im Frontend committen
- Bei Pilot-Zusage: P1 aus `docs/sprints/00-ROADMAP.md` starten
