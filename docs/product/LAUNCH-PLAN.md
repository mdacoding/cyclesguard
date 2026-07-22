# CyclesGuard — Launch Success Plan (Nordstern)

**Stand:** 22.07.2026  
**Leitprinzip:** Bestmögliches Feature-Set für **maximalen Launch-Erfolg** — parallel Soft-Pilot/GTM.  
**Nicht:** Minimal-MVP einfrieren. **Auch nicht:** Feature-Bloat ohne Kabinen-Nutzen.

Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md) · Stages: [`SAAS-PLAN.md`](./SAAS-PLAN.md)

---

## Was „Launch-Erfolg“ heißt

Ein Club startet Soft-Pilot oder Paid Season und erlebt:

1. **Spielerinnen loggen täglich** (&lt;30s, Push, Offline)  
2. **Trainer steuert die Einheit** (Ampel + Kabine-Flow in Sekunden)  
3. **Admin sieht Adherence/Ops** ohne Gesundheits-Rohdaten  
4. **Vertrauen hält** (Privacy/AVV/Sentry/Support)  
5. **Demo & Onboarding** brauchen keinen Founder im Call  

Zeitlich ehrlich: Soft-Pilot 8–12 Wochen + GTM laufen **parallel** zum Feature-Ausbau (~3–6 Monate Engineering für Launch-Qualität). Billing/Self-Serve = nach erstem bezahlten Proof, außer es blockiert Closing.

---

## Feature-Set für maximalen Launch

### Must-have (Launch-Bar)

| Bereich | Features | Status |
|---------|----------|--------|
| Spielerin | Log, Consent, Welcome-Tips, Historie/Insights, Push, Offline/PWA, Export/Löschen | ✅ |
| Trainer | Ampel + Empfehlung, Invite, Team-Switch, Refresh | ✅ |
| Trainer Kabine | Heute-geloggt, Status-Counts, Print/Share, Filter | ✅ |
| Admin | Teams, CSV, Saison, Contract-Felder, Audit, Archive | ✅ |
| Admin Proof | Pilot-KPI (Adherence %) | ✅ |
| Admin UX | Tabs Roster / Saison / Compliance + Ops-Status | ✅ |
| Paid Path | Fee / Ref / Signed-by + Club Billing/Legal manuell | ✅ |
| Feedback | In-App Score + Admin-View | ✅ |
| Trust | RLS, AVV, Retention, Support, GO-LIVE, Ops-Status API | ✅ Code · ⬜ Founder Sign-off |
| Sales | Landing, Pitch-Pack, Seed-Demo | ✅ |
| Onboarding | Consent → Welcome · Trainer in-app · Admin Seed | ✅ |

### Should-have (Launch-Qualität ↑)

| Feature | Warum | Status |
|---------|--------|--------|
| Trainer First-Run in-app | Weniger Founder-Call | ✅ |
| Admin UX Tabs | Weniger Power-User-Chaos | ✅ |
| Feedback-Capture im Pilot | Produkt lernt | ✅ |
| Push/Sentry Env sichtbar in Admin | Production-Feel | ✅ Ops-Status · ⬜ DSN/Keys in Vercel |
| Optional 1 GPS-Provider | Nur wenn Club fordert | ⬜ on demand (`INGESTION-DEPLOY`) |

### Post-Launch (bewusst später)

Stripe Self-Serve, Multi-Club-Marketplace, White-Label, EN i18n, SSO, GPS flächig, ML-Risk, Physio-Portal.

---

## Engineering-Phasen (Launch-Qualität)

| Phase | Fokus | Outcome |
|-------|--------|---------|
| **L1** | Trainer Kabine-UX, Pilot-KPIs, Trainer-Onboarding | ✅ **fertig** |
| **L2** | Admin Tabs, Feedback, Player Welcome, Ops-Status, Trust-Docs | ✅ **fertig** (Founder: DSN/Push Keys) |
| **L3** | Manual Paid UX, Club Billing, Demo-off Docs | ✅ **fertig** (Founder: Closing) |
| **L4 (nach Proof)** | Stripe, Multi-Tenant, Scale | Echtes Plattform-SaaS |

**Engineering L1–L3 = done.** Offene Punkte sind Founder/Ops (Sentry DSN, VAPID live, AVV, Outreach).

GTM (Outreach, AVV, Termin) läuft **durchgängig parallel** — das ist der Sales-kritische Pfad.

---

## Was wir bewusst nicht aufblasen

- Art.-9 an Trainer / medizinische Diagnostik  
- Stripe vor Soft-Pilot-Proof (außer Closing verlangt es)  
- GPS-ML / Multi-Tracker vor Ampel-Habit  
- Rewrite der Ampel-Engine (`lib/trainer-status.ts`) — härten, nicht neu erfinden  

---

## Verknüpfte Docs

| Doc | Rolle |
|-----|--------|
| Dieser Plan | **Nordstern Launch** |
| [`FINISH-PLAN.md`](./FINISH-PLAN.md) | Realistische M1/M2/M3-Zeitachsen |
| [`FINISH-PLAN-4W.md`](./FINISH-PLAN-4W.md) | M1 Tech-Checklist |
| [`GO-LIVE.md`](../pitch/GO-LIVE.md) | Trust / Push / Pre-Paid Sign-off |
| [`DEMO-MODE-OFF.md`](../pitch/DEMO-MODE-OFF.md) | Secrets vor echten Usern |
| [`SUPPORT.md`](../pitch/SUPPORT.md) | Support |
