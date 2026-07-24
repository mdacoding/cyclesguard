# Multi-Club Ops — ohne Founder-SQL

**Zweck:** Zweiten Verein / Soft-Pilot-Club in der UI anlegen.  
**Live Admin:** https://cyclesguard.vercel.app/admin/teams  
**Stand:** 24.07.2026

Voraussetzung: eingeloggt als `platform_admin` oder Club-Admin des Ziel-Clubs.

---

## A. Neuen Verein anlegen (Platform)

1. `/admin/teams` → Tab **Roster** (oder Overview)  
2. Abschnitt **Verein anlegen (Platform)**  
3. Name speichern → Club erscheint in der Liste  
4. Optional: Club-Admin zuweisen (Platform → Club-Admins API / UI)

API: `POST /api/admin/clubs` · Club-Admins: `/api/platform/club-admins`

---

## B. Team + Saison

1. Team anlegen / bestehendes Team **Club-ID** zuordnen  
2. Saison anlegen (`quoted` / Soft-Pilot oft `pilot_free` commercial)  
3. First-Run-Checkliste im Roster-Tab abhaken

---

## C. Roster ohne Demo-Passwort

1. Trainer oder Club-Admin: Invite per E-Mail / CSV  
2. Spielerin: Mail → Passwort setzen → Consent → Log  
3. Vorlagen:  
   - https://cyclesguard.vercel.app/spielerinnen-info  
   - https://cyclesguard.vercel.app/privacy  
   - https://cyclesguard.vercel.app/trainer/onboarding  

Auth-Mail-Texte: [`AUTH-EMAIL-TEMPLATES.md`](./AUTH-EMAIL-TEMPLATES.md)

---

## D. Isolation / zweites Demo-Team (Tech)

`npm run seed:demo` legt zusätzlich **CyclesGuard Isolation Frauen** + `trainer-b@…` an — für Cross-Team-RLS (`verify:rls-privacy`), nicht für Club-Pitch.

---

## E. Nicht per SQL

| Aufgabe | UI / Script |
|---------|-------------|
| Club anlegen | Admin → Verein anlegen |
| Team ↔ Club | Admin Teams |
| Invites | Trainer Kabine / Admin Roster |
| Rate-Limits Bulk | Postgres `consume_rate_limit` (Migration 018) |

Nach Club-Ja: [`PILOT-RUNBOOK.md`](./PILOT-RUNBOOK.md) · Secrets: [`DEMO-MODE-OFF.md`](./DEMO-MODE-OFF.md)
