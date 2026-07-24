# CyclesGuard — Implementation Plan

**Stand:** 24.07.2026  
**Nordstern:** [`LAUNCH-PLAN.md`](../product/LAUNCH-PLAN.md) — bestmögliches Feature-Set für maximalen Launch-Erfolg  
**Zeitachsen:** [`FINISH-PLAN.md`](../product/FINISH-PLAN.md)  
**Live:** https://cyclesguard.vercel.app  

```
Pitch ✅ → Soft-Pilot parallel ←→ L1–L3 Engineering ✅ → Paid Club → Multi-Tenant (L4)
```

---

## Leitentscheidung

Wir optimieren **nicht** auf Minimal-Exit.  
Wir bauen **Launch-Qualität**: Kabinen-Trainer-Flow, Pilot-Proof-KPIs, Onboarding, Trust — parallel Outreach/Soft-Pilot.

| Spur | Tempo |
|------|--------|
| **Product Engineering** | **L1–L3 ✅** — weiter nur Pilot-Polish / Club-Demand |
| **Founder GTM** | Outreach, AVV, Termin — kritischer Sales-Pfad |
| **Nach erstem Paid Proof** | L4 Stripe / Multi-Tenant |

---

## L1–L3 Status

| Phase | Status |
|-------|--------|
| L1 Kabine / KPIs / Trainer-Onboarding | ✅ |
| L2 Tabs / Feedback / Welcome / Ops-Status | ✅ |
| L3 Paid UX / Club Billing / Demo-off Docs | ✅ |
| Trust-Checks automatisiert + live verifiziert | ✅ 23.07. — Cron/RLS/Admin-Dry-Run gegen Prod grün |
| Founder Sign-off (Sentry DSN, Demo-Mode off, AVV) | ◐ Sentry ✅ · Demo-Mode off ✅ · AVV-Versand Founder — [`FOUNDER-SECRETS.md`](../pitch/FOUNDER-SECRETS.md) |

**Als Nächstes (Eng):** Einheitsblatt · Trust Preview · Einheit-Fenster · Trainer-Aktiv-Gate — ship.  
**Als Nächstes (Founder):** Outreach-Tracking · Auth-URLs + Mail-Templates · Impressum-Straße · AVV bei Club-Adresse.

**Daily-Ship-Log (jeden Tag ein Fortschritt):**

| Datum | Was |
|-------|-----|
| 24.07. | Markt-Hebel Soft-Pilot: Kabine Einheitsblatt/Stationen · Player Trust Preview · Einheit-Log-Fenster · Admin Trainer-Kabine-7d Gate |
| 24.07. | Soft-Pilot Hebel: Kabine Ampel-Gruppen + Session-Freeze persist · Push-Coverage Roster/Scorecard · Wochen-Call Clipboard + Funnel · Player Quick-Log „wie zuletzt“ |
| 24.07. | Soft-Pilot Features (ohne Club-Rückruf): Trainer coach-safe Nudge + Kabine Session-Freeze · Player Streak-Ziel/Miss-Recovery · Admin Adherence-Sparkline 7d |
| 24.07. | Prod-Build repariert (Seed/Sentry Types) · `/spielerinnen-info` live |
| 24.07. | SaaS Pilot-Polish: team-status Zod-Allowlist · Postgres rate-limit 018 · Auth-Mail + Multi-Club Docs · Admin First-Run Links · invite/sentry verify |
| 22.07. | L1–L3 Feature-Set + Audit-Fixes (Club-Scope Feedback, Heute-KPI) |
| 23.07. | Trust live + Demo off + CI-Secrets/Lean-CI + Push-Payload-Tests + **Sentry EU DSN Prod** (`sentry:ok`) + AVV-Mail-Entwurf |
| 23.07. | Soft-Pilot UX: Passwort setzen nach Invite, Forgot-Password, Invite-only Login (Demo off), PWA-Install-Banner, Landing Soft-Pilot-CTA first |
| 23.07. | Soft-Pilot Day-1: Trainer Empty/Resend-Invite, Consent/Delete Inline-Errors, Welcome Install + #log, Admin Empty-Roster CTA + Inline-Confirms |
| 23.07. | Kabine ohne GPS-Rauschen · Player Streak-Chip · Offline-Pending sichtbar · Trainer Roster-Entfernen · Seed-Symptom-Keys · Auth-Redirect Docs |
| 23.07. | Soft-Pilot KPI: Adherence-Ziel klar · Roster aktiv/still 7d · Trainer Tage-seit-Log · Manual-Contract Guard/Churn · Season Dry-Run · Trust-Docs sync |
| 23.07. | Club-Product: Feedback-CSV · Closing-Checkliste D1–D2 · Ended-Confirm · Pilot-Scorecard Compliance · GO-LIVE Outreach klar |
| 23.07. | Kabine Ampel-Trend 7d · Angebot-Mailto · Season/Feedback Dry-Run Exports |
| 23.07. | Adherence CSV · Scorecard NO_DATA%/Ø-by-Role für Pilot-Wochen-Call |
| 23.07. | Multi-Club Launch: `/privacy` · `/pilot` · Landing Für-Vereine · Outreach parallel · Admin First-Run + Verein anlegen |
| 23.07. | Trust-URLs: `/datenschutz` · `/impressum` · Login-Footer · 15-Min DEMO-SCRIPT |
| 23.07. | Outreach-Tracking (Eintracht/Wolfsburg/Bayern) · `seed:demo` neutral · Trainer last_seen + Scorecard |

---

## Founder parallel

1. [`OUTREACH.md`](../pitch/OUTREACH.md)  
2. [`TERMIN-BEREIT.md`](../pitch/TERMIN-BEREIT.md)  
3. [`GO-LIVE.md`](../pitch/GO-LIVE.md) — Sentry, Push, RLS JWT, AVV  
4. [`DEMO-MODE-OFF.md`](../pitch/DEMO-MODE-OFF.md)

---

## Nach Club-„Ja“

[`PILOT-RUNBOOK.md`](../pitch/PILOT-RUNBOOK.md)

---

## Schnellzugriff

| Doc | Zweck |
|-----|--------|
| [LAUNCH-PLAN.md](../product/LAUNCH-PLAN.md) | **Feature-Nordstern Launch** |
| [FINISH-PLAN.md](../product/FINISH-PLAN.md) | Monate-Timeline M1–M3 |
| [SAAS-PLAN.md](../product/SAAS-PLAN.md) | Stages A–D |
| [GO-LIVE.md](../pitch/GO-LIVE.md) | Trust Sign-off |
| [SUPPORT.md](../pitch/SUPPORT.md) | Support |
| [INGESTION-DEPLOY.md](../pitch/INGESTION-DEPLOY.md) | GPS optional |
