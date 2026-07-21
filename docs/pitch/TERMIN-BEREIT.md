# Termin-bereit — Checkliste (nur noch anfragen)

**Live:** https://cyclesguard.vercel.app  
**Stand:** 21.07.2026

Wenn diese Liste abgehakt ist, bleibt nur noch **Outreach** (`OUTREACH.md`).

---

## Produkt / Demo (erledigt)

- [x] Vercel Production  
- [x] Supabase + Migrationen + Seed  
- [x] Login / Logout / Trainer-Ampel / Spielerinnen-UI  
- [x] Pitch-Skript, Datenschutz-Doc, Pilotangebot, Product-Brief  
- [x] Smoke-Test HTTP grün  

---

## Einmalig vor dem Versand (5–15 Min.)

### 1. Supabase Auth-URLs (wichtig)

Dashboard → Project `jgtqtuwtrulwehrtcydf` → **Authentication → URL Configuration**:

| Feld | Wert |
|------|------|
| Site URL | `https://cyclesguard.vercel.app` |
| Redirect URLs | `https://cyclesguard.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` |

Speichern. Danach einmal Login + Logout auf der Live-URL testen (bereits von dir ok — nach URL-Änderung kurz wiederholen).

### 2. Kontakt in Docs

In `DATENSCHUTZ-DOSB-1-PAGER.md` und `PILOTANGEBOT.md` steht jetzt **CyclesGuard**; vor Versand an den Club deine **persönliche E-Mail** in der Outreach-Nachricht eintragen (`DEINE_EMAIL` in `OUTREACH.md`).

### 3. PDF für Meeting (optional, 2 Min.)

1. Datei im Browser/Editor öffnen  
2. Drucken → **Als PDF speichern**  
3. Mitnehmen / anhängen: Datenschutz-1-Pager + Pilotangebot  

### 4. Security (nach erstem Kontakt / vor echtem Pilot)

- [ ] Supabase Secret Key rotieren (Settings → API Keys), dann in Vercel Env aktualisieren  
- [ ] Demo-Passwort nur intern; nach Pitch an echte Spielerinnen neue Accounts  

*(Für den reinen Vorstellungstermin mit Demo-Accounts nicht blockierend.)*

### 5. Demo 1× üben

`DEMO-SCRIPT.md` — 5 Minuten: Trainer Ampel → Lisa Weber Log → zurück Trainer → Privacy.

---

## Dann nur noch

→ `OUTREACH.md` öffnen → LinkedIn-Nachricht an Athletik + Medizin senden → Termin vorschlagen.
