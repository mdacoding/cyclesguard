# Soft-Pilot Runbook — Start in 48h nach Club-„Ja“

**Ziel:** Nach Zusage echte Freiwillige onboarden, ohne die Pitch-Demo zu zerstören.  
**Live:** https://cyclesguard.vercel.app

---

## 0. Vorbedingungen (einmalig)

- [ ] Supabase Auth: Site URL = `https://cyclesguard.vercel.app`
- [ ] Redirect URLs enthalten `…/auth/callback`
- [ ] Vercel Env vollständig (`npm run pitch:env-checklist` lokal)
- [ ] Secrets rotieren (Service Role / Secret Key) — siehe Security unten
- [ ] Optional: Custom Domain gesetzt + Auth-URLs angepasst

---

## 1. Demo vs. Pilot trennen

| Umgebung | Zweck | `NEXT_PUBLIC_DEMO_MODE` |
|----------|-------|-------------------------|
| Pitch / Investor | Seed-Accounts sichtbar | `true` |
| Soft-Pilot mit Club | Keine Demo-Hints auf Login | `false` |

**Empfehlung:**

1. Pitch-Demo-Accounts behalten (Seed-Team „Eintracht Frankfurt Frauen“).
2. Für den Pilot ein **neues Team** anlegen (Admin UI `/admin/teams` oder Trainer-Invite auf bestehendem Club-Team).
3. Echte Spielerinnen **nur** per Trainer-Invite / Roster-Add — nie Passwort der Demo teilen.

Demo-Passwort (`CyclesGuard2026!`) bleibt **intern**.

---

## 2. Roster onboarden (Trainer)

1. Trainer einloggen → `/trainer/dashboard`
2. Team wählen
3. Name + E-Mail → **Einladen**
   - Neu: Supabase sendet Invite-Mail → Link → Passwort setzen → Onboarding (Consent) → Dashboard
   - Bereits registriert: wird dem Roster hinzugefügt (ohne zweite Invite-Mail)
4. Ampel prüfen: neue Spielerin erscheint als **NO_DATA**, bis erster Log

Smoke (5 Min.):

1. Test-Mail einladen  
2. Consent bestätigen  
3. Log speichern  
4. Als Trainer Ampel = nicht mehr NO_DATA  

---

## 3. Push-Erinnerungen (optional, empfohlen)

Siehe [PUSH-LIVE.md](./PUSH-LIVE.md).

Mindestens: VAPID Keys + `CRON_SECRET` in Vercel Production gesetzt; Cron `/api/cron/daily-reminders` aktiv.

---

## 4. Feedback-Rhythmus

- Wöchentlicher 20-Min-Call: [PILOT-FEEDBACK.md](./PILOT-FEEDBACK.md)
- Trainer-1-Pager: [TRAINER-ONBOARDING.md](./TRAINER-ONBOARDING.md)
- Rechtliches vor Echtdaten: [AVV-TOM-DRAFT.md](../privacy/AVV-TOM-DRAFT.md)

---

## 5. Security vor Echtdaten

1. Supabase Secret / Service Role rotieren → Vercel Env aktualisieren → Redeploy  
2. `CONSENT_IP_SALT` und `CRON_SECRET` neu generieren  
3. Demo-Mode aus (`NEXT_PUBLIC_DEMO_MODE=false`)  
4. Prüfen: keine Secrets in Git / Chat-Logs  

---

## 6. Rollback / Pause

- Pilot pausieren: Trainer lädt keine neuen Spielerinnen ein; App bleibt online.
- Spielerin aussteigen: Settings → Konto löschen (Art. 17) oder Trainer entfernt Membership (Admin).
- Notfall: Vercel Deployment previous → Redeploy; Auth Site URL unverändert lassen.

---

## 7. Definition of Done (Soft-Pilot Kickoff)

- [ ] ≥5 echte Freiwillige im Roster  
- [ ] Mindestens 1 Trainer nutzt Ampel an Trainingstag  
- [ ] AVV/TOM mit DSB abgestimmt oder terminiert  
- [ ] Push getestet **oder** bewusst deaktiviert dokumentiert  
- [ ] Erster Feedback-Call terminiert  
