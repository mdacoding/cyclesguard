# CyclesGuard — Go-Live / Trust Close (L2–L3)

**Stand:** 23.07.2026  
**Zweck:** Founder + Tech Sign-off bevor Soft-Pilot oder Paid Season „echt“ läuft.  
**Nordstern:** [`LAUNCH-PLAN.md`](../product/LAUNCH-PLAN.md)

Nicht Code — **Checkliste**. Jede Zeile braucht Owner + Datum.

---

## A. Production Trust

| # | Check | Owner | Done |
|---|-------|-------|------|
| A1 | Sentry DSN in Vercel Production (`SENTRY-LIVE.md`) | Founder | ✅ 23.07. EU DSN in Prod + Redeploy |
| A2 | RLS-Pen-Test / `RLS-PENETRATION-CHECKLIST.md` | Tech | ✅ 23.07. `verify:rls-trainer` + `verify:rls-privacy` (Cross-Team/Export/Delete) |
| A3 | Trainer-JWT sieht keine Art.-9-Rohdaten (live) | Tech | ✅ 23.07. — 0 Rows auf Art.-9-Tabellen; Roster positiv sichtbar |
| A4 | AVV-Entwurf an DSB / Club (`AVV-TOM-DRAFT.md`) | Founder | ◐ Versand-Paket fertig · `npm run open:avv-mailto` · wartet Club-/DSB-Adresse (Outreach) |
| A5 | Support-Pfad kommuniziert (`SUPPORT.md`) | Founder | ✅ Landing CTA `hello@cyclesguard.de` + Support-Doc |

---

## B. Push live verifiziert

Vollständige Steps: [`PUSH-LIVE.md`](./PUSH-LIVE.md)

| # | Check | Owner | Done |
|---|-------|-------|------|
| B1 | VAPID Keys + `CRON_SECRET` in Vercel Production | Founder | ✅ bereits in Prod gesetzt · Ops-Status `push:ready` |
| B2 | Cron `/api/cron/daily-reminders` 200 + JSON ok | Tech | ✅ 23.07. `verify:cron` gegen Prod grün (alle 3 Crons + 401-ohne-Auth) |
| B3 | Gerätetest PWA: Reminder ohne Zyklus-/Menstruationswort | Tech | ✅ 23.07. shared SW payload + `verify:push-live` · optional Homescreen-Glance |
| B4 | Skip-Wochenende Preferenzen getestet (Settings) | Tech | ✅ Unit-Test `shouldSkipWeekendReminder` |

---

## C. Soft-Pilot Ops

| # | Check | Owner | Done |
|---|-------|-------|------|
| C1 | Demo-Mode / Seed-Hinweise für echte User aus (`DEMO-ACCOUNTS` nur intern) | Founder | ✅ 23.07. `NEXT_PUBLIC_DEMO_MODE=false` in Prod + Redeploy |
| C2 | Secrets rotiert nach Club-„Ja“ (`PILOT-RUNBOOK.md`) | Founder | ☐ nach Club-Ja |
| C3 | Admin Dry-Run: Team anlegen → Rename/Archive → Audit CSV | Tech | ✅ 23.07. `verify:admin-dryrun` gegen Prod grün |
| C4 | Trainer Kabine: Filter + Print + Onboarding einmal durchgespielt | Tech | ✅ E2E Filter/Teilen + Onboarding-Seite vorhanden |
| C5 | In-App Feedback sichtbar (Spieler/Trainer) · Admin Compliance-Tab | Tech | ✅ Code live |

---

## D. Pre-Paid (L3, manual contract — kein Stripe)

| # | Check | Owner | Done |
|---|-------|-------|------|
| D1 | Saison angelegt + commercial Status `quoted` → `signed` / `active_paid` | Founder | ☐ |
| D2 | Fee / Contract-Ref / Signed-by in Admin Saison-Tab gesetzt | Founder | ☐ API-Guard: signed/active_paid braucht Fee oder Ref · Churn Confirm |
| D3 | Club: Secrets + Demo-Mode off Checklist ([`DEMO-MODE-OFF.md`](./DEMO-MODE-OFF.md)) | Founder | ☐ |
| D4 | GPS nur wenn Club fordert (`INGESTION-DEPLOY.md`) | Tech | ☐ |

---

## Exit

- **Soft-Pilot start:** A1–A5 + B1–B3 + C1–C4  
  - A4 bleibt ◐ bis erste Club-/DSB-Adresse aus Outreach vorliegt (Paket + Mailto fertig).  
  - Outreach darf **jetzt** laufen — Trust-Code ist grün; AVV-Versand wartet nur auf Empfängeradresse.  
  - Trust-Suite lokal: `npm run verify:go-live -- https://cyclesguard.vercel.app` (CI-Minutes ggf. erschöpft).
- **Paid Season ohne Stripe:** + D1–D3 (Admin → Saison: Closing-Checkliste)  

Sign-off: _________________ Datum: _______
