# CyclesGuard — M1 Engineering Checklist (Club Product tech-ready)

**Stand:** 22.07.2026  
**Scope:** Nur **Meilenstein M1** (~4–6 Wochen Engineering) — **nicht** „SaaS fertig“.  
**Gesamt-Timeline:** [`FINISH-PLAN.md`](./FINISH-PLAN.md)

**North star dieses Docs:** Ein Club kann Ops ohne SQL fahren, sobald er „Ja“ sagt.  
**Nicht-Ziel hier:** Stripe, Soft-Pilot-Abschluss, Multi-Tenant.

Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

---

## Prinzipien (Best Practices)

1. **Privacy first** — Trainer/Admin nie Art.-9-Rohdaten; Service-Role nur mit Masking/Counts  
2. **Idempotente Ops** — Invite/Seed/Archive wiederholbar  
3. **Kleine Migrationen** — eine Schema-Änderung = eine Migration, MCP + Repo synchron  
4. **Fail closed** bei GPS-Delete wenn Ingestion konfiguriert  
5. **Manual commercial path** vor Payment-Rails  
6. Kein Fake: Soft-Pilot und Paid liegen auf **M2** (Monate), nicht in diesem Checklist

---

## M1 Harden (Engineering)

| Item | Best Practice | Done |
|------|---------------|------|
| `app_metadata` merge bei Trainer-Role | Kein Metadata-Wipe | ✅ |
| Kein Role-Clobber Admin→Trainer | Guard elevated roles | ✅ |
| Trainer-Teams nur `active` | Kein Archive-Leak | ✅ |
| Admin Adherence aggregiert | Weniger N+1 / weniger Log-Scans | ✅ |
| Bulk-Invite Cap + Delay + Rate-Limit | Auth-Rate-Limits respektieren | ✅ |
| Season commercial fields | Manueller Vertrag ohne Stripe | ✅ |
| Support-Doc | Klarer Escalation-Pfad | ✅ |
| Archived teams UI toggle | Restore/Lifecycle | ✅ |

---

## Noch offen für M1-Exit

| Item | Owner |
|------|--------|
| Sentry DSN Production | Founder |
| RLS-Checkliste manuell signieren | Tech |
| Runbook Dry-Run mit Demo-Admin | Tech |

---

## Danach (nicht M1)

| Item | Meilenstein |
|------|-------------|
| Soft-Pilot 8–12 Wochen | **M2** |
| AVV unterschrieben + Paid Season | **M2** |
| Stripe / Self-Serve | **M3** |
