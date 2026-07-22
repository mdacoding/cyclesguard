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
| Spielerin | Log, Consent, Historie/Insights, Push, Offline/PWA, Export/Löschen | ✅ stark |
| Trainer | Ampel + Empfehlung, Invite, Team-Switch, Refresh | ✅ Basis |
| Trainer Kabine | Heute-geloggt, Status-Counts, Print/Share, Filter | ✅ |
| Admin | Teams, CSV, Saison, Contract-Felder, Audit, Archive | ✅ |
| Admin Proof | Pilot-KPI (Adherence %) | ✅ |
| Trust | RLS, AVV-Pfad, Retention, Support-Doc | ✅ Docs / ⬜ Sign-off |
| Sales | Landing, Pitch-Pack, Seed-Demo | ✅ |
| Onboarding | Spielerin Consent ✅ · Trainer in-app ✅ · Admin Seed ✅ |

### Should-have (Launch-Qualität ↑)

| Feature | Warum |
|---------|--------|
| Trainer First-Run in-app | Weniger Founder-Call |
| Admin UX Tabs (Roster / Saison / Compliance) | Weniger Power-User-Chaos |
| Push live verifiziert + Custom Domain | Production-Feel |
| Optional 1 GPS-Provider | Nur wenn Club fordert |
| Feedback-Capture im Pilot | Produkt lernt |

### Post-Launch (bewusst später)

Stripe Self-Serve, Multi-Club-Marketplace, White-Label, EN i18n, SSO, GPS flächig, ML-Risk, Physio-Portal.

---

## Engineering-Phasen (Launch-Qualität)

| Phase | Fokus | Outcome |
|-------|--------|---------|
| **L1 (jetzt)** | Trainer Kabine-UX, Pilot-KPIs, Trainer-Onboarding, Trust-Close | Demo wirkt „produktionsreif“ |
| **L2 (während Pilot)** | Admin Tabs, First-Run Player/Trainer, Feedback-Loop, Push verified | Habit + Ops skalieren |
| **L3 (Pre-Paid)** | Manual Paid UX, Secrets/Demo-off, optional 1 GPS | Closing ohne Stripe |
| **L4 (nach Proof)** | Stripe, Multi-Tenant, Scale | Echtes Plattform-SaaS |

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
| [`SUPPORT.md`](../pitch/SUPPORT.md) | Support |
