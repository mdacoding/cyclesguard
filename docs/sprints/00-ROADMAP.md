# CyclesGuard — Implementation Plan

**Stand:** 23.07.2026  
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
| Founder Sign-off (Sentry DSN, Demo-Mode off, AVV) | ⬜ [`GO-LIVE.md`](../pitch/GO-LIVE.md) — Push/Cron Secrets bereits in Prod |

**Als Nächstes:** Sentry DSN setzen · Demo-Mode vor Soft-Pilot auf `false` · Outreach/AVV. Kein Feature-Bloat ohne Club-Nachfrage.

**Daily-Ship-Log (jeden Tag ein Fortschritt):**

| Datum | Was |
|-------|-----|
| 22.07. | L1–L3 Feature-Set + Audit-Fixes (Club-Scope Feedback, Heute-KPI) |
| 23.07. | Trust live: Cron/RLS/Admin-Dry-Run grün; `team_members` RLS-Rekursion gefixt (015/016); Fehlprojekt entfernt |

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
