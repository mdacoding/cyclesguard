# CyclesGuard — Go-Live / Trust Close (L2–L3)

**Stand:** 22.07.2026  
**Zweck:** Founder + Tech Sign-off bevor Soft-Pilot oder Paid Season „echt“ läuft.  
**Nordstern:** [`LAUNCH-PLAN.md`](../product/LAUNCH-PLAN.md)

Nicht Code — **Checkliste**. Jede Zeile braucht Owner + Datum.

---

## A. Production Trust

| # | Check | Owner | Done |
|---|-------|-------|------|
| A1 | Sentry DSN in Vercel Production (`SENTRY-LIVE.md`) | Founder | ☐ |
| A2 | RLS-Pen-Test / `RLS-PENETRATION-CHECKLIST.md` | Tech | ✅ Automatisiert: `npm run verify:rls-trainer` + CI-Job `rls-trainer-check` |
| A3 | Trainer-JWT sieht keine Art.-9-Rohdaten (live) | Tech | ✅ Script prüft `cycle_logs`/`player_consents`/`push_subscriptions`/`session_summaries` gegen Live-Supabase |
| A4 | AVV-Entwurf an DSB / Club (`AVV-TOM-DRAFT.md`) | Founder | ☐ |
| A5 | Support-Pfad kommuniziert (`SUPPORT.md`) | Founder | ☐ |

---

## B. Push live verifiziert

Vollständige Steps: [`PUSH-LIVE.md`](./PUSH-LIVE.md)

| # | Check | Owner | Done |
|---|-------|-------|------|
| B1 | VAPID Keys + `CRON_SECRET` in Vercel Production | Founder | ☐ |
| B2 | Cron `/api/cron/daily-reminders` 200 + JSON ok | Tech | ✅ Automatisiert: `npm run verify:cron -- <url>` (einmal gegen Prod ausführen) |
| B3 | Gerätetest PWA: Reminder ohne Zyklus-/Menstruationswort | Tech | ☐ |
| B4 | Skip-Wochenende Preferenzen getestet (Settings) | Tech | ☐ |

---

## C. Soft-Pilot Ops

| # | Check | Owner | Done |
|---|-------|-------|------|
| C1 | Demo-Mode / Seed-Hinweise für echte User aus (`DEMO-ACCOUNTS` nur intern) | Founder | ☐ |
| C2 | Secrets rotiert nach Club-„Ja“ (`PILOT-RUNBOOK.md`) | Founder | ☐ |
| C3 | Admin Dry-Run: Team anlegen → CSV Invite → Audit CSV | Tech | ☐ |
| C4 | Trainer Kabine: Filter + Print + Onboarding einmal durchgespielt | Tech | ☐ |
| C5 | In-App Feedback sichtbar (Spieler/Trainer) · Admin Compliance-Tab | Tech | ☐ |

---

## D. Pre-Paid (L3, manual contract — kein Stripe)

| # | Check | Owner | Done |
|---|-------|-------|------|
| D1 | Saison angelegt + commercial Status `quoted` → `signed` / `active_paid` | Founder | ☐ |
| D2 | Fee / Contract-Ref / Signed-by in Admin Saison-Tab gesetzt | Founder | ☐ |
| D3 | Club: Secrets + Demo-Mode off Checklist ([`DEMO-MODE-OFF.md`](./DEMO-MODE-OFF.md)) | Founder | ☐ |
| D4 | GPS nur wenn Club fordert (`INGESTION-DEPLOY.md`) | Tech | ☐ |

---

## Exit

- **Soft-Pilot start:** A1–A5 + B1–B3 + C1–C4  
- **Paid Season ohne Stripe:** + D1–D3  

Sign-off: _________________ Datum: _______
