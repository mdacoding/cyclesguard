# CyclesGuard — 4-Wochen Finish Plan (Club Product Paid-Ready)

**Stand:** 22.07.2026  
**North star Exit:** Ein Club kann Soft-Pilot → bezahlte Saison ohne Engineering-Handarbeit fahren.  
**Nicht-Ziel:** Stripe Self-Serve, Multi-Tenant Marketplace (Stage D).

Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

---

## Prinzipien (Best Practices)

1. **Privacy first** — Trainer/Admin nie Art.-9-Rohdaten; Service-Role nur mit Masking/Counts  
2. **Idempotente Ops** — Invite/Seed/Archive wiederholbar  
3. **Kleine Migrationen** — eine Schema-Änderung = eine Migration, MCP + Repo synchron  
4. **Fail closed** bei GPS-Delete wenn Ingestion konfiguriert  
5. **Scope Freeze W4** — nur Bugs aus Pilot, keine Feature-Expansion  
6. **Manual commercial path** vor Payment-Rails (Vertrauen → Vertrag → später Billing)

---

## Woche 1 — Harden (Engineering)

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

## Woche 2 — Compliance & Pilot-Ops (Founder + Tech)

| Item | Owner |
|------|--------|
| AVV/TOM mit DSB finalisieren | Founder |
| RLS-Checkliste abhaken (`docs/privacy/RLS-PENETRATION-CHECKLIST.md`) | Tech |
| Sentry DSN Production (`SENTRY-LIVE.md`) | Founder |
| Runbook Dry-Run: Admin CSV, Archive, Season Contract | Tech |
| Secrets-Rotation Checklist vor Echtdaten | Founder |

---

## Woche 3 — Paid Packaging

| Item | Owner |
|------|--------|
| Soft-Pilot → Season Offer (2–5k) nutzen | Founder |
| Contract-Felder in Admin pflegen | Club Admin / Founder |
| `clubs.billing_email` / legal_name gesetzt | Ops |
| Support-E-Mail erreichbar | Founder |

---

## Woche 4 — Buffer

- Nur Feedback-Bugs aus Soft-Pilot  
- Keine neuen Produktflächen  
- Exit-Review gegen Kriterien in `00-ROADMAP.md`

---

## Deferred (nach Exit)

| Item | Warum später |
|------|----------------|
| Stripe / Invoices | Nach 1. bezahltem Vertrag |
| Self-Serve Multi-Tenant | Nach 2. Club |
| Live GPS Host | Club muss Tracker nennen |
| Custom Domain | Nach Pilot-Zusage |
| GPS-ML / Risk Models | Kein Paid-Gate |

---

## Risiken

| Risiko | Mitigation |
|--------|------------|
| Pitch verzögert sich | W1–W2 Code/Compliance trotzdem fertig |
| AVV blockiert Produktiv | Soft-Pilot nur mit Freiwilligen + Entwurf; Paid erst nach Signatur |
| Auth Rate-Limits bei Bulk | Cap 50, Delay, Rate-Limit pro Actor |
