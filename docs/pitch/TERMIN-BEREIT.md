# Termin-bereit — Checkliste (nur noch anfragen)

**Live:** https://cyclesguard.vercel.app  
**Privacy:** https://cyclesguard.vercel.app/privacy · **Soft-Pilot:** https://cyclesguard.vercel.app/pilot  
**Stand:** 23.07.2026

Wenn diese Liste abgehakt ist, bleibt nur noch **Outreach** (`OUTREACH.md`) — parallel an mehrere Clubs ok.

---

## Produkt / Demo (erledigt)

- [x] Vercel Production  
- [x] Supabase + Migrationen + Seed  
- [x] Login / Logout / Trainer-Ampel / Spielerinnen-UI  
- [x] Pitch-Skript, Datenschutz `/privacy`, Soft-Pilot `/pilot`  
- [x] Smoke-Test / Trust-Suite lokal (`verify:go-live`)  
- [x] Club-agnostisch (nicht nur Eintracht)  

---

## Einmalig vor dem Versand (5–15 Min.)

### 1. Supabase Auth-URLs (wichtig)

Dashboard → Project `jgtqtuwtrulwehrtcydf` → **Authentication → URL Configuration**:

| Feld | Wert | Status |
|------|------|--------|
| Site URL | `https://cyclesguard.vercel.app` | ☐ Founder einmal bestätigen |
| Redirect URLs | `https://cyclesguard.vercel.app/auth/callback` | ☐ |
| | `http://localhost:3000/auth/callback` | ☐ |
| | `https://cyclesguard.vercel.app/auth/set-password` oder `https://cyclesguard.vercel.app/**` | ☐ Invite → Passwort |

E-Mail-Texte (Invite/Reset): [`AUTH-EMAIL-TEMPLATES.md`](./AUTH-EMAIL-TEMPLATES.md) — einmal in Dashboard einfügen.

### 2. Kontakt in Docs

Absender in Outreach ist gesetzt (**M. Daud Abdulle** / `m.daud-abdulle@web.de`). Optional Telefon in LinkedIn ergänzen.

### 3. PDF für Meeting (optional, 2 Min.)

1. https://cyclesguard.vercel.app/privacy bzw. `/pilot` öffnen  
2. Drucken → **Als PDF speichern**  
3. Alternativ Markdown: `DATENSCHUTZ-DOSB-1-PAGER.md` / `PILOTANGEBOT.md` / `SPIELERINNEN-INFO.md`  

### 4. Security (nach erstem Kontakt / vor echtem Pilot)

- [ ] Supabase Secret Key rotieren (Settings → API Keys), dann in Vercel Env aktualisieren  
- [ ] Demo-Passwort nur intern; nach Pitch an echte Spielerinnen neue Accounts  

*(Für den reinen Vorstellungstermin mit Demo-Accounts nicht blockierend.)*

### 5. Demo 1× üben

`DEMO-SCRIPT.md` — 5 Minuten: Trainer Ampel → Lisa Weber Log → zurück Trainer → Privacy.

---

## Parallel (Wartezeit) — erledigt im Repo

- Soft-Pilot 48h-Start: `PILOT-RUNBOOK.md`
- Push Live: `PUSH-LIVE.md`
- AVV/TOM-Entwurf: `../privacy/AVV-TOM-DRAFT.md`
- Invite-Flow gehärtet (neu + bestehende User)

## Dann nur noch

→ `OUTREACH.md` öffnen → LinkedIn-Nachricht an Athletik + Medizin senden → Termin vorschlagen.
