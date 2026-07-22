# CyclesGuard — Realistischer Fertigstellungsplan

**Stand:** 22.07.2026  
**Klarstellung:** „SaaS fertig“ ist **kein** 4-Wochen-Ziel. Die frühere „4W“-Formulierung meint nur einen **engen Engineering-Meilenstein** (Club Product technisch paid-fähig) — nicht Marktreife, nicht Multi-Tenant, nicht „erster bezahlter Club durch“.

Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md) · Stages: [`SAAS-PLAN.md`](./SAAS-PLAN.md)

---

## Drei Zeithorizonte (ehrlich)

| Meilenstein | Was „fertig“ heißt | Realistische Dauer | Treiber |
|-------------|-------------------|--------------------|---------|
| **M1 — Club Product tech-ready** | 1 Club kann Ops ohne SQL; Vertrag manuell; Privacy/Ops gehärtet | **~4–6 Wochen** Engineering (teilweise ✅) | Code, Migrationen, Docs |
| **M2 — Erster bezahlter Club** | Soft-Pilot gelaufen, AVV signiert, Season-Vertrag | **~3–6 Monate** ab jetzt | GTM, DSB, Pilot 8–12 Wochen, Vertrauen |
| **M3 — Multi-Tenant SaaS** | Stripe/Self-Serve, 2+ Clubs, Support-SLA | **~6–12 Monate** ab M2 | Billing, Tenancy, Sales Repeat |

```
Jetzt ──M1 tech (~4–6 W)──► Soft-Pilot (8–12 W) ──M2 Paid──► 2. Club ──M3 SaaS──►
         ↑ nur Engineering      ↑ Kalender + Club         ↑ Business
```

**Warum länger als 4 Wochen bis „richtigem SaaS“?**

1. Soft-Pilot ist selbst **8–12 Wochen** geplant (`SAAS-PLAN` Pricing) — das allein sprengt jeden 4-Wochen-Exit.  
2. Club-Sales (Outreach → Termin → Ja) dauert oft Wochen bis Monate — **nicht steuerbar durch Code**.  
3. AVV/DSB ist ein **Rechtsprozess**, kein Sprint.  
4. Echtes SaaS (Stage D) braucht Billing, Multi-Club, Support — bewusst nach Pilot-Proof.

---

## M1 — Club Product tech-ready (~4–6 Wochen)

**Ziel:** Produkt kann einen Club produktiv betreiben, sobald der Club „Ja“ sagt.

| Status | Item |
|--------|------|
| ✅ | Ampel, Invite, Offline, Admin, Landing, GPS-Bridge-Docs |
| ✅ | Bulk CSV, Archive, Season commercial fields, Harden Invites |
| ⬜ | Sentry DSN Production |
| ⬜ | RLS-Checkliste manuell signiert |
| ⬜ | Runbook Dry-Run mit Demo-Admin |

**Exit M1:** Tech blockiert Soft-Pilot/Paid nicht mehr.

---

## M2 — Erster bezahlter Club (~3–6 Monate)

| Phase | Dauer (Richtwert) | Inhalt |
|-------|-------------------|--------|
| Outreach + Termin | 2–8 Wochen | Parallel zu M1 |
| Soft-Pilot | 8–12 Wochen | Echte Freiwillige, Feedback |
| AVV + Paid Offer | parallel / danach | DSB, Season 2–5k |
| Go-Live Paid | 1–2 Wochen | Secrets, Demo-Mode off, Contract `signed`/`active_paid` |

**Exit M2:** Ein Club zahlt / hat unterschriebenen Saisonvertrag; Produkt im Alltag stabil.

---

## M3 — Multi-Tenant SaaS (~6–12 Monate nach M2)

Nur nach Beweis aus M2:

- Stripe (oder Lemon) + Rechnungen  
- Self-Serve / Multi-Club ohne Founder-SQL  
- Observability + Support-SLA  
- Optional: GPS live flächig, Custom Domains  

---

## Was wir parallel maximieren (ohne Fake-Timeline)

| Spur | Tempo |
|------|--------|
| **Engineering** | Weiter M1 härten + Pilot-Feedback einbauen — **kein** Stage-D vor M2 |
| **Founder GTM** | Outreach jetzt — das ist der kritische Pfad zu M2 |
| **Legal** | AVV-Entwurf → DSB früh anbinden |
| **Nicht jetzt** | Stripe, Self-Serve, GPS-ML |

---

## Entscheidung (CTO)

| Frage | Antwort |
|-------|---------|
| Ist das Produkt in 4 Wochen „SaaS fertig“? | **Nein** — nur M1 tech-ready möglich |
| Wann erster bezahlter Club? | **Monate**, abhängig von Club + Pilot |
| Wann Multi-Tenant SaaS? | **Nach** bezahltem Proof, typisch ½–1 Jahr |

Alte Datei `FINISH-PLAN-4W.md` bleibt als **M1-Detail** erhalten; dieser Plan ist die **führende Timeline**.
