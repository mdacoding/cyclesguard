# CyclesGuard — Implementation Plan

**Stand:** 22.07.2026  
**Nordstern:** [`LAUNCH-PLAN.md`](../product/LAUNCH-PLAN.md) — bestmögliches Feature-Set für maximalen Launch-Erfolg  
**Zeitachsen:** [`FINISH-PLAN.md`](../product/FINISH-PLAN.md)  
**Live:** https://cyclesguard.vercel.app  

```
Pitch ✅ → Soft-Pilot parallel ←→ Launch-Feature-Build (L1→L3) → Paid Club → Multi-Tenant (L4)
```

---

## Leitentscheidung

Wir optimieren **nicht** auf Minimal-Exit.  
Wir bauen **Launch-Qualität**: Kabinen-Trainer-Flow, Pilot-Proof-KPIs, Onboarding, Trust — parallel Outreach/Soft-Pilot.

| Spur | Tempo |
|------|--------|
| **Product Engineering** | L1→L3 aus `LAUNCH-PLAN.md` (L1–L3 Code weitgehend ✅) |
| **Founder GTM** | Outreach, AVV, Termin — kritischer Sales-Pfad |
| **Nach erstem Paid Proof** | L4 Stripe / Multi-Tenant |

---

## Aktueller Build-Fokus

| Item | Status |
|------|--------|
| L1 Kabine / KPIs / Trainer-Onboarding | ✅ |
| L2 Admin Tabs + Feedback + GO-LIVE Docs | ✅ Code |
| L3 Manual Paid Season UX | ✅ Code |
| Trust Sign-off (Sentry, RLS, Push live) | ⬜ Founder/Tech — [`GO-LIVE.md`](../pitch/GO-LIVE.md) |

**Als Nächstes (nicht Code-first):** Founder GTM + Trust-Sign-off. Engineering nur noch Pilot-Polish / Club-Anforderungen (GPS on demand).

---

## Founder parallel

1. [`OUTREACH.md`](../pitch/OUTREACH.md)  
2. [`TERMIN-BEREIT.md`](../pitch/TERMIN-BEREIT.md)  
3. [`GO-LIVE.md`](../pitch/GO-LIVE.md) — Sentry, Push, RLS, AVV  
4. AVV/DSB (`docs/privacy/AVV-TOM-DRAFT.md`)

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
