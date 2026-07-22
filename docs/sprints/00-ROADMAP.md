# CyclesGuard — Implementation Plan: Pitch → Pilot → SaaS

**Stand:** 22.07.2026 · **Führende Timeline:** [`FINISH-PLAN.md`](../product/FINISH-PLAN.md)  
**Live:** https://cyclesguard.vercel.app  
**Repo:** https://github.com/mdacoding/cyclesguard  

```
Pitch ✅ → Outreach → Soft-Pilot (8–12 W) → Paid Club (M2) → Multi-Tenant SaaS (M3)
              │              ↑
              └─ M1 tech-ready (~4–6 W Engineering, parallel)
```

**Wichtig:** „SaaS fertig“ ≠ 4 Wochen. 4–6 Wochen = nur **M1 Club Product tech-ready**. Erster bezahlter Club und echtes Multi-Tenant brauchen **Monate**.

---

## Meilensteine (Kurz)

| ID | Ziel | Dauer | Status |
|----|------|-------|--------|
| **M1** | Club Product tech-ready (1 Club ohne SQL) | ~4–6 Wochen Eng | ~90 % |
| **M2** | Erster bezahlter Club (nach Soft-Pilot + AVV) | ~3–6 Monate | ⬜ GTM-kritisch |
| **M3** | Multi-Tenant SaaS (Stripe, 2+ Clubs) | ~6–12 Monate nach M2 | ⏸ |

Detail + Begründung: [`../product/FINISH-PLAN.md`](../product/FINISH-PLAN.md)  
M1-Engineering-Checklist: [`../product/FINISH-PLAN-4W.md`](../product/FINISH-PLAN-4W.md) (nur M1, nicht Gesamt-SaaS)

---

## Definitionen

### M1 „tech-ready“ (eng)

| # | Kriterium |
|---|-----------|
| 1 | Admin: Teams, Saison, Invite/CSV, Audit |
| 2 | Season commercial fields (manuell, ohne Stripe) |
| 3 | Privacy-Masking + RLS-Checkliste ausführbar |
| 4 | Support-Doc, Sentry-Hook, Migrationen |

### M2 „erster bezahlter Club“ (Geschäft)

| # | Kriterium |
|---|-----------|
| 1 | Soft-Pilot mit echten Nutzerinnen gelaufen |
| 2 | AVV unterschrieben |
| 3 | Season-Vertrag `signed` / `active_paid` |
| 4 | Demo-Mode off, Secrets rotiert |

### M3 „SaaS“ (Plattform)

Stripe/Self-Serve, Multi-Club ohne Founder-Ops, Support-SLA.

---

## Founder jetzt (kritischer Pfad zu M2)

1. [`TERMIN-BEREIT.md`](../pitch/TERMIN-BEREIT.md) — Auth-URLs  
2. [`OUTREACH.md`](../pitch/OUTREACH.md) — Termin anfragen  
3. [`SENTRY-LIVE.md`](../pitch/SENTRY-LIVE.md) — DSN setzen  
4. DSB/AVV früh anbinden (`docs/privacy/AVV-TOM-DRAFT.md`)

---

## Nach Club-„Ja“

[`PILOT-RUNBOOK.md`](../pitch/PILOT-RUNBOOK.md) — Soft-Pilot 8–12 Wochen, dann Paid.

---

## Engineering-Status (M1)

| Bereich | Status |
|---------|--------|
| Pitch + Soft-Pilot Tech | ✅ |
| Club Product A–E + Ops + Harden | ✅ |
| Sentry DSN / RLS Sign-off | ⬜ Founder/Tech |
| Soft-Pilot Proof / AVV / Paid | ⬜ M2 |
| Stripe / Multi-Tenant | ⏸ M3 |

---

## Schnellzugriff

| Doc | Zweck |
|-----|--------|
| [FINISH-PLAN.md](../product/FINISH-PLAN.md) | **Realistische Gesamt-Timeline** |
| [FINISH-PLAN-4W.md](../product/FINISH-PLAN-4W.md) | Nur M1 Engineering |
| [SAAS-PLAN.md](../product/SAAS-PLAN.md) | Stages A–D |
| [SUPPORT.md](../pitch/SUPPORT.md) | Support |
| [PILOT-RUNBOOK.md](../pitch/PILOT-RUNBOOK.md) | Soft-Pilot Start |
