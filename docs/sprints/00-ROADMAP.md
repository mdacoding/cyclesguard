# CyclesGuard — Implementation Plan: Pitch → Pilot → Paid Club Product

**Stand:** 22.07.2026 · **Ziel: Club Product paid-ready in ≤4 Wochen**  
**Live:** https://cyclesguard.vercel.app  
**Repo:** https://github.com/mdacoding/cyclesguard  

```
Pitch ✅ → Outreach → Soft-Pilot → Paid Club Product (Exit) → Multi-Tenant (später)
                              ↑ 4-Wochen-Fertigstellung
```

---

## Definition „SaaS fertig“ (Exit-Kriterien)

**Fertig = Stage C Paid Club Product für 1 Club** — nicht Stage D Self-Serve.

| # | Kriterium | Bar |
|---|-----------|-----|
| 1 | Club-Ops ohne SQL | Admin: Teams, Saison, Invite/CSV, Audit |
| 2 | Soft-Pilot → Paid | AVV unterschrieben, Secrets rotiert, Demo-Mode off |
| 3 | Saison kommerziell | Vertrag manuell erfasst (Status/Fee/Ref) — **ohne Stripe** |
| 4 | Privacy hält | RLS-Checkliste + maskierte Ampel |
| 5 | Ops | Sentry DSN, Migrationen live, Support-Pfad dokumentiert |

**Explizit nicht nötig für Exit:** Stripe, Self-Serve Signup, GPS-ML, Multi-Club-Marketplace.

Detailplan: [`../product/FINISH-PLAN-4W.md`](../product/FINISH-PLAN-4W.md)

---

## 4-Wochen-Zeitplan (optimiert)

| Woche | Fokus | Deliverables |
|-------|--------|--------------|
| **W1** | Harden + Migrations | Invite-Metadata-Fix, Archive-Filter, Adherence-Query, Rate-Limit Bulk, Season-Contract-Schema, Support-Doc |
| **W2** | Compliance + Pilot-Ops | AVV finalisieren, RLS abhaken, Sentry DSN, Runbook Dry-Run |
| **W3** | Paid Packaging | Offer 1-Pager live nutzen, Contract-UI, Support-E-Mail, Soft-Cap Teams |
| **W4** | Buffer | Nur Pilot-Bugs + Polish; Scope Freeze |

---

## Founder parallel (&lt;30 Min., fortlaufend)

1. [`docs/pitch/TERMIN-BEREIT.md`](../pitch/TERMIN-BEREIT.md) — Auth-URLs  
2. [`docs/pitch/OUTREACH.md`](../pitch/OUTREACH.md) — LinkedIn  
3. [`docs/pitch/SENTRY-LIVE.md`](../pitch/SENTRY-LIVE.md) — DSN setzen  

---

## Nach Club-„Ja“ (48h)

Siehe **[`docs/pitch/PILOT-RUNBOOK.md`](../pitch/PILOT-RUNBOOK.md)**.

---

## Status-Snapshot

| Bereich | Status |
|---------|--------|
| Pitch + Soft-Pilot Tech | ✅ |
| Club Product A–E + Ops 1–7 | ✅ |
| W1 Harden / Contract Schema | ✅ diese Iteration |
| AVV unterschrieben | ⬜ Founder/DSB |
| Sentry DSN Production | ⬜ Founder |
| Stripe / Multi-Tenant | ⏸ nach Exit |

---

## Schnellzugriff

| Doc | Zweck |
|-----|--------|
| [FINISH-PLAN-4W.md](../product/FINISH-PLAN-4W.md) | Wochenplan + Best Practices |
| [SAAS-PLAN.md](../product/SAAS-PLAN.md) | Stages A–D |
| [SUPPORT.md](../pitch/SUPPORT.md) | Support-Pfad Soft-Pilot/Paid |
| [PILOT-RUNBOOK.md](../pitch/PILOT-RUNBOOK.md) | Soft-Pilot Start |
| [SENTRY-LIVE.md](../pitch/SENTRY-LIVE.md) | Observability |
| [INGESTION-DEPLOY.md](../pitch/INGESTION-DEPLOY.md) | GPS (nur nach Tracker) |
